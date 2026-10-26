// Docus app config: branding, repository links and theme colors for the nuxt-copilotkit docs.
export default defineAppConfig({
  seo: {
    title: 'nuxt-copilotkit',
    description: 'AI copilots, generative UI and agents for Nuxt — SSR-safe, zero-boilerplate, powered by CopilotKit.'
  },
  header: {
    title: 'nuxt-copilotkit',
    logo: {
      // The layer's default '/favicon.ico' ignores app.baseURL; the icon lives under the site prefix.
      favicon: '/nuxt-copilotkit/favicon.svg'
    }
  },
  socials: {
    npm: 'https://npmjs.com/package/@whoj/nuxt-copilotkit'
  },
  github: {
    url: 'https://github.com/who-jonson/nuxt-copilotkit',
    branch: 'dev',
    rootDir: 'documentation'
  },
  ui: {
    colors: {
      // Nuxt green, matching the README badges (colorB=00DC82).
      primary: 'green',
      neutral: 'zinc'
    }
  }
});
