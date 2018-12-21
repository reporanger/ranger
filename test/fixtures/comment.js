module.exports = ({
   number = 55,
   isPrivate = false
}) => ({
   name: 'issue_comment',
   payload: {
      action: 'deleted',
      comment: {
         url: 'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/comments/448738894',
         html_url: 'https://github.com/dawnlabs/test-issue-bot/issues/54#issuecomment-448738894',
         issue_url: 'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/54',
         id: 448738894,
         node_id: 'MDEyOklzc3VlQ29tbWVudDQ0ODczODg5NA==',
         user: { 
            login: 'issue-maintainer-dev[bot]',
            id: 38635471,
            node_id: 'MDM6Qm90Mzg2MzU0NzE=',
            avatar_url: 'https://avatars1.githubusercontent.com/in/11380?v=4',
            gravatar_id: '',
            url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D',
            html_url: 'https://github.com/apps/issue-maintainer-dev',
            followers_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/followers',
            following_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/following{/other_user}',
            gists_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/gists{/gist_id}',
            starred_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/starred{/owner}{/repo}',
            subscriptions_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/subscriptions',
            organizations_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/orgs',
            repos_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/repos',
            events_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/events{/privacy}',
            received_events_url: 'https://api.github.com/users/issue-maintainer-dev%5Bbot%5D/received_events',
            type: 'Bot',
            site_admin: false 
         },
         created_at: '2018-12-19T20:49:39Z',
         updated_at: '2018-12-19T20:49:39Z',
         author_association: 'CONTRIBUTOR',
         body: 'This has been marked to be closed in 10 seconds.'
      },
      issue: { 
         url: 'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/55',
         repository_url: 'https://api.github.com/repos/dawnlabs/test-issue-bot',
         labels_url:
         'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/55/labels{/name}',
         comments_url:
         'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/55/comments',
         events_url:
         'https://api.github.com/repos/dawnlabs/test-issue-bot/issues/55/events',
         html_url: 'https://github.com/dawnlabs/test-issue-bot/issues/55',
         id: 392784673,
         node_id: 'MDU6SXNzdWUzOTI3ODQ2NzM=',
         number: number,
         title: 'test del',
         user: { 
            login: 'raboid',
            id: 3892149,
            node_id: 'MDQ6VXNlcjM4OTIxNDk=',
            avatar_url: 'https://avatars3.githubusercontent.com/u/3892149?v=4',
            gravatar_id: '',
            url: 'https://api.github.com/users/raboid',
            html_url: 'https://github.com/raboid',
            followers_url: 'https://api.github.com/users/raboid/followers',
            following_url: 'https://api.github.com/users/raboid/following{/other_user}',
            gists_url: 'https://api.github.com/users/raboid/gists{/gist_id}',
            starred_url: 'https://api.github.com/users/raboid/starred{/owner}{/repo}',
            subscriptions_url: 'https://api.github.com/users/raboid/subscriptions',
            organizations_url: 'https://api.github.com/users/raboid/orgs',
            repos_url: 'https://api.github.com/users/raboid/repos',
            events_url: 'https://api.github.com/users/raboid/events{/privacy}',
            received_events_url: 'https://api.github.com/users/raboid/received_events',
            type: 'User',
            site_admin: false 
         },
         labels: [{ 
            id: 910420477,
            node_id: 'MDU6TGFiZWw5MTA0MjA0Nzc=',
            url: 'https://api.github.com/repos/dawnlabs/test-issue-bot/labels/duplicate',
            name: 'duplicate',
            color: 'cfd3d7',
            default: true 
         }],
         state: 'open',
         locked: false,
         assignee: null,
         assignees: [],
         milestone: null,
         comments: 1,
         created_at: '2018-12-19T21:29:59Z',
         updated_at: '2018-12-19T21:30:10Z',
         closed_at: null,
         author_association: 'NONE',
         body: '' 
      },
      repository: {
         id: 130609983,
         name: 'test-issue-bot',
         full_name: 'mfix22/test-issue-bot',
         owner: {
           login: 'mfix22',
           id: 8397708,
           avatar_url: 'https://avatars0.githubusercontent.com/u/8397708?v=4',
           gravatar_id: '',
           url: 'https://api.github.com/users/mfix22',
           html_url: 'https://github.com/mfix22',
           followers_url: 'https://api.github.com/users/mfix22/followers',
           following_url: 'https://api.github.com/users/mfix22/following{/other_user}',
           gists_url: 'https://api.github.com/users/mfix22/gists{/gist_id}',
           starred_url: 'https://api.github.com/users/mfix22/starred{/owner}{/repo}',
           subscriptions_url: 'https://api.github.com/users/mfix22/subscriptions',
           organizations_url: 'https://api.github.com/users/mfix22/orgs',
           repos_url: 'https://api.github.com/users/mfix22/repos',
           events_url: 'https://api.github.com/users/mfix22/events{/privacy}',
           received_events_url: 'https://api.github.com/users/mfix22/received_events',
           type: 'User',
           site_admin: false
         },
         private: isPrivate,
         html_url: 'https://github.com/mfix22/test-issue-bot',
         description: null,
         fork: false,
         url: 'https://api.github.com/repos/mfix22/test-issue-bot',
         forks_url: 'https://api.github.com/repos/mfix22/test-issue-bot/forks',
         keys_url: 'https://api.github.com/repos/mfix22/test-issue-bot/keys{/key_id}',
         collaborators_url:
           'https://api.github.com/repos/mfix22/test-issue-bot/collaborators{/collaborator}',
         teams_url: 'https://api.github.com/repos/mfix22/test-issue-bot/teams',
         hooks_url: 'https://api.github.com/repos/mfix22/test-issue-bot/hooks',
         issue_events_url: 'https://api.github.com/repos/mfix22/test-issue-bot/issues/events{/number}',
         events_url: 'https://api.github.com/repos/mfix22/test-issue-bot/events',
         assignees_url: 'https://api.github.com/repos/mfix22/test-issue-bot/assignees{/user}',
         branches_url: 'https://api.github.com/repos/mfix22/test-issue-bot/branches{/branch}',
         tags_url: 'https://api.github.com/repos/mfix22/test-issue-bot/tags',
         blobs_url: 'https://api.github.com/repos/mfix22/test-issue-bot/git/blobs{/sha}',
         git_tags_url: 'https://api.github.com/repos/mfix22/test-issue-bot/git/tags{/sha}',
         git_refs_url: 'https://api.github.com/repos/mfix22/test-issue-bot/git/refs{/sha}',
         trees_url: 'https://api.github.com/repos/mfix22/test-issue-bot/git/trees{/sha}',
         statuses_url: 'https://api.github.com/repos/mfix22/test-issue-bot/statuses/{sha}',
         languages_url: 'https://api.github.com/repos/mfix22/test-issue-bot/languages',
         stargazers_url: 'https://api.github.com/repos/mfix22/test-issue-bot/stargazers',
         contributors_url: 'https://api.github.com/repos/mfix22/test-issue-bot/contributors',
         subscribers_url: 'https://api.github.com/repos/mfix22/test-issue-bot/subscribers',
         subscription_url: 'https://api.github.com/repos/mfix22/test-issue-bot/subscription',
         commits_url: 'https://api.github.com/repos/mfix22/test-issue-bot/commits{/sha}',
         git_commits_url: 'https://api.github.com/repos/mfix22/test-issue-bot/git/commits{/sha}',
         comments_url: 'https://api.github.com/repos/mfix22/test-issue-bot/comments{/number}',
         issue_comment_url:
           'https://api.github.com/repos/mfix22/test-issue-bot/issues/comments{/number}',
         contents_url: 'https://api.github.com/repos/mfix22/test-issue-bot/contents/{+path}',
         compare_url: 'https://api.github.com/repos/mfix22/test-issue-bot/compare/{base}...{head}',
         merges_url: 'https://api.github.com/repos/mfix22/test-issue-bot/merges',
         archive_url: 'https://api.github.com/repos/mfix22/test-issue-bot/{archive_format}{/ref}',
         downloads_url: 'https://api.github.com/repos/mfix22/test-issue-bot/downloads',
         issues_url: 'https://api.github.com/repos/mfix22/test-issue-bot/issues{/number}',
         pulls_url: 'https://api.github.com/repos/mfix22/test-issue-bot/pulls{/number}',
         milestones_url: 'https://api.github.com/repos/mfix22/test-issue-bot/milestones{/number}',
         notifications_url:
           'https://api.github.com/repos/mfix22/test-issue-bot/notifications{?since,all,participating}',
         labels_url: 'https://api.github.com/repos/mfix22/test-issue-bot/labels{/name}',
         releases_url: 'https://api.github.com/repos/mfix22/test-issue-bot/releases{/id}',
         deployments_url: 'https://api.github.com/repos/mfix22/test-issue-bot/deployments',
         created_at: '2018-04-22T21:40:03Z',
         updated_at: '2018-04-22T23:48:13Z',
         pushed_at: '2018-04-22T21:40:03Z',
         git_url: 'git://github.com/mfix22/test-issue-bot.git',
         ssh_url: 'git@github.com:mfix22/test-issue-bot.git',
         clone_url: 'https://github.com/mfix22/test-issue-bot.git',
         svn_url: 'https://github.com/mfix22/test-issue-bot',
         homepage: null,
         size: 0,
         stargazers_count: 0,
         watchers_count: 0,
         language: null,
         has_issues: true,
         has_projects: true,
         has_downloads: true,
         has_wiki: true,
         has_pages: false,
         forks_count: 0,
         mirror_url: null,
         archived: false,
         open_issues_count: 4,
         license: null,
         forks: 0,
         open_issues: 4,
         watchers: 0,
         default_branch: 'master'
      },
   }
})