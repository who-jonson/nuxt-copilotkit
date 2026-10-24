/**
 * Client-only autoWrap plugin for nuxt-copilotkit.
 * Provides module-owned context and emits a development-mode hint about the degrade policy.
 * SSR vnode tree is identical (no root wrapping). Per ARCHITECTURE §3, .client suffix ensures
 * this never enters the server bundle.
 */
import { defineNuxtPlugin } from '#app';
import { NuxtCopilotKitKey } from './copilotkit/keys';
import type { ModulePublicRuntimeConfig } from '@whoj/nuxt-copilotkit';

export default defineNuxtPlugin({
  name: 'whoj:nuxt-copilotkit',
  parallel: true,
  async setup({ $config, vueApp }) {
  // Read public runtime config defensively (runtimeUrl + debug)
    const ck = ($config.public.copilotkit || {}) as ModulePublicRuntimeConfig['copilotkit'];

    // Provide module-owned context (upstream's CopilotKitKey is private, SPK-A1)
    vueApp.provide(NuxtCopilotKitKey, {
      runtimeUrl: ck.runtimeUrl,
      debug: ck.debug
    });

    // Design §4 degrade policy: one-line dev hint pointing at <CopilotKit> (Path B)
    if (import.meta.dev) {
      console.info('[nuxt-copilotkit] autoWrap cannot install the upstream provider headlessly — wrap your layout in <CopilotKit> (or set provider.autoWrap: false to silence).');
    }
  }
});
