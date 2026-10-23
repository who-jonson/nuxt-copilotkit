/**
 * Runtime configuration tests for nuxt-copilotkit module.
 *
 * Validates:
 * - Environment variable overrides (NUXT_COPILOTKIT_*) flow into runtimeConfig
 * - Public runtimeUrl resolves correctly from routing modes (default, external, disabled)
 * - Empty string defaults allow env overrides (Nitro behavior: only keys that exist can be overridden)
 *
 * Environment injection: env vars are passed to setup() via the `env` option, which injects
 * them before Nuxt initialization. This ensures runtimeConfig is populated with the override values.
 *
 * Test approach: Each fixture exposes a /api/config endpoint that returns runtimeConfig values,
 * which the tests fetch via $fetch().
 */
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('runtime-config fixture', () => {
  describe('default mode (built-in route enabled)', async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/runtime-config', import.meta.url))
    });

    it('exposes private runtimeConfig.copilotkit with empty-string defaults', async () => {
      const response = await $fetch('/api/config') as { private: { model: string; openaiApiKey: string; anthropicApiKey: string } };
      expect(response.private).toBeDefined();
      expect(response.private.model).toBe('openai/gpt-4o');
      // Empty string defaults allow NUXT_* env overrides — Nitro only applies overrides to keys that exist
      expect(response.private.openaiApiKey).toBe('');
      expect(response.private.anthropicApiKey).toBe('');
    });

    it('exposes public runtimeConfig with resolved runtimeUrl from default path', async () => {
      const response = await $fetch('/api/config') as { public: { runtimeUrl: string; debug: boolean } };
      expect(response.public).toBeDefined();
      // Default mode: runtime.enabled=true, runtime.path='/api/_copilotkit'
      expect(response.public.runtimeUrl).toBe('/api/_copilotkit');
      expect(response.public.debug).toBe(false);
    });
  });

  describe('env override mode', async () => {
    // Environment variables are injected via setup() env option before Nuxt initialization
    // This validates that empty-string defaults in module.ts allow env overrides to apply
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/runtime-config', import.meta.url)),
      env: {
        NUXT_COPILOTKIT_MODEL: 'anthropic/claude-sonnet-4-5',
        NUXT_COPILOTKIT_OPENAI_API_KEY: 'sk-test-key-12345',
        NUXT_COPILOTKIT_ANTHROPIC_API_KEY: 'anthropic-test-key-67890',
        NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL: 'https://external.example.com/api',
        NUXT_PUBLIC_COPILOTKIT_DEBUG: 'true'
      }
    });

    it('applies NUXT_COPILOTKIT_MODEL override', async () => {
      const response = await $fetch('/api/config') as { private: { model: string } };
      expect(response.private.model).toBe('anthropic/claude-sonnet-4-5');
    });

    it('applies NUXT_COPILOTKIT_OPENAI_API_KEY override', async () => {
      const response = await $fetch('/api/config') as { private: { openaiApiKey: string } };
      // Empty string default allows env override to apply
      expect(response.private.openaiApiKey).toBe('sk-test-key-12345');
    });

    it('applies NUXT_COPILOTKIT_ANTHROPIC_API_KEY override', async () => {
      const response = await $fetch('/api/config') as { private: { anthropicApiKey: string } };
      expect(response.private.anthropicApiKey).toBe('anthropic-test-key-67890');
    });

    it('applies NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL override', async () => {
      const response = await $fetch('/api/config') as { public: { runtimeUrl: string } };
      expect(response.public.runtimeUrl).toBe('https://external.example.com/api');
    });

    it('applies NUXT_PUBLIC_COPILOTKIT_DEBUG override', async () => {
      const response = await $fetch('/api/config') as { public: { debug: boolean } };
      expect(response.public.debug).toBe(true);
    });
  });

  describe('external URL mode', async () => {
    // Fixture with runtime.url set to external URL
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/runtime-config-external', import.meta.url))
    });

    it('sets runtimeUrl to the external URL', async () => {
      const response = await $fetch('/api/config') as { public: { runtimeUrl: string } };
      expect(response.public.runtimeUrl).toBe('https://my-external-runtime.com/api');
    });
  });

  describe('runtime disabled mode', async () => {
    // Fixture with runtime: false
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/runtime-config-disabled', import.meta.url))
    });

    it('sets runtimeUrl to empty string when runtime is false', async () => {
      const response = await $fetch('/api/config') as { public: { runtimeUrl: string } };
      expect(response.public.runtimeUrl).toBe('');
    });
  });

  describe('user runtimeConfig wins mode', async () => {
    // Fixture validates user runtimeConfig beats module defaults
    // User sets openaiApiKey='user-key' and debug=true; module sets provider.debug=false
    // Module defaults (model, runtimeUrl) should still appear since user didn't override them
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/runtime-config-user-wins', import.meta.url))
    });

    it('user-set openaiApiKey beats module default', async () => {
      const response = await $fetch('/api/config') as { private: { openaiApiKey: string } };
      expect(response.private.openaiApiKey).toBe('user-key');
    });

    it('user-set debug beats module provider.debug', async () => {
      const response = await $fetch('/api/config') as { public: { debug: boolean } };
      expect(response.public.debug).toBe(true);
    });

    it('module-provided model still appears when user did not override', async () => {
      const response = await $fetch('/api/config') as { private: { model: string } };
      expect(response.private.model).toBe('openai/gpt-4o');
    });

    it('module-provided runtimeUrl still appears when user did not override', async () => {
      const response = await $fetch('/api/config') as { public: { runtimeUrl: string } };
      expect(response.public.runtimeUrl).toBe('/api/_copilotkit');
    });
  });
});
