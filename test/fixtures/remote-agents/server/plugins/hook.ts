/**
 * Registers an extra agent through the copilotkit:runtime hook using the auto-imported helper.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('copilotkit:runtime', ({ agents }) => {
    agents.extra = createRemoteAgent({ url: 'http://127.0.0.1:9/extra' });
  });
});
