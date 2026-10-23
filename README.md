# nuxt-copilotkit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

SSR-safe CopilotKit integration for Nuxt 4 — built-in Nitro runtime route, GenUI/HITL helpers, and a devtools tab.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
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

The module automatically wraps your app in `<CopilotKitProvider>` with the built-in runtime route (`/api/_copilotkit`). Use CopilotKit composables anywhere:

```vue
<script setup lang="ts">
const { appendMessage, messages } = useCopilotChat()

useCopilotAction({
  name: 'sayHello',
  description: 'Say hello to the user',
  handler: async ({ name }) => {
    return `Hello, ${name}!`
  }
})
</script>

<template>
  <div>
    <CopilotSidebar />
  </div>
</template>
```

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

### Server Runtime Utilities

Define custom runtime handlers with `defineCopilotRuntime`:

```ts
// server/api/custom-runtime.ts
import { defineCopilotRuntime } from '#copilotkit/server'

export default defineCopilotRuntime({
  // Custom CopilotKit runtime configuration
})
```

### SSR Safety

The `<CopilotKit>` wrapper renders its slot on the server (no browser code runs during SSR). All CopilotKit composables are client-only and safe to use with SSR.

For manual provider control, disable auto-wrap:

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
