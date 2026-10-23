import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      commaDangle: false,
      quotes: 'single',
      semi: true
    }
  },
  dirs: {
    root: [
      '',
      'playground',
      'client',
    ],
  },
})
