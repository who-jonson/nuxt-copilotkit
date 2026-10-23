/**
 * Test fixture for basic route dispatch: serves the real copilotkit handler
 * through a catch-all server route with @copilotkit/runtime mocked.
 */
export default defineNuxtConfig({
  modules: ['../../../src/module'],
  copilotkit: {
    runtime: {
      enabled: true,
      path: '/api/_copilotkit'
    }
  }
});
