// Test fixture for external URL mode — runtime.url points to external endpoint.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    runtime: {
      enabled: true,
      url: 'https://my-external-runtime.com/api'
    }
  }
});
