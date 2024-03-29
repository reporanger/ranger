const nock = require('nock')
const { Probot, ProbotOctokit } = require('probot')

const ranger = require('..')

const payload = require('./fixtures/labeled')
const commentPayload = require('./fixtures/comment')
const addedPayload = require('./fixtures/added')
const installedPayload = require('./fixtures/installed')
const synchronizedPayload = require('./fixtures/synchronized')
const mergedPayload = require('./fixtures/merged')

const { MAINTAINERS, CONCLUSION, STATE } = require('../src/constants')

const wait = (delay = 0) => new Promise((resolve) => setTimeout(resolve, delay))

class MockJob {
  constructor(data, queue) {
    this.queue = queue
    this.id = Math.random().toString(36).slice(2)
    this.data = data
    this.save = jest.fn(() => {
      let fn
      fn = async (data) => {
        try {
          await this.queue.processor(data)
        } catch (e) {
          if (e.message !== 'Retry job') {
            console.error(e)
          }
          if (this.retriesLeft && --this.retriesLeft >= 0) {
            await fn(this)
            // setTimeout(fn, this.retryDelay, this)
          }
        }
      }
      this.to = setTimeout(fn, Math.min(this.delay - Date.now(), 2147483647), this)
      return Promise.resolve(this)
    })
    this.setId = jest.fn((id) => {
      delete this.queue.jobs[this.id]
      this.id = id
      this.queue.jobs[this.id] = this
      return this
    })
    this.delayUntil = jest.fn((delay) => {
      this.delay = delay
      return this
    })
    this.retries = jest.fn((/* retriesLeft */) => {
      // only retry once in tests
      this.retriesLeft = 1
      return this
    })
    this.backoff = jest.fn((retryFormat, retryDelay) => {
      this.retryFormat = retryFormat
      this.retryDelay = retryDelay
      return this
    })
  }
}

jest.mock(
  'bee-queue',
  () =>
    class MockQueue {
      constructor(name) {
        this.name = name
        this.jobs = {}
        this.process = jest.fn((fn) => {
          this.processor = fn
        })
        this.on = jest.fn()
        this.getJob = jest.fn((id) => {
          return this.jobs[id]
        })
        this.createJob = jest.fn((data) => {
          const job = new MockJob(data, this)
          this.jobs[job.id] = job
          return job
        })
        this.removeJob = jest.fn((id) => {
          delete this.jobs[id]
          return id
        })
      }
    }
)

jest.mock(
  'analytics-node',
  () =>
    class {
      constructor() {
        this.track = jest.fn()
        this.identify = jest.fn()
      }
    }
)

const config = require('js-yaml').safeLoad(`
labels:
  duplicate:
    action: close
    delay: 5ms
    comment: $LABEL issue created! Closing in $DELAY . . .
  invalid: close
  wontfix:
    action: close
    delay: 10ms
    comment: false
  snooze:
    action: open
    delay: 10ms
    comment: false
  merge:
    action: merge
  -1:
    action: close
    delay: -1
    comment: Test comment
  none:
    action: close
    delay: null
    comment: Test comment
  comment:
    action: comment
    message: beep
  comment2:
    action: comment
    message: boop
  comment3: comment
  squash:
    action: merge
  rebase:
    action: merge

comments:
  - action: label # no 'labels' list
  - action: label
    pattern: /duplicate of/i
    labels: 
      - duplicate
  - action: delete_comment
    pattern: +1
  - action: delete_comment
    pattern: $PROFANITY

merges:
  - action: delete_branch
  - action: tag

commits:
  - action: label # no 'labels' list
  - action: label
    pattern: /merge when passing/i
    labels:
      - merge when passing
  - action: label
    pattern: /wont match this pattern/i
    labels:
      - duplicate
  - action: label
    user: reporanger
    labels:
      - author

closes:
  - action: lock
    delay: 0s

default:
  close:
    delay: 1ms
    comment: This issue has been marked to be closed in $DELAY.
`)

