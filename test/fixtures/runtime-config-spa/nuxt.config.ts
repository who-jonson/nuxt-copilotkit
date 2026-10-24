// Test fixture for SPA mode — `ssr: false` turns the built-in route off by default.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  ssr: false,

  compatibilityDate: 'latest'
});
