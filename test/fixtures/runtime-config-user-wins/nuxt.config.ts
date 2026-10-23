// Test fixture for runtime-config user-wins test — validates user runtimeConfig beats module defaults.
// User sets openaiApiKey='user-key' and debug=true; module defaults should not overwrite them.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  // User's runtimeConfig should win over module defaults
  runtimeConfig: {
    copilotkit: {
      openaiApiKey: 'user-key'
    },
    public: {
      copilotkit: {
        debug: true
      }
    }
  },

  compatibilityDate: 'latest',

  copilotkit: {
    // Module option: provider.debug is false
    provider: {
      debug: false
    }
  }
});
