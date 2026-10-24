/**
 * Module-owned injection keys and composables for nuxt-copilotkit.
 * Upstream's CopilotKitKey is a private Symbol; these keys are module-owned.
 * Exposed at #copilotkit/keys (resolves through the existing #copilotkit alias).
 */
import { inject } from 'vue';
import type { InjectionKey } from 'vue';

/**
 * Public runtime config mirrored into app context by the autoWrap plugin.
 * Contains no secrets — only client-visible configuration.
 */
export interface NuxtCopilotKitContext {
  /** Runtime endpoint URL forwarded to the CopilotKit provider. */
  runtimeUrl?: string;
  /** Upstream CopilotKit debug logging flag. */
  debug?: boolean;
}

/**
 * Injection key for module-owned CopilotKit context.
 * Separate from upstream's private CopilotKitKey.
 */
export const NuxtCopilotKitKey: InjectionKey<NuxtCopilotKitContext> = Symbol('nuxt-copilotkit');

/**
 * Read the module context provided by plugin.client.ts.
 * @returns The CopilotKit context, or undefined when autoWrap is disabled or on the server.
 */
export function useNuxtCopilotKit(): NuxtCopilotKitContext | undefined {
  return inject(NuxtCopilotKitKey, undefined);
}
