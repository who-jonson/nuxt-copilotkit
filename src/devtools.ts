/**
 * Nuxt DevTools integration for nuxt-copilotkit: serves the client UI and
 * registers the `nuxt-copilotkit` custom tab.
 */
import { existsSync } from 'node:fs';
import type { Nuxt } from 'nuxt/schema';
import { extendViteConfig, type Resolver } from '@nuxt/kit';

const DEVTOOLS_UI_ROUTE = '/__nuxt-copilotkit';
const DEVTOOLS_UI_LOCAL_PORT = 3300;

/**
 * Registers the nuxt-copilotkit DevTools tab with the given Nuxt instance,
 * serving the prebuilt client in production or proxying the dev client.
 */
export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client');
  const isProductionBuild = existsSync(clientPath);

  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r);
      server.middlewares.use(
        DEVTOOLS_UI_ROUTE,
        sirv(clientPath, { dev: true, single: true })
      );
    });
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    extendViteConfig((config) => {
      config.server = config.server || {};
      config.server.proxy = config.server.proxy || {};
      config.server.proxy[DEVTOOLS_UI_ROUTE] = {
        target: 'http://localhost:' + DEVTOOLS_UI_LOCAL_PORT + DEVTOOLS_UI_ROUTE,
        changeOrigin: true,
        followRedirects: true,
        rewrite: path => path.replace(DEVTOOLS_UI_ROUTE, '')
      };
    });
  }

  nuxt.hook('devtools:customTabs', (tabs) => {
    tabs.push({
      // unique identifier
      name: 'nuxt-copilotkit',
      // title to display in the tab
      title: 'Nuxt CopilotKit',
      // any icon from Iconify, or a URL to an image
      icon: 'carbon:bot',
      // iframe view
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE
      }
    });
  });
}
