/**
 * SSR test for nuxt-copilotkit wrapper component.
 * Verifies that <CopilotKit> renders slot content on SSR without live CopilotKit provider markup,
 * satisfying Design §4 and §1 criterion 2.
 */
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('ssr fixture (CopilotKit wrapper SSR behavior)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/ssr', import.meta.url))
  });

  it('returns 200 and renders the slot marker in server-rendered HTML', async () => {
    // $fetch succeeding implies 200 status
    const html = await $fetch('/');
    expect(html).toContain('id="ssr-slot-marker"');
    expect(html).toContain('SSR slot content — this must appear in server-rendered HTML');
  });

  it('does NOT render live CopilotKit provider markup on SSR', async () => {
    const html = await $fetch('/');
    // The wrapper component should render <slot/> transparently on SSR, not the live CopilotKitProvider.
    // Upstream CopilotKitProvider would inject provider state markup if it ran on the server.
    // We cannot directly check for absence of all possible provider markup, but we can verify
    // that the output is clean HTML without obvious CopilotKit-specific attributes or elements.
    // This is a negative assertion: no "copilot" strings outside our own marker/comment.
    //
    // NOTE: Hydration mismatch warnings (per plan Tests(L2) acceptance) surface in the browser
    // console, not in server HTML. Verification of "no hydration warnings" is deferred to manual
    // browser testing in G2b (playground validation phase).

    // Extract just the body content to avoid false positives from Nuxt's head/script tags
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Should NOT contain upstream provider data attributes or state markers
    expect(bodyContent).not.toMatch(/data-copilot/i);
    expect(bodyContent).not.toMatch(/copilotkit-provider/i);

    // Our slot marker MUST be present (positive assertion)
    expect(bodyContent).toContain('ssr-slot-marker');
  });

  it('renders full HTML page structure', async () => {
    const html = await $fetch('/');
    // Verify complete HTML document structure
    expect(html).toMatch(/<html/i);
    expect(html).toMatch(/<head/i);
    expect(html).toMatch(/<body/i);
    expect(html).toMatch(/<\/html>/i);
  });
});
