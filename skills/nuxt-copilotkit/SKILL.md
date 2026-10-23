---
name: nuxt-copilotkit
description: |
  Building Nuxt apps with CopilotKit integration — SSR-safe components, runtime route setup,
  defineCopilotRuntime server utils, GenUI/HITL composables, and DevTools debugging.
  Trigger phrases: CopilotKit in Nuxt, runtime route, CopilotKit components, GenUI, HITL.
---

# nuxt-copilotkit Skill

SSR-safe [CopilotKit](https://copilotkit.ai) integration for Nuxt 4, providing a built-in Nitro runtime route, GenUI/HITL helpers, and a DevTools tab for debugging.

## Installation & Setup

Install the module and peer dependency:

```bash
pnpm add -D nuxt-copilotkit
pnpm add @copilotkit/vue
```

Optionally install `@copilotkit/runtime` (required for the built-in route):

```bash
pnpm add @copilotkit/runtime @ag-ui/client
```

Enable in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-copilotkit']
})
```

Set your provider API key via environment variable:

```bash
NUXT_COPILOTKIT_OPENAI_API_KEY=sk-...
```

## Module Options

Configure via the `copilotkit` key in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-copilotkit'],
  copilotkit: {
    runtime: {
      enabled: true,              // Register built-in route (default: true)
      path: '/api/_copilotkit',   // Route path (default: '/api/_copilotkit')
      url: undefined,             // External runtime URL (disables built-in route)
      model: 'openai/gpt-4o',     // Model identifier (default: 'openai/gpt-4o')
      agents: undefined           // Remote AG-UI agents by id: { default: { url, headers? } } (replaces BuiltInAgent)
    },
    provider: {
      autoWrap: true,             // Register the client plugin (module context + dev hint); you still wrap with <CopilotKit> (default: true)
      debug: false,               // Enable CopilotKit debug logging
      inspector: false            // Enable CopilotKit Inspector ('dev' | true | false)
    },
    components: {
      prefix: '',                 // Component name prefix (default: '')
      global: true,               // Register components globally (default: true)
      include: undefined          // Restrict to specific components (default: all)
    },
    imports: {},                  // Composable auto-imports (default: all)
    styles: true,                 // Inject @copilotkit/vue/styles.css (default: true)
    devtools: true                // Enable DevTools tab (default: true)
  }
})
```

### Runtime Modes

**Built-in route (default):** The module registers `/api/_copilotkit` (configurable via `runtime.path`) that proxies to `@copilotkit/runtime`.

**External runtime:** Set `runtime.url` to point to an external CopilotKit runtime endpoint. The built-in route is not registered.

**Disabled runtime:** Set `runtime: false` to disable all server-side registration. You must set `runtimeUrl` via environment variable (`NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL`) or runtime config.

### Environment Variables

Server-side (private):
- `NUXT_COPILOTKIT_MODEL` — Model identifier (default: `openai/gpt-4o`)
- `NUXT_COPILOTKIT_OPENAI_API_KEY` — OpenAI API key
- `NUXT_COPILOTKIT_ANTHROPIC_API_KEY` — Anthropic API key

Client-side (public):
- `NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL` — Runtime endpoint URL (overrides resolved path)
- `NUXT_PUBLIC_COPILOTKIT_DEBUG` — Debug logging flag

## Provider Setup

### Auto-wrap Mode (Default)

The upstream provider cannot be installed headlessly, so `autoWrap` only registers a client plugin (module context + a dev hint). Wrap your layout in `<CopilotKit>`; set `provider.autoWrap: false` to skip the plugin and hint:

```vue
<!-- app.vue -->
<template>
  <CopilotKit>
    <NuxtPage />
  </CopilotKit>
</template>
```

**SSR Safety Rule:** The `<CopilotKit>` wrapper renders its slot on the server (no CopilotKit browser code runs during SSR). Hydration is safe.

## Server Utilities

