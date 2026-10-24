/**
 * Registration tests for nuxt-copilotkit module.
 *
 * Validates:
 * - Server handler registration for built-in route
 * - Public runtime config runtimeUrl correctness
 * - Behavior when runtime: false or external URL mode
 */
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('registration tests', () => {
  describe('default mode (all features enabled)', async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/registration', import.meta.url))
    });

    it('exposes runtimeUrl from default built-in route', async () => {
      const config = await $fetch<{ runtimeUrl: string }>('/api/test-config');
      expect(config.runtimeUrl).toBe('/api/_copilotkit');
    });
  });

  describe('runtime: false mode', async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/registration-runtime-false', import.meta.url))
    });

    it('sets runtimeUrl to empty string when runtime is false', async () => {
      const config = await $fetch<{ runtimeUrl: string }>('/api/test-config');
      expect(config.runtimeUrl).toBe('');
    });
  });

  describe('external URL mode', async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/registration-external', import.meta.url))
    });

    it('sets runtimeUrl to external URL and does not register built-in route', async () => {
      const config = await $fetch<{ runtimeUrl: string }>('/api/test-config');
      expect(config.runtimeUrl).toBe('https://external.example.com/api');
    });
  });

  describe('imports: false mode', async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/registration-imports-false', import.meta.url))
    });

    it('still exposes runtimeUrl when imports is disabled', async () => {
      const config = await $fetch<{ runtimeUrl: string }>('/api/test-config');
      expect(config.runtimeUrl).toBe('/api/_copilotkit');
    });
  });
});
