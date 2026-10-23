/**
 * nuxt-copilotkit module entrypoint: options wiring, registration, aliases,
 * and Nuxt DevTools hook-up.
 */
import { createResolver, defineNuxtModule } from '@nuxt/kit';
import defu from 'defu';
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

    // Resolve runtimeUrl from ONE source per ARCHITECTURE §2:
    // - runtime.url (external) -> that URL
    // - runtime === false -> '' (no route)
    // - runtime.enabled === true -> runtime.path (default '/api/_copilotkit')
    let runtimeUrl: string;
    const runtime = options.runtime;

    if (runtime === false) {
      runtimeUrl = '';
    }
    else if (runtime.url) {
      // External runtime mode
      runtimeUrl = runtime.url;
    }
    else if (runtime.enabled !== false) {
      // Built-in route enabled (default)
      runtimeUrl = runtime.path ?? '/api/_copilotkit';
    }
    else {
      // runtime.enabled === false without url -> no route, empty URL
      runtimeUrl = '';
    }

    // One-way options -> runtimeConfig (private)
    // defu(a, b) gives priority to a, so user runtimeConfig must come first to win
    // empty string defaults allow NUXT_* env overrides
    nuxt.options.runtimeConfig.copilotkit = defu(
      nuxt.options.runtimeConfig.copilotkit,
      { model: runtime !== false ? (runtime.model ?? 'openai/gpt-4o') : 'openai/gpt-4o', openaiApiKey: '', anthropicApiKey: '' }
    );

    // Public runtimeConfig (client-visible)
    // defu(a, b) gives priority to a, so user runtimeConfig must come first to win
    nuxt.options.runtimeConfig.public.copilotkit = defu(
      nuxt.options.runtimeConfig.public.copilotkit,
      { runtimeUrl, debug: options.provider.debug ?? false }
    );

    // Register aliases for #copilotkit and #copilotkit/server
    // Targets are created by sibling tickets; alias registration itself won't break build/test
    nuxt.options.alias['#copilotkit'] = resolver.resolve('./runtime/copilotkit');
    nuxt.options.alias['#copilotkit/server'] = resolver.resolve('./runtime/server/utils');

    // Build configuration: transpile @copilotkit/vue for SSR safety
    nuxt.options.build.transpile.push('@copilotkit/vue');

    // Styles option: inject @copilotkit/vue/styles.css globally
    if (options.styles !== false) {
      nuxt.options.css.push('@copilotkit/vue/styles.css');
    }

    if (options.devtools)
      setupDevToolsUI(nuxt, resolver);
  }
});
