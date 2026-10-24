// Test fixture for SPA mode with an explicit `runtime.enabled: true` (server still deployed).
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  ssr: false,

  compatibilityDate: 'latest',

  copilotkit: {
    runtime: { enabled: true }
  }
});