Auto-imported in server code (also importable from `#copilotkit/server`):

```ts
// server/plugins/copilotkit.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('copilotkit:runtime', ({ agents }) => {
    // Mutate in place; reassigning `agents` has no effect.
    agents.research = createRemoteAgent({ url: 'http://localhost:8000/agent' })
  })
})
```

**Available exports:**
- `defineCopilotRuntime(factory)` — Register a factory `(event) => CopilotRuntime`; runs once, lazily
- `getCopilotRuntime(event)` — Retrieve the (memoized) runtime instance
- `createRemoteAgent({ url, headers?, description? })` — `HttpAgent` for any AG-UI backend (Google ADK, Claude Agent SDK, VoltAgent, LangGraph, A2A bridges); needs optional peer `@ag-ui/client`

**Nitro hooks:** `copilotkit:request` (every request), `copilotkit:runtime` (once, with the agents registry).

## Client Composables & Components

The upstream `@copilotkit/vue` **v2** composables (legacy v1 `useCopilotAction`/`useCopilotReadable`/`useCopilotChat` are intentionally excluded) are auto-imported and also importable from `#copilotkit`:

```ts
useAgent(...)
useFrontendTool(...)
useAgentContext(...)
useSuggestions(...)
useHumanInTheLoop(...)
```

**Module-owned composables:**
- `useNuxtCopilotKit()` — Access module runtime config (from `#copilotkit/keys`)

**Registered components (global by default):**
- `<CopilotKit>` — Manual provider wrapper (when `autoWrap: false`)
- Upstream v2 components such as `<CopilotChat>`, `<CopilotSidebar>`, `<CopilotPopup>` (client-only; all 30 are registered unless `components.include` narrows them)

## GenUI & HITL Helpers

The module provides composables for Generative UI and Human-in-the-Loop patterns:

```ts
// Render a tool call with a component (resolved by name when a string is passed)
useCopilotGenUI({ name: 'generateCard', parameters: schema, render: 'ProductCard' })

// Human-in-the-loop approval
useCopilotHITL({ name: 'approveAction', parameters: schema, render: 'ApprovalCard' })
```

Both are no-ops during SSR and take an optional `deps` array of watch sources.

Refer to the [CopilotKit documentation](https://docs.copilotkit.ai) for detailed GenUI and HITL patterns.

## DevTools Tab

When `devtools: true` (default), a Nuxt DevTools tab displays:
- Runtime configuration (URL, model, provider settings)
- Component registration status
- Auto-import diagnostics
- Health checks for `@copilotkit/runtime` peer dependency

Access via Nuxt DevTools → CopilotKit tab.

## Troubleshooting

### `ensurePeer` Error (Missing `@copilotkit/runtime`)

If using the built-in runtime route, install the optional peer dependency:

```bash
pnpm add @copilotkit/runtime @ag-ui/client
```

Or disable the built-in route and use an external runtime:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  copilotkit: {
    runtime: {
      url: 'https://your-external-runtime.example.com'
    }
  }
})
```

### Hydration Mismatch

The `<CopilotKit>` wrapper is SSR-safe and renders its slot on the server. If you see hydration errors:
- Ensure you're not conditionally rendering the wrapper based on client-only state
- Check that `@copilotkit/vue` is listed in `build.transpile` (the module does this automatically)

### DevTools Tab Not Visible

Ensure `devtools: true` in your config and that you're running in development mode (`nuxt dev`).

## Architecture Reference

For module internals, configuration flow, and SSR boundary details, see:
- [ARCHITECTURE.md](https://github.com/who-jonson/nuxt-copilotkit/blob/main/ARCHITECTURE.md) — Module layering and `ModuleOptions` reference
- [Implementation Plan](https://github.com/who-jonson/nuxt-copilotkit/blob/main/docs/plans/2026-10-23-nuxt-copilotkit-implementation-plan.md) — Design decisions and success criteria
