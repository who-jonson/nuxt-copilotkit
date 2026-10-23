/**
 * SSR test fixture for nuxt-copilotkit.
 * INTERIM: Registers plugin and component manually until L2E reconciles with module registration.
 */
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {
    // Minimal config to exercise SSR behavior
    runtime: {
      enabled: true,
      path: '/api/_copilotkit'
    },
    provider: {
      autoWrap: true
    }
  }
});
