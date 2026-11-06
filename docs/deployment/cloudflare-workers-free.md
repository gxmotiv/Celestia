# Cloudflare Workers deployment (free tier)

Celestia is configured to use the OpenNext Cloudflare adapter. The repository stays private; this workflow does not publish source code or deploy on every push.

## Cost and limits

- Target: Cloudflare Workers Free ($0).
- No R2 bucket, paid database, paid domain, or paid add-on is required by this configuration.
- The current Workers Free limits include 100,000 requests per day and 10 ms CPU time per request. Heavy server-side calculations or PDF generation may exceed the CPU limit; the Worker build succeeding does not prove every endpoint will run within that limit.
- Keep an eye on the Cloudflare dashboard usage. Do not upgrade to a paid plan or enable a paid product to resolve a limit without the owner's explicit approval.

## One-time account setup

1. Create or sign in to a Cloudflare account and remain on the Free plan.
2. In Cloudflare, create an API token with permission to deploy Workers for this account. Do not use the Global API Key.
3. Copy the Cloudflare Account ID from the account overview.
4. In the private GitHub repository, open **Settings → Secrets and variables → Actions** and add:
   - `CLOUDFLARE_API_TOKEN` — the API token.
   - `CLOUDFLARE_ACCOUNT_ID` — the account ID.
5. Never paste either value into an issue, pull request, source file, or ChatGPT message.

The workflow does not need a Gemini key to deploy. AI endpoints that rely on Gemini may use their existing fallback when `GEMINI_API_KEY` is not configured. Geocoding may require the optional `GEOAPIFY_API_KEY`; configure it only as a Worker secret if you choose to use that service.

## Validate before deploying

A pull request that changes app/runtime files runs the OpenNext build and a Wrangler dry-run. This validates the Worker bundle without deploying it.

## Manual deployment

After reviewing and merging the deployment configuration into the intended production branch (do not merge automatically):

1. Open **Actions → Celestia Cloudflare Workers**.
2. Select the production branch (or the reviewed deployment branch for a deliberate preview).
3. Choose **Run workflow**.
4. Keep `deploy` set to `false` for build-only validation. Set it to `true` only when you intend to publish that branch.
5. The deploy job requires both repository secrets listed above.

A successful deployment prints the Worker URL in the Actions log. Confirm the home page and each API route in the deployed environment before treating it as production-ready.

## Important limitations

- The Worker name is `celestia`; Cloudflare will assign a `workers.dev` URL when the account has a workers.dev subdomain enabled.
- This configuration deliberately avoids R2 so it does not introduce storage charges. Incremental caching is therefore not configured here.
- PDF generation uses PDFKit. Node.js stream APIs are available in Workers compatibility mode, but the actual PDF endpoint still needs a deployed smoke test and may be affected by the Free CPU limit.
- The GitHub Actions workflow is manual for deployment. Pull-request checks only build and dry-run; they do not publish.
- Do not make this private repository public to enable GitHub Pages. GitHub Pages is not the target host for this server-rendered Next.js app.
