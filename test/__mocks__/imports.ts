/**
 * Minimal stub for #imports virtual module used in unit tests.
 * Provides mock implementations of Nuxt auto-imports needed by runtime code.
 */
import { vi } from 'vitest';
import { ref } from 'vue';

// Create mock functions that can be spied on
export const useState = vi.fn((key: string, init?: () => unknown) => {
  return ref(init ? init() : undefined);
});

export const resolveComponent = vi.fn((name: string) => {
  // Return a mock component object (not string) to simulate successful resolution
  return { __name: name };
});
