# Ranger 🤠

> Ease the burden of repository maintainers

## Inspiration / Use Cases

#### Merging PRs

Potential labels: `merge when passing`, `docs`

Plotly allows all PRs marked :dancer: and with a passing build to be merged. Instead they could use Ranger and add a :dancer: label.

Kent C. Dodds also merges tons of PRs from his phone without testing the branch directly, relying solely on CI. Using Ranger would make this a lot simpler since he could just apply the label and then forget about the PR completely.

#### Closing issues

Potential labels: `wontfix`, `invalid`, `stale`

In Carbon, issues labeled `theme/language` are closed after some time to allow other users to not only see the comments, but potentially offer PRs to solve the issue.

#### Reopening issues

Potential labels: `snooze`, `backlog`, `future`

Some issues, for example those labeled "future" in this repository, could be closed and marked to be reopened for consideration in the future

## Usage

1. **[Configure the GitHub App](https://github.com/marketplace/ranger)**
2. (Optional) Create `.github/ranger.yml` based on the following template:

```yml
# Configuration for Ranger - https://github.com/dawnlabs/ranger
# > The defaults are shown below
default:
  close:
    # Default time to wait before closing the label. Can either be a number in milliseconds
    # or a string specified by the `ms` package (https://www.npmjs.com/package/ms)
    delay: "7 days"

    # Default comment to post when an issue is first marked with a closing label
    #
    #   $DELAY will automatically be replaced with `delay` as a formatted string (e.g. '7 days')
    #   $LABEL will automatically be replaced with the label's name
    comment: "⚠️ This issue has been marked to be closed in $DELAY".

# Map granular configurations you can set for each label
labels:
  duplicate:
    action: close
    delay: 15s
    comment: "Duplicate issue created! Closing in $DELAY . . ."
  invalid: close # use defaults for comment and delay time
  'merge when passing': merge
  #comment:
  # action: comment
  # message: This is the comment to make
```

## Contributing ✍️

To get started:

1. `yarn`
2. Create a `.env` file following `.env.example`
3. [Download a private key](https://github.com/organizations/dawnlabs/settings/apps/issue-maintainer-dev) to the root of your directory
4. Create a new webhook proxy at https://smee.io (or use the one listed in the GitHub App Settings)
5. Set `WEBHOOK_PROXY_URL` to the webhook URL in your `.env`
6. `npx smee -u <WEBHOOK_PROXY_URL>`
7. `brew services start redis`
8. `yarn start`
