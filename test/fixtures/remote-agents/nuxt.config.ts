/**
 * Fixture: remote AG-UI agents configured via `runtime.agents` plus one added through the
 * `copilotkit:runtime` hook. No network is used; the URLs are never called.
 */
export default defineNuxtConfig({
  modules: ['../../../src/module'],
  copilotkit: {
    runtime: {
      agents: {
        default: { url: 'http://127.0.0.1:9/adk', headers: { Authorization: 'Bearer test' } }
      }
    }
  }
});
