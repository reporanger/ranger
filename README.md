# Ranger

> A sidekick for repository maintainers

[![Netlify Status](https://api.netlify.com/api/v1/badges/2b0286e2-07fe-474c-9a7b-2d9b3c9c3e01/deploy-status)](https://app.netlify.com/sites/ranger/deploys)

## Usage

1. **[Configure the GitHub App](https://github.com/marketplace/ranger)**
2. (Optional) Create `.github/ranger.yml` based on the following template:
3. See the [docs](https://reporanger.com/docs) for configuration

## Contributing ✍️

To get started:

1. `yarn`
2. Create a `.env` file following `.env.example`
3. [Download a private key](https://github.com/organizations/reporanger/settings/apps/issue-maintainer-dev) to the root of your directory
4. Set `WEBHOOK_PROXY_URL` to the webhook URL in your `.env`
5. `brew services start redis`
6. `yarn dev`
