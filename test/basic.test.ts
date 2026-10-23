// Smoke test: the minimal basic fixture boots a Nuxt app with the nuxt-copilotkit module and SSRs its marker element.
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('basic fixture (nuxt-copilotkit)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url))
  });

  it('renders the index page with the fixture marker element', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/');
    expect(html).toContain('id="copilotkit-fixture-basic"');
  });
});
