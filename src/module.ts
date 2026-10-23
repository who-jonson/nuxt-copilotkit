/**
 * nuxt-copilotkit module entrypoint: options wiring, registration, aliases,
 * and Nuxt DevTools hook-up.
 */
import { addComponent, addImportsSources, addPlugin, addServerHandler, addServerImports, createResolver, defineNuxtModule, updateRuntimeConfig, useLogger, addTypeTemplate, tryResolveModule } from '@nuxt/kit';
import defu from 'defu';
import { setupDevToolsUI } from './devtools';
import { defaults, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeConfig } from './options';

export type { ModuleOptions, ModulePublicRuntimeConfig, ModuleRuntimeConfig } from './options';

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
  async setup(options, nuxt) {
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
    updateRuntimeConfig({
      copilotkit: defu(
        nuxt.options.runtimeConfig.copilotkit || {} as ModuleRuntimeConfig,
        {
          model: runtime !== false ? (runtime.model ?? 'openai/gpt-4o') : 'openai/gpt-4o',
          openaiApiKey: '',
          anthropicApiKey: '',
          agents: runtime !== false ? (runtime.agents ?? {}) : {}
        }
      ),
      // Public runtimeConfig (client-visible)
      // defu(a, b) gives priority to a, so user runtimeConfig must come first to win
      public: {
        copilotkit: defu(
          nuxt.options.runtimeConfig.public.copilotkit || {} as ModulePublicRuntimeConfig,
          { runtimeUrl, debug: options.provider.debug ?? false }
        )
      }
    });

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

    const logger = useLogger('nuxt-copilotkit');

    // (a) Built-in route registration (runtimeUrl non-empty and no runtime.url)
    if (runtimeUrl && runtime !== false && !runtime.url) {
      // Ensure @copilotkit/runtime is available when built-in route is enabled
      if (!await tryResolveModule('@copilotkit/runtime', nuxt.options.rootDir)) {
        logger.warn(
          'Built-in CopilotKit runtime route is enabled, but @copilotkit/runtime is not installed.\n'
          + 'Install it with: pnpm add @copilotkit/runtime @ag-ui/client'
        );
      }

      // Register both base path and wildcard path
      addServerHandler({
        route: runtimeUrl,
        handler: resolver.resolve('./runtime/server/api/copilotkit')
      });
      addServerHandler({
        route: `${runtimeUrl}/**`,
        handler: resolver.resolve('./runtime/server/api/copilotkit')
      });
    }

    // (b) Make #copilotkit/server (defineCopilotRuntime/getCopilotRuntime) importable in consumer server code
    addServerImports([{
      from: '#copilotkit/server',
      name: 'defineCopilotRuntime'
    }, {
      from: '#copilotkit/server',
      name: 'getCopilotRuntime'
    }, {
      from: '#copilotkit/server',
      name: 'createRemoteAgent'
    }]);

    // (c) Component and import registration (2.9)
    // 30 runtime-exported v2 components from @copilotkit/vue/v2
    const UPSTREAM_COMPONENTS = [
      'A2UISurfaceActivityRenderer',
      'CopilotChat',
      'CopilotChatAssistantMessage',
      'CopilotChatAttachmentQueue',
      'CopilotChatAttachmentRenderer',
      'CopilotChatAudioRecorder',
      'CopilotChatConfigurationProvider',
      'CopilotChatInput',
      'CopilotChatMessageView',
      'CopilotChatReasoningMessage',
      'CopilotChatSuggestionPill',
      'CopilotChatSuggestionView',
      'CopilotChatToggleButton',
      'CopilotChatToggleButtonCloseIcon',
      'CopilotChatToggleButtonOpenIcon',
      'CopilotChatToolCallsView',
      'CopilotChatUserMessage',
      'CopilotChatView',
      'CopilotKitInspector',
      'CopilotKitProvider',
      'CopilotModalHeader',
      'CopilotPopup',
      'CopilotPopupView',
      'CopilotSidebar',
      'CopilotSidebarView',
      'CopilotThreadsDrawer',
      'MCPAppsActivityRenderer',
      'OpenGenerativeUIActivityRenderer',
      'OpenGenerativeUIRenderer',
      'OpenGenerativeUIToolRenderer'
    ];

    if (options.components !== false) {
      // Ensure @copilotkit/vue is available
      if (!await tryResolveModule('@copilotkit/vue', nuxt.options.rootDir)) {
        logger.warn(
          '@copilotkit/vue is not installed. Components will not be registered.\n'
          + 'Install it with: pnpm add @copilotkit/vue'
        );
      }

      const prefix = options.components.prefix ?? '';
      const includeSet = options.components.include ? new Set(options.components.include) : null;
      const globalFlag = options.components.global ?? true;

      for (const componentName of UPSTREAM_COMPONENTS) {
        // Apply include filter if specified
        if (includeSet && !includeSet.has(componentName)) {
          continue;
        }

        addComponent({
          name: prefix + componentName,
          export: componentName,
          filePath: '@copilotkit/vue/v2',
          mode: 'client',
          global: globalFlag
        });
      }

      // Register our universal CopilotKit wrapper component (NOT mode client)
      addComponent({
        name: 'CopilotKit',
        filePath: resolver.resolve('./runtime/components/CopilotKit.vue')
      });
    }

    // Auto-imports from #copilotkit honoring options.imports
    if (options.imports !== false) {
      const importsPrefix = options.imports.prefix ?? '';
      const importsIncludeSet = options.imports.include ? new Set(options.imports.include) : null;

      // Value exports of the #copilotkit barrel (src/runtime/copilotkit/index.ts); kept in sync by test/upstream-drift.test.ts
      const composables: string[] = [
        'useAgent', 'useAgentContext', 'useAttachments', 'useCapabilities', 'useComponent',
        'useConfigureSuggestions', 'useDefaultRenderTool', 'useFrontendTool', 'useHumanInTheLoop',
        'useInterrupt', 'useKatexStyles', 'useKeyboardHeight', 'useRenderActivityMessage',
        'useRenderCustomMessages', 'useRenderTool', 'useSuggestions', 'useThreads',
        'useCopilotKit', 'useCopilotChatConfiguration', 'useLicenseContext', 'useSandboxFunctions',
        'useNuxtCopilotKit', 'useCopilotGenUI', 'useCopilotHITL'
      ];

      const filteredComposables = importsIncludeSet
        ? composables.filter(name => importsIncludeSet.has(name))
        : composables;

      if (filteredComposables.length > 0 || !importsIncludeSet) {
        addImportsSources({
          from: '#copilotkit',
          imports: filteredComposables.map(name => ({
            name,
            as: importsPrefix + name
          }))
        });
      }
    }

    // (c) Plugin registration (explicit, Nuxt doesn't auto-scan module runtime plugins)
    if (options.provider.autoWrap !== false) {
      addPlugin(resolver.resolve('./runtime/plugin.client'));
    }

    if (options.devtools)
      setupDevToolsUI(nuxt, resolver);

    // Only reference @ag-ui/client types when the runtime peers are expected; external-runtime/`runtime: false`
    // consumers may not have them installed.
    const usesBuiltInRuntime = runtimeUrl !== '' && runtime !== false && !runtime.url;
    const agentImport = usesBuiltInRuntime ? 'import type { AbstractAgent } from \'@ag-ui/client\';' : '';
    const agentType = usesBuiltInRuntime ? 'AbstractAgent' : 'unknown';
    addTypeTemplate({
      filename: 'modules/nuxt-copilotkit.d.ts',
      getContents: () => `// auto-created by nuxt-copilotkit
/**
 * Nitropack runtime hooks augmentation for nuxt-copilotkit vNext seams.
 * These hooks are callable with zero listeners and provide future extension points.
 */
import type { H3Event } from 'h3';
${agentImport}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    /**
     * Called once during runtime initialization with the agents registry.
     * Mutate ctx.agents in place (add, replace or delete entries); reassigning the property has no effect.
     */
    'copilotkit:runtime': (ctx: { event: H3Event; agents: Record<string, ${agentType}> }) => void | Promise<void>;

    /**
     * Called on each incoming request to the CopilotKit endpoint.
     * Allows request-level middleware behavior.
     */
    'copilotkit:request': (event: H3Event) => void | Promise<void>;

    /**
     * Called when threads are accessed or modified.
     * Reserved for future thread management features.
     */
    'copilotkit:threads': (ctx: { event: H3Event; threadId?: string }) => void | Promise<void>;
  }
}
`
    }, { nitro: true, node: true });
  }
});
