// Test fixture for runtime-config.test.ts — validates env → config plumbing and routing modes.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    // Default configuration — tests override via env vars and module options
  }
});
