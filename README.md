# Tonic 🍃

### Possible Names
- Balmy
- Eucalyptus
- Lavender

> a GitHub bot built with [probot](https://github.com/probot/probot) that lessens
the burden of OSS maintainers

## Usage

1. **[Configure the GitHub App](https://github.com/apps/TODO)**
2. (Optional) Create `.github/maintainence.yml` based on the following template:

```yml
# Configuration for issue-bot - https://github.com/probot
# > The defaults are shown below

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

## Contributing
Issues and PRs are welcome! To get started:

1. `npm install`
2. `npm start`
