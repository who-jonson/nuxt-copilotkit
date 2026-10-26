import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      commaDangle: 'never',
      quotes: 'single',
      semi: true
    }
  },
  dirs: {
    root: [
      '',
      'playground',
      'client',
      'documentation'
    ]
  }
});
