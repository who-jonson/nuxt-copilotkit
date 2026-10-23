/**
 * nuxt-copilotkit module entrypoint: options wiring, registration, aliases,
 * and Nuxt DevTools hook-up.
 */
import { createResolver, defineNuxtModule } from '@nuxt/kit';
import { setupDevToolsUI } from './devtools';
import { defaults, type ModuleOptions } from './options';

export type { ModuleOptions } from './options';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-copilotkit',
    configKey: 'copilotkit',
    compatibility: {
      nuxt: '>=4.6.0'
    }
  },
  // Default configuration options of the Nuxt module
  defaults,
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    if (options.devtools)
      setupDevToolsUI(nuxt, resolver);
  }
});
