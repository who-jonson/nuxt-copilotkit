<div align="center">

# nuxt-copilotkit

**AI copilots, generative UI and agents for Nuxt — SSR-safe, zero-boilerplate, powered by [CopilotKit](https://copilotkit.ai).**

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

[Features](#features) · [Quick start](#quick-start) · [Usage](#usage) · [Configuration](#configuration) · [Server](#server-runtime) · [AI agent skill](#ai-agent-skill) · [Architecture](./ARCHITECTURE.md)

</div>

> [!WARNING]
> **v1 is in active development.** The API surface is locked in [ARCHITECTURE.md](./ARCHITECTURE.md), but expect rough edges until the first stable release.

## Why

[`@copilotkit/vue`](https://docs.copilotkit.ai) gives you chat UIs, frontend tools and generative UI; [`@copilotkit/runtime`](https://docs.copilotkit.ai) talks to models and [AG-UI](https://docs.ag-ui.com) agents. Wiring both into Nuxt by hand means a server route, a provider that must not run during SSR, component registration, and secrets that must stay on the server.

`nuxt-copilotkit` does that wiring for you, the Nuxt way: one module, configured from `nuxt.config`, with runtime config and env overrides.

## Features

- ⚡️ **Built-in runtime route** — a Nitro handler at `/api/_copilotkit`, created lazily on first request
- 🛡️ **SSR-safe** — the `<CopilotKit>` wrapper renders its slot on the server; browser-only code never runs in SSR
- 🧩 **Auto-registered** — every upstream `@copilotkit/vue` component and composable, auto-imported and also available from `#copilotkit`
- 🎨 **Generative UI & human-in-the-loop** — `useCopilotGenUI` and `useCopilotHITL`, with components resolvable by name
- 🤖 **Bring any agent** — register remote AG-UI agents (LangGraph, Google ADK, Claude Agent SDK, VoltAgent, A2A bridges, …) by URL
- 🪝 **Extensible server** — `copilotkit:*` Nitro hooks, or full control with `defineCopilotRuntime`
- 🔐 **Secrets stay server-side** — API keys and agent headers live in private `runtimeConfig`
- 🛠️ **Nuxt DevTools tab** — inspect runtime mode, resolved config and API key status
- 🧠 **Ships an AI agent skill** — teach Claude Code, Cursor & co. how to use the module

## Quick start

```bash
npx nuxt module add @whoj/nuxt-copilotkit
```

Add your model key to `.env`:

```bash
NUXT_COPILOTKIT_OPENAI_API_KEY=sk-...
```

Wrap your app and drop in a chat:

```vue
<!-- app/app.vue -->
<template>
  <CopilotKit>
    <NuxtPage />
    <CopilotSidebar />
  </CopilotKit>
</template>
```

That's it ✨ — `CopilotSidebar` talks to `/api/_copilotkit`, which runs `openai/gpt-4o` by default.

> [!TIP]
> Your package manager installs `@copilotkit/vue`. `@copilotkit/runtime` is an optional peer, only needed for the built-in route; if it is missing, the module prints the exact install command.

<details>
<summary>Manual install</summary>

```bash
pnpm add -D @whoj/nuxt-copilotkit
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@whoj/nuxt-copilotkit']
})
```

</details>

## Usage

### Frontend tools

Let the model call functions in the browser. All upstream composables are auto-imported:

```vue
<script setup lang="ts">
useFrontendTool({
  name: 'sayHello',
  description: 'Say hello to the user',
  handler: async ({ name }: { name: string }) => `Hello, ${name}!`
})
</script>
```

### Generative UI

Render your own component while a tool runs. `render` accepts a component, a render function, or the **name** of a globally registered component:

```vue
<script setup lang="ts">
import { z } from 'zod'

useCopilotGenUI({
  name: 'showWeather',
  description: 'Show the weather for a city',
  parameters: z.object({ city: z.string() }),
  render: 'WeatherCard' // resolved from components/WeatherCard.vue
})
</script>
```

Use `name: '*'` to register a catch-all renderer for any tool without its own UI.

### Human in the loop

Pause the agent until the user responds:

```vue
<script setup lang="ts">
useCopilotHITL({
  name: 'confirmBooking',
  description: 'Ask the user to confirm a booking',
  render: 'ConfirmBooking'
})
</script>
```

Both helpers are no-ops during SSR and show up in the DevTools registry.

### SSR behaviour

`<CopilotKit>` renders its slot on the server and mounts the live provider after hydration, so the wrapped subtree remounts once on the client. Keep heavy page state out of its direct children if that matters.

## Configuration

Everything lives under the `copilotkit` key. Defaults shown:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@whoj/nuxt-copilotkit'],
  copilotkit: {
    runtime: {                    // `false` disables all server registrations
      enabled: undefined,         // auto: on when a server runtime exists (not `ssr: false`/static)
      path: '/api/_copilotkit',   // registers `path` and `path/**`
      url: undefined,             // external runtime; skips the built-in route
      model: 'openai/gpt-4o',
      agents: {}                  // remote AG-UI agents, see below
    },
    provider: {
      autoWrap: true,             // client plugin providing module context
      debug: false,               // upstream debug logging
      inspector: false            // `true` | `'dev'`; never runs in SSR/production
    },
    components: {                 // `false` disables registration
      prefix: '',
      global: true,               // required for GenUI by-name resolution
      include: undefined          // restrict to a list of components
    },
    imports: {},                  // `false` | { prefix, include }
    styles: true,                 // inject the upstream stylesheet
    devtools: true
  }
})
```

### Environment variables

| Variable | Purpose |
|---|---|
| `NUXT_COPILOTKIT_OPENAI_API_KEY` | OpenAI key for the built-in runtime (server only) |
| `NUXT_COPILOTKIT_ANTHROPIC_API_KEY` | Anthropic key for the built-in runtime (server only) |
| `NUXT_COPILOTKIT_MODEL` | Override `runtime.model` |
| `NUXT_PUBLIC_COPILOTKIT_RUNTIME_URL` | Runtime endpoint used by the client (needed with `runtime: false`) |
| `NUXT_PUBLIC_COPILOTKIT_DEBUG` | Upstream debug flag |

### Remote AG-UI agents

Any backend that speaks [AG-UI](https://docs.ag-ui.com) over HTTP can be registered by URL. Remote agents replace the default built-in agent, so Nuxt needs no model key:

```ts
export default defineNuxtConfig({
  copilotkit: {
    runtime: {
      agents: {
        default: {
          url: 'http://localhost:8000/agent',
          headers: { Authorization: `Bearer ${process.env.AGENT_TOKEN}` } // kept in private runtimeConfig
        }
      }
    }
  }
})
```

Select a non-`default` agent with the component's `agent-id` prop.

### Bring your own runtime

Point the client at a runtime hosted elsewhere and skip the built-in route:

```ts
export default defineNuxtConfig({
  copilotkit: { runtime: { url: 'https://copilot.example.com/api' } }
})
```

## Server runtime

### Hooks

The module calls typed Nitro runtime hooks you can listen to from a server plugin:

| Hook | When | Payload |
|---|---|---|
| `copilotkit:runtime` | once, when the runtime is created | `{ event, agents }` — mutate `agents` in place |
| `copilotkit:request` | every request to the runtime route | `event` |
| `copilotkit:threads` | reserved for thread features | `{ event, threadId? }` |

```ts
// server/plugins/copilotkit.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('copilotkit:runtime', ({ agents }) => {
    agents.research = createRemoteAgent({ url: process.env.RESEARCH_AGENT_URL! })
  })
})
```

> [!NOTE]
> The hook types are added to both the server **and** app type contexts. During SSR your `components`, `composables` and plugins run inside the same Nitro process, so hook calls and handlers made from SSR code are type-checked too.

### Full control

Return your own `CopilotRuntime` with `defineCopilotRuntime(factory)`. Server utilities (`defineCopilotRuntime`, `getCopilotRuntime`, `createRemoteAgent`) are auto-imported in server code and available from `#copilotkit/server`.

## DevTools

With [Nuxt DevTools](https://devtools.nuxt.com) enabled, a **CopilotKit** tab shows the runtime mode, resolved public config, API key status (never the key itself) and module options.

## AI agent skill

The repo ships a skill that teaches coding agents how to use this module. Install it with whichever tool you use:

```bash
# Any agent (Claude Code, Cursor, Codex, …) via skills.sh
npx skills add who-jonson/nuxt-copilotkit

# Claude Code plugin marketplace
claude plugin marketplace add who-jonson/nuxt-copilotkit
claude plugin install nuxt-copilotkit@whoj
```

## Contributing

```bash
pnpm install
pnpm dev:prepare   # stub build + type generation
pnpm dev           # playground
pnpm lint
pnpm test
pnpm test:types
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for layering, config flow and the SSR boundary before changing module code.

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@whoj/nuxt-copilotkit/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@whoj/nuxt-copilotkit

[npm-downloads-src]: https://img.shields.io/npm/dm/@whoj/nuxt-copilotkit.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@whoj/nuxt-copilotkit

[license-src]: https://img.shields.io/npm/l/@whoj/nuxt-copilotkit.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@whoj/nuxt-copilotkit

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
