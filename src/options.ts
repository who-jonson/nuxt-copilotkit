/**
 * Module options, defaults, and runtime config type augmentation for nuxt-copilotkit.
 * Mirrors ARCHITECTURE §6 (locked surface); pattern reference: plan Appendix A §P2.
 */

/**
 * Configuration for the nuxt-copilotkit module, consumed via the `copilotkit`
 * key in `nuxt.config`.
 */
/**
 * A remote agent exposed over the AG-UI HTTP protocol (e.g. a Google ADK, Claude Agent SDK,
 * VoltAgent, LangGraph or A2A-bridged service). The runtime proxies requests to it via `HttpAgent`.
 */
export interface RemoteAgentConfig {
  /** AG-UI endpoint of the remote agent. */
  url: string;
  /** Extra headers sent on every request (e.g. `Authorization`). Stored in private runtimeConfig. */
  headers?: Record<string, string>;
  /** Human-readable description surfaced to the runtime. */
  description?: string;
}

export interface ModuleOptions {
  /**
   * Server runtime wiring. `false` disables all server-side registrations.
   * When `false`, `public.runtimeUrl` is empty and must be set externally (e.g., via `NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL`
   * or `runtimeConfig.public.copilotkit.runtimeUrl` in `nuxt.config.ts`) since no built-in route exists.
   */
  runtime: false | {
    /** Register the built-in CopilotKit runtime route. @default true */
    enabled: boolean;
    /** Runtime endpoint path; both `path` and `path/**` routes are registered. @default '/api/_copilotkit' */
    path: string;
    /** External runtime URL; when set, the built-in route is not registered. */
    url?: string;
    /** Model identifier used by the built-in runtime. @default 'openai/gpt-4o' */
    model?: string;
    /**
     * Remote AG-UI agents keyed by agent id. When non-empty they replace the default `BuiltInAgent`
     * (register the id the client uses, `default` unless a component sets `agentId`).
     * For dynamic agents use `defineCopilotRuntime` or the `copilotkit:runtime` hook.
     */
    agents?: Record<string, RemoteAgentConfig>;
  };
  /**
   * Client-side CopilotKit provider configuration.
   */
  provider: {
    /** Auto-wrap the app in `<CopilotKitProvider>` (zero-template). Set `false` to use the explicit `<CopilotKit>` wrapper. @default true */
    autoWrap: boolean;
    /** Enable upstream CopilotKit debug logging. */
    debug?: boolean;
    /** Upstream CopilotKit Inspector; never runs in SSR/production, `'dev'` restricts it to development. */
    inspector?: boolean | 'dev';
  };
  /**
   * Component registration. `false` disables component registration entirely.
   */
  components: false | {
    /** Prefix prepended to registered component names. @default '' */
    prefix?: string;
    /** Register components globally (required for GenUI by-name resolution). @default true */
    global?: boolean;
    /** Restrict registration to these components only. @default all components */
    include?: string[];
  };
  /**
   * Composable auto-imports. `false` disables them. @default all composables
   */
  imports: false | { prefix?: string; include?: string[] };
  /** Inject the upstream `@copilotkit/vue` stylesheet. @default true */
  styles: boolean;
  /** Enable the Nuxt DevTools tab. @default true */
  devtools: boolean;
}

/**
 * Default module options merged with user configuration before `setup`.
 */
export const defaults: ModuleOptions = {
  runtime: {
    enabled: true,
    path: '/api/_copilotkit',
    model: 'openai/gpt-4o'
  },
  provider: {
    autoWrap: true
  },
  components: {
    prefix: '',
    global: true
  },
  imports: {},
  styles: true,
  devtools: true
};

export interface ModuleRuntimeConfig {
  /**
   * Server-only CopilotKit configuration (one-way: module options → runtimeConfig).
   * Override via environment variables:
   * - `NUXT_COPILOTKIT_MODEL` — Model identifier (default: 'openai/gpt-4o')
   * - `NUXT_COPILOTKIT_OPENAI_API_KEY` — OpenAI API key (default: '')
   * - `NUXT_COPILOTKIT_ANTHROPIC_API_KEY` — Anthropic API key (default: '')
   *
   * Note: Empty string ('') means unset — Nitro only applies env overrides to keys that exist.
   */
  copilotkit: {
    /** Model identifier forwarded to the CopilotKit runtime. @default 'openai/gpt-4o' */
    model: string;
    /** OpenAI API key for the built-in runtime. @default '' (unset) */
    openaiApiKey: string;
    /** Anthropic API key for the built-in runtime. @default '' (unset) */
    anthropicApiKey: string;
    /** Remote AG-UI agents mirrored from `runtime.agents`. @default {} */
    agents: Record<string, RemoteAgentConfig>;
  };
}
export interface ModulePublicRuntimeConfig {
  /**
   * Client-visible CopilotKit configuration.
   * Override via environment variables:
   * - `NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL` — Resolved runtime endpoint URL
   * - `NUXT_PUBLIC_COPILOTKIT_DEBUG` — Upstream debug flag
   */
  copilotkit: {
    /** Resolved runtime endpoint URL; single source of truth shared by route registration and the client provider. */
    runtimeUrl: string;
    /** Upstream debug flag mirrored from `provider.debug`. */
    debug?: boolean;
  };
}

// Augment Nuxt's RuntimeConfig types
declare module '@nuxt/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RuntimeConfig extends ModuleRuntimeConfig {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}
