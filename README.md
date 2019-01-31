# Ranger

> Ease the burden of repository maintainers

[![Netlify Status](https://api.netlify.com/api/v1/badges/1ad824ff-2486-4fe5-a738-68c66f86fd04/deploy-status)](https://app.netlify.com/sites/ranger/deploys)

- [Docs](https://www.notion.so/dawnlabs/Docs-8d7627bb1f3c42b7b1820e8d6f157a57)

## Usage

1. **[Configure the GitHub App](https://github.com/apps/repo-ranger)**
2. (Optional) Create `.github/ranger.yml` based on the following template:
3. See the [docs](https://reporanger.com/docs) for configuration

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