let robot
let app
let github
let queue
beforeEach(async () => {
  nock.disableNetConnect()

  robot = new Probot({
    id: 1,
    githubToken: 'test',
    // Disable throttling & retrying requests for easier testing
    Octokit: ProbotOctokit.defaults({
      retry: { enabled: false },
      throttle: { enabled: false },
    }),
  })

  // TODO override ProbotOctokit.defaults to return this
  github = {
    config: {
      get: jest.fn(() => ({ config })),
    },
    issues: {
      createComment: jest.fn(),
      createLabel: jest.fn().mockResolvedValue(),
      addLabels: jest.fn().mockResolvedValue(),
      update: jest.fn((_, data) => Promise.resolve({ data })),
      deleteComment: jest.fn(),
      lock: jest.fn(),
    },
    pulls: {
      get: jest.fn().mockResolvedValue({
        data: {
          mergeable: true,
          mergeable_state: 'clean',
          head: { sha: 0, repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } } },
        },
      }),
      merge: jest.fn(),
      updateBranch: jest.fn().mockResolvedValue({ data: {} }),
    },
    repos: {
      getCommit: jest
        .fn()
        .mockResolvedValue({ data: { commit: { message: 'merge when passing' } } }),
      listTags: jest.fn().mockResolvedValue({
        data: [
          {
            name: '0.0.1',
          },
        ],
      }),
      getCombinedStatusForRef: jest
        .fn()
        .mockResolvedValue({ data: { state: STATE.SUCCESS, statuses: [] } }),
      getBranch: jest.fn().mockResolvedValue({
        data: {
          protected: true,
          protection: {
            enabled: true,
            required_status_checks: {
              contexts: ['Build'],
            },
          },
        },
      }),
    },
    apps: {
      listRepos: jest.fn().mockResolvedValue({
        data: {
          total_count: 5,
          repositories: Array(5).fill({
            private: true,
          }),
        },
      }),
    },
    git: {
      deleteRef: jest.fn().mockResolvedValue(),
      createRef: jest.fn().mockResolvedValue(),
      createTag: jest.fn().mockResolvedValue(),
    },
    checks: {
      listSuitesForRef: jest.fn().mockResolvedValue({ data: { total_count: 0, check_suites: [] } }),
    },
    users: {
      getByUsername: jest.fn().mockResolvedValue({ data: { email: 'test@test.com' } }),
    },
    graphql: jest.fn((query, data) => {
      const secondPage = data.after
      return {
        user: {
          sponsorshipsAsMaintainer: {
            pageInfo: {
              hasNextPage: secondPage ? false : true,
              endCursor: 1,
            },
            nodes: [
              secondPage
                ? { sponsor: { id: 'MDQ6VXNlcjgzOTc3MDg=' } }
                : { sponsor: { id: 'MDQ6NlasdfszOTc3MDg=' } },
            ],
          },
        },
      }
    }),
    auth: () => Promise.resolve(github),
  }

  robot.state.octokit = github

  app = robot.load(ranger)
  queue = app.queue

  jest.spyOn(app.analytics, 'identify')
  jest.spyOn(app.analytics, 'track')
})

