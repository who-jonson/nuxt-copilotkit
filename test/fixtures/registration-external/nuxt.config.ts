// Test fixture for registration.test.ts — validates external URL mode.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    runtime: {
      url: 'https://external.example.com/api'
    }
  }
});
