// Corrects the links in llms.txt: the generators add the site's base path on top of routes that already carry it.
const PREFIX = 'https://oss.whoj.dev/nuxt-copilotkit/';
const SEGMENT = 'nuxt-copilotkit';

interface LlmsLink { href: string }
interface LlmsSection { links?: LlmsLink[] }
interface LlmsOptions { sections?: LlmsSection[] }

/** Drops the repeated base segment and the double slash from a link under the site prefix. */
function fixHref(href: string): string {
  if (!href.startsWith(PREFIX)) {
    return href;
  }
  const rest = href.slice(PREFIX.length).replace(/\/{2,}/g, '/');
  const parts = rest.split('/');
  // Raw links live under raw/, and the home page file is raw/index.md.
  const head = parts[0] === 'raw' ? 'raw/' : '';
  let tail = parts.slice(head ? 1 : 0);
  if (tail[0] === SEGMENT) {
    tail = tail.slice(1);
  }
  else if (tail[0] === `${SEGMENT}.md`) {
    tail = ['index.md', ...tail.slice(1)];
  }
  return PREFIX + head + tail.join('/');
}

export default defineNitroPlugin((nitroApp) => {
  // Registered after the agent-discovery plugin, so this hook sees its rewritten links.
  nitroApp.hooks.hook('llms:generate' as never, ((_event: unknown, options: LlmsOptions) => {
    for (const section of options.sections ?? []) {
      for (const link of section.links ?? []) {
        link.href = fixHref(link.href);
      }
    }
  }) as never);
});
