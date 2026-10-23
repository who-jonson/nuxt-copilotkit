// API endpoint to expose runtimeConfig for testing.
export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  return {
    runtimeUrl: config.public.copilotkit.runtimeUrl
  };
});
