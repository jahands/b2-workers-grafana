# b2-workers-grafana

Graph B2 IO using B2 Event Notifications, Workers Analytics Engine, and Grafana

## Prerequisites

- [Node.js 18+](https://nodejs.org/en/download/package-manager)
- [pnpm](https://pnpm.io/installation)
- Cloudflare account
- Backblaze B2 account
- Grafana account

## Setup

### Install dependencies

```shell
pnpm install
```


### Deploy to Cloudflare Workers

Run from within `packages/b2-notif-worker`:

```shell
pnpm wrangler deploy
```

This will give you a URL to the deployed worker. For example:
https://b2-notif-worker.jahands.workers.dev

### Configure B2 Event Notifications

1. Login to [Backblaze](https://backblaze.com) and navigate to B2 buckets.
2. Click on Event Notifications for the bucket you want to monitor.
3. Click **+ Add New Rule**
4. Add the following rule:
  - Name: workers-b2-grafana
  - Event Types: Object Created, Object Deleted
  - Click **Generate Secret** and copy the secret.
  - Webhook Target URL: `https://b2-notif-worker.jahands.workers.dev/notify` (replacing with the hostname from the previous step.)
5. Click **Save**

### Upload signing secret to the Worker

Run from within `packages/b2-notif-worker`:

```shell
pnpm wrangler secret put B2_SIGNING_SECRET
```

When prompted, enter the signing secret from the previous step and press enter.
