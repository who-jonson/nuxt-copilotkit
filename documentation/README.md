# nuxt-copilotkit documentation

Source of the documentation site at <https://oss.whoj.dev/nuxt-copilotkit/>, built with [Docus](https://docus.dev), prerendered and served by a Cloudflare Worker.

`docs/plans/` holds internal design documents and is never published.

## Commands

Run from the repository root:

| Command | Purpose |
|---|---|
| `pnpm docs:dev` | Dev server |
| `pnpm docs:build` | `nuxt build` with the `cloudflare_module` preset |
| `pnpm docs:deploy` | Build, run the output tests, then `wrangler deploy` |

Run from `documentation/`:

| Command | Purpose |
|---|---|
| `pnpm run preview` | `wrangler dev` on the built Worker, port 8787 |
| `pnpm run test:output` | Checks on the prerendered files: required files, base-path prefix, internal links |
| `pnpm run test` | The output checks plus HTTP checks; starts `wrangler dev` itself unless `DOCS_URL` is set |

## How the base path works

The domain is shared by several libraries, so this site owns only `/nuxt-copilotkit/*`:

- `app.baseURL` is `/nuxt-copilotkit/`, so every generated URL carries the prefix.
- Workers Static Assets match the full request path; the `cloudflare_module` preset writes the files to `.output/public/nuxt-copilotkit/` for that reason.
- `wrangler.jsonc` holds the Worker name, routes and asset handling. Nitro merges it into `.output/server/wrangler.json`, which `wrangler --cwd .output dev` and `deploy` use.
- The routes `oss.whoj.dev/nuxt-copilotkit` and `oss.whoj.dev/nuxt-copilotkit/*` send requests to the Worker.

The Docus MCP endpoint is disabled; `llms.txt` and `llms-full.txt` are still generated.

## Deploying

`wrangler deploy` uses the account from `wrangler login` or `CLOUDFLARE_ACCOUNT_ID`. Never commit account ids or tokens.

## Writing pages

- Follow the existing sections in `content/` (numeric prefixes set the order).
- Check every option, default and API against `src/`; flag conflicts with the root `README.md` instead of guessing.
- Diagrams use Mermaid.
- No secrets, internal URLs, local paths or tooling state; see `AGENTS.md`.
