# PulsePress Production Deployment

## 1) GitHub repository setup

1. Push this workspace to a GitHub repository.
2. Use branch policy:
   - `develop` for frequent staging deploys
   - `main` for release-ready code only
3. Add repository secrets:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
   - `RENDER_API_KEY`
   - `RENDER_STAGING_SERVICE_ID`
   - `RENDER_PROD_SERVICE_ID`

## 2) Netlify setup (Next.js frontend)

1. Create a new Netlify site connected to your GitHub repo.
2. Set base directory to `pulsepress`.
3. Netlify reads config from repository `netlify.toml`.
4. Add environment variables in Netlify:
   - `NEXT_PUBLIC_API_BASE_URL` = your Render API URL (`https://pulsepress-api.onrender.com/api/v1`)
5. Use GitHub Action `Deploy PulsePress Web (Netlify)` manually:
   - `publish_to_production=false` for a draft deploy
   - `publish_to_production=true` only when you approve release

## 3) Render setup (API + workers + infra)

1. In Render, create a Blueprint and point it to `pulsepress/render.yaml`.
2. This provisions:
   - `pulsepress-api` web service
   - `pulsepress-workers` background worker
   - `pulsepress-db` PostgreSQL
   - `pulsepress-redis`
3. In Render dashboard, set shared environment values:
   - `WEB_ORIGIN` = Netlify URL
   - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
   - `ENCRYPTION_KEY`
4. Run SQL migrations on database before first production traffic.

## 4) GitHub Actions automation

Workflows included:
- `.github/workflows/pulsepress-ci.yml`
- `.github/workflows/pulsepress-deploy-netlify.yml`
- `.github/workflows/pulsepress-deploy-render.yml`

Behavior:
- CI builds API/web for PRs and pushes touching `pulsepress/**`.
- Render workflow auto-deploys staging service on `develop` pushes.
- Render workflow deploys production service only when manually triggered.
- Netlify workflow runs only manually and supports draft deploy before production publish.

## 5) First production checklist

1. Apply `pulsepress/database/migrations/001_init.sql`.
2. Apply `pulsepress/database/migrations/002_retention.sql` (or convert to scheduled DB job).
3. Verify `https://<render-api-domain>/health` returns `ok`.
4. Create first site in dashboard and confirm VAPID install snippet.
5. Test subscribe + send campaign + webhook callback.

## 6) Recommended hardening before launch

1. Add a proper migration runner (`node-pg-migrate`/`knex`/`prisma migrate`).
2. Add structured logging + error reporting.
3. Add smoke tests for auth, subscribe, send, metrics.
4. Add origin signature validation on `/api/v1/public/:siteId/event`.