afterEach(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

describe.each(['issue', 'pull_request'])('%s', (threadType) => {
  const name = threadType === 'pull_request' ? threadType : 'issues'
  const action = threadType === 'pull_request' ? 'merge' : 'close'

  test('Will not schedule a job for labels not defined in the config', async () => {
    await robot.receive(payload({ name, threadType, labels: ['not-a-valid-label'] }))
    await wait(20)

    expect(queue.createJob).not.toHaveBeenCalled()
  })

  test('Will not act if state is closed', async () => {
    await robot.receive(payload({ name, threadType, state: 'closed' }))
    await wait(20)

    expect(queue.createJob).not.toHaveBeenCalled()
    expect(queue.removeJob).not.toHaveBeenCalledWith('reporanger:test-issue-bot:7:close')
  })

  test('Will remove the job if all actionable labels are removed', async () => {
    await robot.receive(payload({ name, threadType, labels: [] }))

    expect(queue.createJob).not.toHaveBeenCalled()
    expect(queue.removeJob).toHaveBeenCalledWith(`reporanger:test-issue-bot:7:${action}`)
  })

  test('Will comment for each actionable label', async () => {
    await robot.receive(payload({ name, threadType, labels: ['comment', 'comment2'] }))
    await wait()

    // second event should be skipped
    await robot.receive(payload({ name, threadType, labels: ['comment', 'comment2'] }))
    await wait()

    expect(github.issues.createComment).toHaveBeenCalledTimes(2)
    ;['beep', 'boop'].forEach((body) => {
      expect(github.issues.createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          body,
          owner: 'reporanger',
          repo: 'test-issue-bot',
          issue_number: 7,
        })
      )
    })
  })

  test('Will will not comment if no default is provided', async () => {
    await robot.receive(payload({ name, threadType, labels: ['comment3'] }))
    expect(github.issues.createComment).not.toHaveBeenCalled()
  })

  test(`assign label(s) if sponsor opens a ${threadType}`, async () => {
    await robot.receive(payload({ action: 'opened', threadType }))
    await wait()

    expect(github.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 7,
      labels: ['sponsor'],
      owner: 'reporanger',
      repo: 'test-issue-bot',
      mediaType: {
        previews: ['symmetra'],
      },
    })
  })
})

describe('issue', () => {
  test('Will schedule a job', async () => {
    await robot.receive(payload())
    await wait(20)

    expect(github.issues.createComment).toHaveBeenCalledWith({
      issue_number: 7,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      body: 'duplicate issue created! Closing in 5 ms . . .',
    })
    const data = {
      issue_number: 7,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      installation_id: 135737,
      action: 'close',
    }
    expect(queue.createJob).toHaveBeenCalledWith(data)
    expect(queue.jobs[Object.keys(queue.jobs)[0]].id).toBe('reporanger:test-issue-bot:7:close')
    expect(queue.jobs[Object.keys(queue.jobs)[0]].data).toEqual(data)
  })

  test('Will remove the job if an issue is closed', async () => {
    await robot.receive(payload({ action: 'closed', number: 9 }))

    expect(queue.removeJob).toHaveBeenCalledWith('reporanger:test-issue-bot:9:close')
    expect(queue.removeJob).toHaveBeenCalledWith('reporanger:test-issue-bot:9:merge')
    expect(queue.removeJob).toHaveBeenCalledWith('reporanger:test-issue-bot:9:lock')
  })

  test('Labels with `true` config should take action', async () => {
    await robot.receive(payload({ labels: ['invalid'], number: 19 }))
    await wait(20)

    expect(github.issues.createComment).toHaveBeenCalled()
    expect(queue.createJob).toHaveBeenCalled()
  })

  test('Labels with `false` comment config should not send comment', async () => {
    await await robot.receive(payload({ labels: ['wontfix'], number: 11 }))

    expect(github.issues.createComment).not.toHaveBeenCalled()
    expect(queue.createJob).toHaveBeenCalled()

    await wait(20)
    expect(github.issues.update).toHaveBeenCalledTimes(1)
  })

  test('If comment was sent, comment should not be sent again', async () => {
    await robot.receive(payload())
    await robot.receive(payload())

    expect(github.issues.createComment).toHaveBeenCalledTimes(1)

    await wait(20)
    expect(github.issues.update).toHaveBeenCalledTimes(2)
  })

  test('Using negative numbers for delay should not create a job', async () => {
    await await robot.receive(payload({ labels: ['none', '-1'], number: 11 }))

    expect(github.issues.createComment).toHaveBeenCalled()
    expect(queue.createJob).not.toHaveBeenCalled()
  })

  test('Open action should re-open thread', async () => {
    await await robot.receive(payload({ labels: ['snooze'], number: 11 }))

    expect(queue.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'open',
        issue_number: 11,
      })
    )
    await wait(20)
    expect(github.issues.update).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 11,
        state: 'open',
      })
    )
  })
})

