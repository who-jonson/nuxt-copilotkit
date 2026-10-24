# nuxt-copilotkit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

SSR-safe CopilotKit integration for Nuxt 4 — built-in Nitro runtime route, GenUI/HITL helpers, and a devtools tab.

- [📖 &nbsp;Architecture](/ARCHITECTURE.md)
- [📋 &nbsp;Implementation Plan](/docs/plans/2026-10-23-nuxt-copilotkit-implementation-plan.md)

## Status

**v1 is currently in development.** This module provides the core integration surface defined in the implementation plan:

- SSR-safe hydration for CopilotKit components
- Built-in Nitro route (`/api/_copilotkit`) for runtime integration
- Hybrid provider with zero-template client plugin and `<CopilotKit>` wrapper
- Pass-through composables via `#copilotkit` and auto-registered upstream components
- GenUI/HITL helpers (`useCopilotGenUI`, `useCopilotHITL`)
- DevTools tab for configuration and health monitoring

## Quick Setup

1. Install the module and required peer dependencies:

```bash
pnpm add -D nuxt-copilotkit
```

2. Install the required peer dependency `@copilotkit/vue`:

```bash
pnpm add @copilotkit/vue
```

3. Optionally install `@copilotkit/runtime` (only needed when using the built-in Nitro route):

```bash
pnpm add @copilotkit/runtime
```

4. Add `nuxt-copilotkit` to the `modules` section of `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-copilotkit'
  ]
})
```

That's it! You can now use nuxt-copilotkit in your Nuxt app ✨

## Usage

### Basic Setup

Set your provider API key:

```bash
NUXT_COPILOTKIT_OPENAI_API_KEY=sk-...
```

The module registers the built-in runtime route (`/api/_copilotkit`), all upstream `@copilotkit/vue` components and the `#copilotkit` composables. Wrap your layout in the SSR-safe `<CopilotKit>` component (the upstream provider cannot be installed headlessly), then use components and composables anywhere:

```vue
<!-- app.vue -->
<template>
  <CopilotKit>
    <NuxtPage />
  </CopilotKit>
</template>
```

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
useFrontendTool({
  name: 'sayHello',
  description: 'Say hello to the user',
  handler: async ({ name }: { name: string }) => `Hello, ${name}!`
})
</script>

<template>
  <CopilotSidebar />
</template>
```

> `<CopilotKit>` renders its slot on the server and mounts the live provider after hydration, so the wrapped subtree is remounted once on the client. Keep heavy page state out of the wrapper's direct children if that matters.

### Custom Configuration

Configure via the `copilotkit` key in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-copilotkit'],
  copilotkit: {
    runtime: {
      path: '/api/copilot',      // Custom route path
      model: 'openai/gpt-4o'      // Model identifier
    },
    provider: {
      debug: true,                 // Enable debug logging
      inspector: 'dev'             // Show CopilotKit Inspector in dev
    },
    components: {
      global: true                 // Register components globally (required for GenUI)
    }
  }
})
```

### Connecting an agent framework (remote AG-UI agents)

Any backend that speaks the [AG-UI](https://docs.copilotkit.ai) HTTP protocol (Google ADK, Claude Agent SDK, VoltAgent, LangGraph, A2A bridges, ...) can be registered by URL. Remote agents replace the default `BuiltInAgent`, so no model API key is needed in Nuxt:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  copilotkit: {
    runtime: {
      agents: {
        default: { url: 'http://localhost:8000/agent', headers: { Authorization: 'Bearer ...' } }
      }
    }
  }
})
```

This needs `@copilotkit/runtime` (which brings `@ag-ui/client`). Select a non-`default` agent in the UI with the component's `agent-id` prop.

### Server Runtime Utilities

For dynamic setups, customize the runtime from a server plugin or the Nitro hook; the factory runs once, lazily, on the first request:

```ts
// server/plugins/copilotkit.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('copilotkit:runtime', ({ agents }) => {
    // Mutate `agents` in place; reassigning `agents` has no effect.
    agents.research = createRemoteAgent({ url: process.env.RESEARCH_AGENT_URL! })
  })
})
```

Or take full control with `defineCopilotRuntime(factory)` (`#copilotkit/server`, also auto-imported in server code), which must return a `CopilotRuntime`.

Server utilities: `defineCopilotRuntime`, `getCopilotRuntime`, `createRemoteAgent`.

### SSR Safety

The `<CopilotKit>` wrapper renders its slot on the server (no browser code runs during SSR). All CopilotKit composables are client-only and safe to use with SSR.

`provider.autoWrap` (default `true`) registers the module's client plugin, which provides module context and prints a one-line dev hint. Set it to `false` to skip the plugin and the hint:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  copilotkit: {
    provider: { autoWrap: false }
  }
})
```

```vue
<!-- app.vue -->
<template>
  <CopilotKit>
    <NuxtPage />
  </CopilotKit>
</template>
```

## Development

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Develop with playground
pnpm dev

# Develop with playground, with bundled client ui
pnpm play:prod

# Run ESLint
pnpm lint

# Run Vitest
pnpm test
```

## Documentation

- **[ARCHITECTURE.md](/ARCHITECTURE.md)** — Module layering, configuration flow, SSR boundary, and complete `ModuleOptions` reference
- **[Implementation Plan](/docs/plans/2026-10-23-nuxt-copilotkit-implementation-plan.md)** — Design decisions, success criteria, test matrix, and phased rollout

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-copilotkit/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-copilotkit

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-copilotkit.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-copilotkit

[license-src]: https://img.shields.io/npm/l/nuxt-copilotkit.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-copilotkit

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt
[nuxt-href]: https://nuxt.com
