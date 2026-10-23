// Exposes runtime config values for testing
// useRuntimeConfig is auto-imported by Nuxt in server routes
import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  return {
    private: config.copilotkit,
    public: config.public.copilotkit
  };
});