describe('pull_request', () => {
  test('Will take action if a label has action `merge`', async () => {
    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 7,
      })
    )

    const data = {
      pull_number: 7,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      installation_id: 135737,
      action: 'merge',
      method: 'merge',
    }

    expect(queue.createJob).toHaveBeenCalledWith(data)
    expect(queue.jobs[Object.keys(queue.jobs)[0]].id).toBe('reporanger:test-issue-bot:7:merge')
    expect(queue.jobs[Object.keys(queue.jobs)[0]].data).toEqual(data)

    await wait(2)

    expect(github.pulls.merge).toHaveBeenCalledWith({
      pull_number: 7,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      sha: 0,
      merge_method: 'merge',
    })
  })

  test('Will not update branch if a pull request is "behind" and branch requires it', async () => {
    github.pulls.get.mockResolvedValue({
      data: {
        mergeable: true,
        mergeable_state: 'behind',
        base: {
          sha: 'base sha',
          user: { login: 'reporanger' },
          repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } },
        },
        head: {
          sha: 'head sha',
          user: { login: 'reporanger' },
          repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } },
        },
      },
    })

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 98,
      })
    )

    await wait(10)

    expect(github.pulls.merge).not.toHaveBeenCalled()
    expect(github.pulls.updateBranch).toHaveBeenCalledWith({
      expected_head_sha: 'head sha',
      owner: 'reporanger',
      pull_number: 98,
      repo: 'test-issue-bot',
      headers: { accept: 'application/vnd.github.lydian-preview+json' },
    })
  })

  test('Will not merge a pull request with state `dirty`', async () => {
    github.pulls.get.mockResolvedValue({
      data: {
        mergeable: true,
        mergeable_state: 'dirty',
        head: { sha: 0, repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } } },
      },
    })

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 98,
      })
    )

    await wait(20)

    expect(github.pulls.merge).not.toHaveBeenCalled()
  })

  test.each([STATE.PENDING, STATE.ERROR, STATE.FAILURE])(
    'Will not merge if current status is %s',
    async (state) => {
      github.repos.getCombinedStatusForRef.mockResolvedValue({
        data: {
          state,
          statuses: ['Fake Status'],
        },
      })

      await robot.receive(
        payload({
          name: 'pull_request',
          threadType: 'pull_request',
          labels: ['merge'],
          number: 7,
        })
      )

      expect(queue.createJob).toHaveBeenCalled()
      await wait()
      expect(github.pulls.merge).not.toHaveBeenCalled()
    }
  )

  test('Will retry job if merge is blocked until it is clean', async () => {
    github.pulls.get
      .mockResolvedValueOnce({
        data: {
          mergeable: true,
          mergeable_state: 'blocked',
          head: { sha: 0, repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } } },
        },
      })
      .mockResolvedValueOnce({
        data: {
          mergeable: true,
          mergeable_state: 'clean',
          head: { sha: 0, repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } } },
        },
      })

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 97,
      })
    )

    await wait(10)

    expect(queue.jobs['reporanger:test-issue-bot:97:merge'].retryFormat).toBe('fixed')

    expect(github.pulls.get).toHaveBeenCalledTimes(2)

    expect(github.pulls.merge).toHaveBeenCalledWith({
      pull_number: 97,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      sha: 0,
      merge_method: 'merge',
    })
  })

  test.each([
    ['merge', ['merge', 'squash', 'rebase']],
    ['squash', ['squash', 'rebase', 'merge']],
    ['rebase', ['rebase', 'merge', 'squash']],
  ])('Will first try each method, starting with "%s"', async (label, order) => {
    github.pulls.merge
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce()

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: [label],
        number: 7,
      })
    )

    await wait(2)
    expect(github.pulls.merge.mock.calls.map((c) => c[0].merge_method)).toEqual(order)
  })

  test.each([
    [null, true], // TODO https://github.com/reporanger/ranger/issues/60
    [CONCLUSION.SUCCESS, true],
    [CONCLUSION.NEUTRAL, true],
    [CONCLUSION.TIMED_OUT, false],
    [CONCLUSION.FAILURE, false],
    [CONCLUSION.SKIPPED, true],
    [CONCLUSION.STALE, false],
    [CONCLUSION.ACTION_REQUIRED, false],
  ])('Will check suites for status: %s', async (conclusion, shouldMerge) => {
    github.pulls.merge.mockResolvedValueOnce()
    github.checks.listSuitesForRef.mockResolvedValue({
      data: { total_count: 1, check_suites: [{ conclusion }] },
    })

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 7,
      })
    )

    await wait(2)
    if (shouldMerge) {
      expect(github.pulls.merge).toHaveBeenCalled()
    } else {
      expect(github.pulls.merge).not.toHaveBeenCalled()
    }
  })

  test('Will remove the existing job if a new label event occurs', async () => {
    github.pulls.get.mockResolvedValue({
      data: {
        mergeable: false,
        mergeable_state: 'clean',
        head: { sha: 0, repo: { name: 'test-issue-bot', owner: { login: 'reporanger' } } },
      },
    })

    queue.jobs['reporanger:test-issue-bot:99:merge'] = true

    await robot.receive(
      payload({
        name: 'pull_request',
        threadType: 'pull_request',
        labels: ['merge'],
        number: 99,
      })
    )

    expect(queue.removeJob).toHaveBeenCalledWith('reporanger:test-issue-bot:99:merge')
  })

  test('Can delete branches after merging', async () => {
    await robot.receive(mergedPayload())

    expect(github.git.deleteRef).toHaveBeenCalledWith({
      owner: 'Codertocat',
      ref: 'heads/reporanger-patch-1',
      repo: 'Hello-World',
    })
  })

  test('Will not try to delete branches on "unknown repository" or forks', async () => {
    await robot.receive(mergedPayload({ repo: null }))
    await robot.receive(mergedPayload({ repo: { fork: true } }))

    expect(github.git.deleteRef).not.toHaveBeenCalled()
  })

  test.each([
    ['no', '0.0.2'],
    ['patch', '0.0.2'],
    ['minor', '0.1.0'],
    ['major', '1.0.0'],
  ])('Can create tags after merging with %s label', async (label, tag) => {
    await robot.receive(mergedPayload({ labels: [label] }))
    await wait(2)

    const sha = 'a244454d959a49f53aa60768d117d3eeaa0c552e'

    expect(github.git.createTag).toHaveBeenCalledWith({
      owner: 'Codertocat',
      repo: 'Hello-World',
      message: 'Update README.md (#3)',
      type: 'commit',
      object: sha,
      tag,
    })
    expect(github.git.createRef).toHaveBeenCalledWith({
      owner: 'Codertocat',
      repo: 'Hello-World',
      ref: `refs/tags/${tag}`,
      sha,
    })
  })

  test('Will not create a tag when merged into not the default branch', async () => {
    await robot.receive(mergedPayload({ labels: ['Major'], base: 'docs' }))
    await wait(2)

    expect(github.git.createTag).not.toHaveBeenCalled()
    expect(github.git.createRef).not.toHaveBeenCalled()
  })

  test.each(['opened', 'synchronize'])(
    'Will take action on a maintainer commit message when PR is %s',
    async (action) => {
      await robot.receive(synchronizedPayload({ action }))
      await wait()

      expect(github.issues.addLabels).toHaveBeenCalledTimes(1)
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        issue_number: 4,
        labels: ['merge when passing'],
        owner: 'ranger',
        repo: 'ranger-test',
        mediaType: {
          previews: ['symmetra'],
        },
      })
    }
  )

  test('commits allows for "user" filter', async () => {
    const addLabelPayload = {
      owner: 'ranger',
      repo: 'ranger-test',
      issue_number: 4,
      labels: ['author'],
      mediaType: {
        previews: ['symmetra'],
      },
    }

    await robot.receive(synchronizedPayload({ action: 'synchronize' }))
    await wait()

    expect(github.issues.addLabels).not.toHaveBeenCalledWith(addLabelPayload)

    await robot.receive(synchronizedPayload({ action: 'synchronize', login: 'reporanger' }))
    await wait()

    expect(github.issues.addLabels).toHaveBeenCalledWith(addLabelPayload)
  })

  test('Will not take action on a non-maintainer commit message', async () => {
    await robot.receive(synchronizedPayload({ author_association: 'CONTRIBUTOR' }))

    expect(github.issues.addLabels).not.toHaveBeenCalled()
  })
})

