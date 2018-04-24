# issue-bot

> a GitHub App built with [probot](https://github.com/probot/probot) that

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Usage

1. **[Configure the GitHub App](https://github.com/apps/stale)**
2. (Optional) Create `.github/maintainence.yml` based on the following template

```yml
# Configuration for issue-bot - https://github.com/probot

# Labels to mark closed after the configured amount of time
labels:
  - duplicate
  - wontfix
  - invalid
  - stale

# Default time to wait before closing the label. Can either be a number in milliseconds
# or a string specified by the `ms` package (https://www.npmjs.com/package/ms)
delayTime: "7 days"

# Default comment to post when an issue is first marked with a closing label
#
#   $ClOSE_TIME will automatically be replaced with `delayTime` as a formatted string (e.g. '7 days')
#   $LABEL will automatically be replaced with the label's name
comment: "⚠️ This issue has been marked to be closed in $CLOSE_TIME".

# Map of extra, granular configurations you can set for each label
labelConfig:
  duplicate:
    delayTime: 15s
    comment: "Duplicate issue created! Closing in $CLOSE_TIME . . ."
  stale: false # disable for this label name
  invalid: true # use defaults for comment and delay time


```
