// You can import your modules
const { createRobot } = require('probot')
const app = require('..')

const payload = require('./fixtures/labeled')

class MockJob {
  constructor (data) {
    this.data = data
    this.save = jest.fn(() => {
      return this
    })
    this.id = Math.random().toString(36).slice(2)
  }
  setId (id) {
    this.id = id
    return this
  }
  delayUntil (delay) {
    this.delay = delay
    return this
  }
}

class MockQueue {
  constructor () {
    this.jobs = {}
    this.process = jest.fn()
    this.on = jest.fn()
    this.getJob = jest.fn(id => {
      return this.jobs[id]
    })
    this.createJob = jest.fn(data => {
      const job = new MockJob(data)
      this.jobs[job.id] = job
      return job
    })
  }
}

const config = `
labels:
  - duplicate
  - wontfix
  - invalid
  - stale
delayTime: 7 days

comment: This issue has been marked to be closed in $CLOSE_TIME.

labelConfig:
  duplicate:
    delayTime: 1s
    comment: $LABEL issue created! Closing in $CLOSE_TIME . . .
  stale: false
  invalid: true
`

describe('Bot', () => {
  let robot
  let github
  let queue
  beforeEach(() => {
    queue = new MockQueue()
    robot = createRobot()
    app(robot, queue)
    github = {
      issues: {
        createComment: jest.fn(),
        edit: jest.fn()
      },
      repos: {
        getContent: jest.fn(() => ({ data: { content: Buffer.from(config).toString('base64') } }))
      }
    }
    robot.auth = () => Promise.resolve(github)
  })

  test('Will schedule a job', async () => {
    await robot.receive(payload())
    expect(github.issues.createComment).toHaveBeenCalledWith({
      number: 7,
      owner: 'mfix22',
      repo: 'test-issue-bot',
      body: 'duplicate issue created! Closing in 1 second . . .'
    })
    const data = {
      number: 7,
      owner: 'mfix22',
      repo: 'test-issue-bot',
      installation_id: 135737
    }
    expect(queue.createJob).toHaveBeenCalledWith(data)
    expect(queue.jobs[Object.keys(queue.jobs)[0]].id).toBe('mfix22:test-issue-bot:7')
    expect(queue.jobs[Object.keys(queue.jobs)[0]].data).toEqual(data)
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
