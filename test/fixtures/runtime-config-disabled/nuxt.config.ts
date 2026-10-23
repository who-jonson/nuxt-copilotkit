// Test fixture for runtime disabled mode — runtime: false means no built-in route.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    runtime: false
  }
});
