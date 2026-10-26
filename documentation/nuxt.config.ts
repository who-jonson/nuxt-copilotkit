// Docus site for @whoj/nuxt-copilotkit: prerendered and served by a Cloudflare Worker under oss.whoj.dev/nuxt-copilotkit/.
import type { Nuxt } from 'nuxt/schema';

// nuxt-agent-discovery accepts only an origin at build time and has no base-path
// support, but its runtime consumers (canonical, alternate and raw links,
// sitemap.md) need the path, so they must see the full site URL at runtime.
const SITE_URL_WITH_PATH = 'https://oss.whoj.dev/nuxt-copilotkit';

export default defineNuxtConfig({
  extends: ['docus'],

  modules: [
    // Docus renders ```mermaid fences as plain code; this module draws them as diagrams in the browser.
    '@barzhsieh/nuxt-content-mermaid',
    (_options: Record<string, never>, nuxt: Nuxt) => {
      nuxt.hooks.hook('modules:done', () => {
        const agentDiscovery = nuxt.options.runtimeConfig.agentDiscovery;
        if (agentDiscovery) {
          agentDiscovery.siteUrl = SITE_URL_WITH_PATH;
          nuxt.options.runtimeConfig.public.agentDiscovery.siteUrl = SITE_URL_WITH_PATH;
        }
      });
    }
  ],

  app: {
    // The domain is shared by several libraries; this site owns only this prefix.
    baseURL: '/nuxt-copilotkit/'
  },

  site: {
    name: 'nuxt-copilotkit',
    // Origin only: nuxt-agent-discovery rejects a site URL that carries a path.
    url: 'https://oss.whoj.dev'
  },

  content: {
    // node:sqlite (Node >= 22.5) avoids a better-sqlite3 native build.
    experimental: { sqliteConnector: 'native' }
  },

  // Pinned, not 'latest'. The generated wrangler.json did not pick this date up in the probe (Nitro used its own
  // default), so documentation/wrangler.jsonc pins compatibility_date for the Worker.
  compatibilityDate: '2026-10-26',

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      // Generate .output/server/wrangler.json from documentation/wrangler.jsonc.
      deployConfig: true,
      nodeCompat: true
    },
    prerender: {
      // Write route.html instead of route/index.html so slash-less links are served without a redirect.
      autoSubfolderIndex: false
    }
  },

  typescript: {
    // The root .nuxtrc turns these on for the module; the docs site must not inherit them.
    includeWorkspace: false,
    typeCheck: false
  },

  llms: {
    domain: 'https://oss.whoj.dev/nuxt-copilotkit/',
    title: 'nuxt-copilotkit',
    description: 'SSR-safe CopilotKit integration for Nuxt: built-in Nitro runtime route, generative UI and human-in-the-loop helpers, remote AG-UI agents and a DevTools tab.',
    full: {
      title: 'nuxt-copilotkit',
      description: 'Complete nuxt-copilotkit documentation: installation, guides, server runtime and API reference.'
    }
  },

  // Kept off: the site is prerendered and exposes no MCP endpoint (spec §4).
  mcp: {
    enabled: false
  },

  // robots.txt belongs at the domain root (oss.whoj.dev), which this site does
  // not own; @nuxtjs/robots also refuses to emit one under a base URL.
  robots: {
    robotsTxt: false
  }
});