describe('comment', () => {
  test('Will remove the job if the comment is deleted', async () => {
    const number = 55

    await robot.receive(commentPayload({ number }))

    expect(queue.createJob).not.toHaveBeenCalled()
    expect(queue.removeJob).toHaveBeenCalledWith(`reporanger:test-issue-bot:${number}:close`)
    expect(queue.removeJob).toHaveBeenCalledWith(`reporanger:test-issue-bot:${number}:merge`)
  })
  describe('created', () => {
    test('deleting comments', async () => {
      await robot.receive(
        commentPayload({
          action: 'created',
          body: '+1',
        })
      )

      expect(github.issues.deleteComment).toHaveBeenCalledWith({
        comment_id: 448738894,
        owner: 'reporanger',
        repo: 'test-issue-bot',
      })
    })
    test('deleting profanity', async () => {
      await robot.receive(
        commentPayload({
          action: 'created',
          body: 'damn',
        })
      )

      expect(github.issues.deleteComment).toHaveBeenCalledWith({
        comment_id: 448738894,
        owner: 'reporanger',
        repo: 'test-issue-bot',
      })
    })
    test.each(MAINTAINERS)(
      `by %s's will trigger actions if the payload is correct`,
      async (author_association) => {
        const number = 55

        await robot.receive(
          commentPayload({
            number,
            action: 'created',
            body: 'Duplicate of #54',
            author_association,
          })
        )

        expect(github.issues.addLabels).toHaveBeenCalledWith({
          issue_number: number,
          labels: ['duplicate'],
          owner: 'reporanger',
          repo: 'test-issue-bot',
          mediaType: {
            previews: ['symmetra'],
          },
        })
      }
    )
    test.each(['duplicate', 'duplicate #54'])(
      'will not trigger if payload is invalid %#',
      async (body) => {
        const number = 55

        await robot.receive(
          commentPayload({
            number,
            action: 'created',
            author_association: 'OWNER',
            body,
          })
        )

        expect(github.issues.addLabels).not.toHaveBeenCalled()
      }
    )
  })
})

