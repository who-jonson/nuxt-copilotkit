// Test fixture for registration.test.ts — validates imports: false mode.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    imports: false
  }
});
