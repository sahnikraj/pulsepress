# PulsePress

Multi-tenant web push SaaS for blogs and news publishers.

## Monorepo layout

- `apps/api`: Express API + queue workers
- `apps/web`: Next.js dashboard
- `packages/shared`: shared types and helpers
- `database/migrations`: PostgreSQL SQL migrations

## Core defaults implemented

- Single account per user
- Segment snapshot at actual send time
- Best-effort campaign cancel
- Access + refresh token auth
- Multi-endpoint signed webhooks with retries
- Raw events retention: 30 days

## Production integrations

- GitHub Actions CI/CD workflows:
  - `.github/workflows/pulsepress-ci.yml`
  - `.github/workflows/pulsepress-deploy-netlify.yml`
  - `.github/workflows/pulsepress-deploy-render.yml`
- Netlify config: `/netlify.toml` (repo root, base directory `pulsepress`)
- Render blueprint: `pulsepress/render.yaml`
- Deployment runbook: `pulsepress/docs/PRODUCTION_DEPLOYMENT.md`