describe('closes', () => {
  test('Will lock a thread after it has been closed', async () => {
    await robot.receive(payload({ action: 'closed', number: 9 }))

    expect(queue.createJob).toHaveBeenCalledWith({
      action: 'lock',
      installation_id: 135737,
      issue_number: 9,
      owner: 'reporanger',
      repo: 'test-issue-bot',
    })

    await wait()

    expect(github.issues.lock).toHaveBeenCalledWith({
      action: 'lock',
      installation_id: 135737,
      issue_number: 9,
      owner: 'reporanger',
      repo: 'test-issue-bot',
    })
  })
})

describe('installation', () => {
  test.each([
    (repos) => addedPayload({ repositories_added: repos }),
    (repos) => installedPayload({ repositories: repos }),
  ])('Will take action when repos are added', async (createPayload) => {
    const repos = [{ name: 'ranger-0' }, { name: 'ranger-1' }]

    await robot.receive(createPayload(repos))

    const newLabels = [
      {
        name: 'merge when passing',
        color: 'FF851B',
        description: 'Merge the PR automatically once all status checks have passed',
      },
      {
        name: 'patch version',
        color: '99cef9',
        description: 'Automatically create a new patch version tag after PR is merged',
      },
      {
        name: 'minor version',
        color: '6EBAF7',
        description: 'Automatically create a new minor version tag after PR is merged',
      },
      {
        name: 'major version',
        color: '1E8DE7',
        description: 'Automatically create a new major version tag after PR is merged',
      },
    ]

    repos.forEach(({ name: repo }) => {
      newLabels.forEach((l) => {
        expect(github.issues.createLabel).toHaveBeenCalledWith({
          owner: 'ranger',
          repo,
          ...l,
          mediaType: {
            previews: ['symmetra'],
          },
        })
      })
    })
  })

  test('Will only throw on createLabel if error is not of type "already_exists"', async () => {
    app.log.error = jest.fn()
    github.issues.createLabel.mockRejectedValueOnce({
      message: 'Repo alread exists', // <--- this is not a real error message
      errors: [{ code: 'already_exists' }],
    })

    const repos = [{ name: 'ranger-0' }, { name: 'ranger-1' }]

    await robot.receive(installedPayload({ repositories: repos }))

    expect(app.log.error).not.toHaveBeenCalled()

    github.issues.createLabel.mockRejectedValueOnce({
      message: JSON.stringify({ errors: [{ status: 'unknown error' }] }),
    })

    await robot.receive(installedPayload({ repositories: repos }))
    expect(app.log.error).toHaveBeenCalled()
  })
})

