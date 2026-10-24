/**
 * Nuxt DevTools integration for nuxt-copilotkit: serves the client UI,
 * registers the `nuxt-copilotkit` custom tab, and exposes server RPC for config.
 */
import { existsSync } from 'node:fs';
import type { Nuxt } from 'nuxt/schema';
import { extendViteConfig, type Resolver, useRuntimeConfig } from '@nuxt/kit';
import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit';
import type { ModuleOptions } from './options';

const DEVTOOLS_UI_ROUTE = '/__nuxt-copilotkit';
const DEVTOOLS_UI_LOCAL_PORT = 3300;

/**
 * DevTools RPC response: sanitized config snapshot for the client.
 */
interface DevToolsConfigSnapshot {
  /** Resolved module options (public subset) */
  options: {
    runtime: { enabled?: boolean; path?: string; url?: string; model?: string } | false;
    provider: { autoWrap?: boolean; debug?: boolean; inspector?: boolean | 'dev' };
    components: { prefix?: string; global?: boolean; include?: string[] } | false;
    imports: { prefix?: string; include?: string[] } | false;
    styles: boolean;
    devtools: boolean;
  };
  /** Public runtime config copilotkit section */
  publicConfig: {
    runtimeUrl: string;
    debug?: boolean;
  };
  /** API key presence booleans (never the actual key values) */
  apiKeys: {
    openaiSet: boolean;
    anthropicSet: boolean;
  };
  /** Resolved runtime mode */
  runtimeMode: 'builtin' | 'external' | 'disabled';
}

/**
 * Registers the nuxt-copilotkit DevTools tab with the given Nuxt instance,
 * serving the prebuilt client in production or proxying the dev client,
 * and exposing server RPC for config inspection.
 *
 * @param nuxt - Nuxt instance
 * @param resolver - Module resolver used to locate the prebuilt client
 * @param moduleOptions - Resolved module options (defaults merged), reported by `getConfig`
 */
export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver, moduleOptions: ModuleOptions) {
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

  // Register custom tab via v3 API
  addCustomTab({
    name: 'nuxt-copilotkit',
    title: 'CopilotKit',
    icon: 'carbon:bot',
    view: {
      type: 'iframe',
      src: DEVTOOLS_UI_ROUTE
    }
  }, nuxt);

  // Expose server RPC for config inspection - only after DevTools is initialized
  onDevToolsInitialized(() => {
    extendServerRpc<Record<string, never>, {
      getConfig: () => DevToolsConfigSnapshot;
    }>('nuxt-copilotkit', {
      getConfig() {
        const runtimeConfig = useRuntimeConfig();

        // Determine runtime mode
        let runtimeMode: 'builtin' | 'external' | 'disabled' = 'disabled';
        if (moduleOptions.runtime !== false) {
          if (moduleOptions.runtime.url) {
            runtimeMode = 'external';
          }
          else if (moduleOptions.runtime.enabled !== false) {
            runtimeMode = 'builtin';
          }
        }

        return {
          options: {
            runtime: moduleOptions.runtime || false,
            provider: moduleOptions.provider || { autoWrap: true },
            components: moduleOptions.components !== false ? moduleOptions.components || {} : false,
            imports: moduleOptions.imports !== false ? moduleOptions.imports || {} : false,
            styles: moduleOptions.styles !== false,
            devtools: moduleOptions.devtools !== false
          },
          publicConfig: {
            runtimeUrl: runtimeConfig.public.copilotkit?.runtimeUrl || '',
            debug: runtimeConfig.public.copilotkit?.debug
          },
          apiKeys: {
            openaiSet: !!(runtimeConfig.copilotkit?.openaiApiKey),
            anthropicSet: !!(runtimeConfig.copilotkit?.anthropicApiKey)
          },
          runtimeMode
        };
      }
    }, nuxt);
  }, nuxt);
}
