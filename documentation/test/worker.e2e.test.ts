// HTTP checks for the built Worker, against `wrangler dev` (see wrangler.global.ts) or DOCS_URL.
import { fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

const BASE = '/nuxt-copilotkit/';
const SITE = 'https://oss.whoj.dev/nuxt-copilotkit/';
const host = process.env.DOCS_URL ?? 'http://localhost:8787';

/** Fetches a path without following redirects, so redirect behaviour is asserted explicitly. */
function get(path: string, headers: Record<string, string> = {}) {
  return fetch(path, { headers, redirect: 'manual' });
}

describe('docs worker', async () => {
  // `host` skips the build and server steps; an empty `fixture` skips loading a Nuxt app.
  await setup({ host, fixture: '' });

  it('serves the home page and its assets', async () => {
    const home = await get(BASE);
    expect(home.status).toBe(200);

    const asset = (await home.text()).match(/\/nuxt-copilotkit\/_nuxt\/[^"']+\.js/)?.[0];
    expect(asset).toBeDefined();
    expect((await get(asset!)).status).toBe(200);
  });

  it('redirects the bare prefix to the base URL', async () => {
    const bare = await get('/nuxt-copilotkit');
    expect(bare.status).toBeGreaterThanOrEqual(300);
    expect(bare.status).toBeLessThan(400);

    const location = new URL(bare.headers.get('location') ?? '', host);
    expect(`${location.pathname}${location.search}`).toBe(BASE);
  });

  it('serves a deep page without a redirect', async () => {
    expect((await get(`${BASE}getting-started/introduction`)).status).toBe(200);
  });

  it('serves llms.txt with the site domain', async () => {
    const llms = await get(`${BASE}llms.txt`);
    expect(llms.status).toBe(200);
    expect(await llms.text()).toContain(SITE);
  });

  it('answers unknown paths with the 404 page', async () => {
    // The Worker renders this page. Without Accept: text/html (a browser sends it) Nuxt answers with a JSON error.
    const missing = await get(`${BASE}this-page-does-not-exist`, { Accept: 'text/html' });
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain('Page not found');
  });
});