describe('billing', () => {
  beforeEach(() => {
    app.log.error = jest.fn()
  })

  test.each([
    // Paid plan
    {
      type: 'User',
      marketplace_purchase: {
        on_free_trial: false,
        plan: {
          bullets: ['Unlimited public repositories', '5 private repositories'],
        },
      },
    },
    // On free trial
    {
      type: 'User',
      marketplace_purchase: {
        on_free_trial: true,
        plan: {
          bullets: ['Unlimited public repositories', '1 private repositories'],
        },
      },
    },
  ])('Will schedule job is private billing is correct: %#', async (data) => {
    github.apps.getSubscriptionPlanForAccount = () => ({ data })

    await await await robot.receive(payload({ isPrivate: true }))
    expect(queue.createJob).toHaveBeenCalledWith({
      issue_number: 7,
      owner: 'reporanger',
      repo: 'test-issue-bot',
      installation_id: 135737,
      action: 'close',
    })
  })

  test.each([
    [
      'Repo must have an associated account',
      () => {
        throw new Error('No associated account')
      },
    ],
    ['Account must contain marketplace purchase', {}],
    [
      'Repo owner must match account type',
      {
        type: 'Organization',
        marketplace_purchase: {},
      },
    ],
    [
      'Private repos are not supported in open source plan',
      {
        // On Open Source plan
        type: 'User',
        marketplace_purchase: {
          on_free_trial: false,
          plan: {
            number: 1,
          },
        },
      },
    ],
    [
      'Number of installed repos must be less than maximum for purchase',
      {
        type: 'User',
        marketplace_purchase: {
          on_free_trial: false,
          plan: {
            bullets: ['Unlimited public repositories', '1 private repositories'],
          },
        },
      },
    ],
  ])('%s', async (_, data) => {
    github.apps.getSubscriptionPlanForAccount = () => ({
      data: typeof data === 'function' ? data() : data,
    })
    await robot.receive(payload({ isPrivate: true }))
    expect(queue.createJob).not.toHaveBeenCalled()
  })
})

describe('analytics', () => {
  test.each([
    (repos) => addedPayload({ repositories_added: repos }),
    (repos) => installedPayload({ repositories: repos }),
  ])('Will track installations', async (createPayload) => {
    const repos = [
      { name: 'ranger/test-0', private: true },
      { name: 'ranger/test-1', private: false },
    ]

    await robot.receive(createPayload(repos))

    expect(app.analytics.identify).toHaveBeenCalledWith({
      userId: 42,
      traits: {
        name: 'ranger',
        username: 'ranger',
        type: 'User',
        email: 'test@test.com',
      },
    })
    expect(app.analytics.track).toHaveBeenCalledWith({
      userId: 42,
      event: 'Repos added',
      properties: {
        count: 2,
        private_count: 1,
        repos: ['ranger/test-0', 'ranger/test-1'],
      },
    })
  })
})
