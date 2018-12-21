# Ranger 🤠

> a GitHub bot that eases the burden of OSS maintainers, built with [Probot](https://github.com/probot/probot)

Unlike other issue bots, Ranger listens to prompts by maintaners in the form of labels being applied, and responds according. Ranger can close stale/invalid/wontfix (or any other) labeled issues after a preconfigured amount of time, and automatically notify users with preset messages.

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
    delayTime: "7 days" 

    # Default comment to post when an issue is first marked with a closing label
    #
    #   $ClOSE_TIME will automatically be replaced with `delayTime` as a formatted string (e.g. '7 days')
    #   $LABEL will automatically be replaced with the label's name
    comment: "⚠️ This issue has been marked to be closed in $CLOSE_TIME".

# Map granular configurations you can set for each label
labels:
  duplicate:
    action: close
    delayTime: 15s
    comment: "Duplicate issue created! Closing in $CLOSE_TIME . . ."
  invalid: close # use defaults for comment and delay time
  'merge when passing': merge
```

## Contributing ✍️

Issues and PRs are welcome! To get started:

1. `npm install`
2. Create a `.env` file following `.env.example`.
3. Start a new webhook proxy at https://smee.io and set `WEBHOOK_PROXY_URL` in your `.env`
4. `npx smee -u <WEBHOOK_PROXY_URL>`
5. `npm start`
