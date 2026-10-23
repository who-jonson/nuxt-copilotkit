# nuxt-copilotkit — v1 Design Document

**Date:** 2026-10-23
**Status:** Validated (all sections approved by maintainer)
**Process:** spec-dev brainstorming — 3 parallel design lenses (minimal scope / principled design / pragmatic balance) explored by subagents, then section-by-section validation.

---

## 1. Overview

`nuxt-copilotkit` is the official-quality Nuxt 4 module for integrating **CopilotKit** (the `@copilotkit/vue` v2-generation SDK) into Nuxt SSR applications — SSR-safe, near-zero-config, wrapper-and-glue around the official upstream packages.

Upstream gap this fills: CopilotKit ships SSR docs for React/Next but **nothing for Vue/Nuxt** (zero "Nuxt" occurrences in the `@copilotkit/vue` README as of 2026-10-23; their docs advise using React docs as the feature map). This module makes CopilotKit work out-of-the-box in Nuxt, and over time becomes the reference integration.

### Success criteria
- `playground/` runs a real chat end-to-end against the built-in Nitro route at `/api/_copilotkit` (SSE streaming verified).
- SSR never crashes: server render produces full page HTML with zero CopilotKit live state; no hydration-mismatch warnings.
- `@nuxt/test-utils` vitest fixtures pass (Section 8).
- GenUI: a named-component render tool resolves through Nuxt's auto-component registry in the playground (mock agent route, no live LLM key needed in CI).

---

## 2. Key Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Wrapper + glue around `@copilotkit/vue`**, never fork; **v2 API surface only** (v1.79.1+; legacy v1 exports ignored) | Avoids maintenance cliff; stays current with upstream |
| D2 | **Built-in Nitro route** hosting `CopilotRuntime` + `BuiltInAgent` (default `/api/_copilotkit` + `/api/_copilotkit/**`), path configurable via `runtime.path`; disable-able for external runtime | Zero-config backend story; keys via runtimeConfig/env |
| D3 | **SSR = SSR-safe hydration**, not server-rendered agent state (v1). Client-gated provider/context + client-hydrated chat UI | SSR of non-serializable agent state needs server round-trips — not worth v1 complexity; revisit later |
| D4 | **Hybrid provider model**: `provider.autoWrap: true` **by default** (zero-template) AND explicit `<CopilotKit>` wrapper component always available | Zero-config first-run; layout scoping via opt-out |
| D5 | **Pass-through public surface**; module owns only seams (options → runtimeConfig → plugin → server route). Facade API rejected | No docs drift, upstream types flow untouched |
| D6 | **Composables auto-import from `#copilotkit` barrel**; components via Nuxt auto-components (`addComponent` from `'@copilotkit/vue'`); explicit component imports via **`#components`** | Nuxt-idiomatic; single composable entry point |
| D7 | **vNext seams declared now as typed no-op Nitro hooks**: `copilotkit:runtime`, `copilotkit:request`, `copilotkit:threads` | Agent scaffolding / auth / persistence / Voltagent attach without breaking v1 |
| D8 | **`@copilotkit/runtime` is conditionally required** (`ensurePeer()` with actionable error) — only needed when built-in route enabled | External-runtime users don't pay install/deps cost |
| D9 | Node runtime presets only in v1 (route is a Node listener); edge runtimes documented unsupported | `createCopilotNodeListener` is Node API |
| D10 | **Docs site: docus on `@nuxt/content` — decision locked, phase deferred** (post-v1) | Ready-made Nuxt docs layer on top of content already in devDeps |

### Alternatives considered and rejected
- **Facade API** (own `useCopilot*`/`NuxtCopilot*` wrappers): type duplication, docs divergence, lags upstream — rejected by all three lenses. *Exception:* GenUI/HITL get small Nuxt helpers (Section 7).
- **Root-component monkey-patching** for zero-template provider: fragile across Vue/Nuxt minors, breaks transition boundaries — rejected by its own proposing lens.
- **Slim v1 deferring DevTools content + GenUI/HITL helpers**: viable speed play, but maintainer scope decision keeps all 4 scope items in v1 (built in risk order, last).

---

## 3. Architecture

Full detail in **[ARCHITECTURE.md](../../ARCHITECTURE.md)** — mermaid layering diagram, one-way config flow, SSR boundary mechanisms, vNext seam hooks, files map, and the complete `ModuleOptions` interface.

Summary: a pass-through module — `src/module.ts` wires options into a **client-only layer** (autoWrap provider default-on, explicit `<CopilotKit>` wrapper, GenUI/HITL helpers, `#copilotkit` composables barrel), a **Nitro server layer** (built-in `/api/_copilotkit[/**]` route with `CopilotRuntime` + `BuiltInAgent`, private keys via `runtimeConfig.copilotkit` / `NUXT_COPILOTKIT_*`, `#copilotkit/server` utils), and **three typed no-op Nitro hooks** (`copilotkit:runtime` / `:request` / `:threads`) reserved as vNext seams. Config flows one way (options → runtimeConfig); the route path is computed once and shared by registration and the client; SSR never evaluates CopilotKit browser code.

---

## 4. Provider wiring & SSR boundary

Two entry paths, one provider contract.

**Path A — autoWrap (default).** `plugin.client.ts` installs provider context app-wide via upstream's official API: prefer *app-level context install* (`app.provide` / Vue-plugin export if `@copilotkit/vue` exposes one — `CopilotKitCoreVue` exists upstream, suggesting a headless core). Keeps SSR vnode tree identical to client → **no root hydration mismatch**. (Vnode-wrapping the app root explicitly rejected: fragile, breaks transitions.)

**Path B — explicit.** `<CopilotKit>` wrapper reads `useRuntimeConfig().public.copilotkit`, forwards props to upstream `CopilotKitProvider`, renders `<slot/>` transparently in SSR (page content still server-renders; only live core / Inspector gate to client).

**Degrade policy:** if no SSR-safe headless install exists upstream, autoWrap automatically degrades to Path-B behavior with a one-line dev console hint — never a broken app.

**Hydration contract (acceptance test):** SSR HTML = full page content, zero CopilotKit live state → first client render adds provider context without changing the vnode tree → chat UI mounts post-hydration. `@nuxt/test-utils` fixture asserts no mismatch warnings.

---

## 5. Built-in runtime route

```ts
// src/runtime/server/api/copilotkit.ts (shape)
import { defineEventHandler, fromNodeMiddleware, useRuntimeConfig } from 'h3'
import { getCopilotRuntime } from '../utils/defineCopilotRuntime'
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node'

let handler: ReturnType<typeof fromNodeMiddleware> | null = null
export default defineEventHandler((event) => {
  if (!handler) {
    const runtime = getCopilotRuntime(event) // BuiltInAgent({ model, apiKey }); vNext-hook overridable
    handler = fromNodeMiddleware(createCopilotNodeListener({ runtime }))
  }
  return handler(event)
})
```

- Registered on `{path}` and `{path}/**` (defaults `/api/_copilotkit` + `/api/_copilotkit/**`) via `addServerHandler` — filename decoupled from route.
- **Three modes**: `{ enabled: true }` → built-in serves; `{ enabled: false, url }` → no route, client points externally; `runtime: false` → no route at all (BYO backend).
- **Keys**: `runtimeConfig.copilotkit.{openaiApiKey,anthropicApiKey,model}`, env `NUXT_COPILOTKIT_OPENAI_API_KEY` etc. Never client-visible.
- **Conditional dep**: `ensurePeer('@copilotkit/runtime')` → actionable install error when route enabled without the package.
- **`defineCopilotRuntime` / `getCopilotRuntime`** server utils auto-imported into Nitro + exposed at `#copilotkit/server` — users can build custom runtime routes today.

---

## 6. Auto-imports & component registration

- **Composables** → auto-import from **`#copilotkit`** barrel (`src/runtime/copilotkit/index.ts`): all 13 upstream composables (`useCopilotKit`, `useAgent`, `useFrontendTool`, `useRenderTool`, `useComponent`, `useHumanInTheLoop`, `useSuggestions`, `useThreads`, `useInterrupt`, …) re-exported unchanged + our two helpers. Explicit form works: `import { useCopilotKit } from '#copilotkit'`.
- **Components** → standard Nuxt auto-components: `addComponent({ name, export, filePath: '@copilotkit/vue', mode: 'client' })` for ~20 upstream components (`CopilotChat`, `CopilotSidebar`, `CopilotPopup`, `CopilotChatView`, `CopilotKitProvider`, `A2UISurfaceActivityRenderer`, …) **plus** our `CopilotKit` wrapper, under one prefix rule. **NOT** in `#copilotkit`; explicit imports via **`#components`** (`import { CopilotChat } from '#components'`).
- `prefix: ''` default; `global: true` default is **load-bearing for GenUI** (name-string resolution from LLM only works on globally-registered components) — documented when disabling.
- **Churn guard**: CI test diffs barrel composable exports + component registration list against installed `@copilotkit/vue` `index.d.ts`; fails with "update lists" on upstream adds/renames. Keeps the `^1.79.0` peer honest.


> **Erratum (2026-10-23, Spike A):** the counts above are estimates. `@copilotkit/vue@1.79.1` exposes **21** v2 composables (17 hooks + 4 provider composables incl. `useCopilotKit`) and **30** component exports (28 UI + 2 providers). Upstream `CopilotKitKey` is a private Symbol, so the §4 degrade policy is the active autoWrap behavior and module-owned keys ship at `#copilotkit/keys`; `<CopilotKit>` is registered as a universal component so its slot server-renders (§4).
---

## 7. GenUI & HITL Nuxt helpers

`src/runtime/composables/genui.ts`, exported from the #copilotkit barrel — thin upstream wrappers with 3 Nuxt conveniences:

1. **Name-based component resolution** (signature feature): `component: 'ProductCard'` resolves via `resolveComponent()` against Nuxt auto-components (refs also accepted).
2. **SSR guarantee**: no-op on server (`import.meta.client` assert) — harmless if accidentally called server-side.
3. **Dev-friendly failures**: unresolvable name → explicit dev error naming the component + `global: true` reminder; missing provider context → one-line dev warning.

```ts
useCopilotGenUI({ tool: 'show_product_card', component: 'ProductCard', description: '…', parameters: schema })
useCopilotHITL({ tool: 'confirm_payment', component: 'ConfirmPaymentDialog', onApprove: async (payload) => { … } })
```

Both share `useState`-backed registries (active render tools / pending HITL) that the DevTools tab reads. No wrappers over `useSuggestions`/`useThreads` — upstream passes through.

---

## 8. DevTools tab

Reuses starter scaffold; tab id `nuxt-copilotkit` at `/__nuxt-copilotkit`; **read-only in v1**, three panels reading only module-owned state (no dependence on upstream introspection):

1. **Config** — resolved options, `public.copilotkit`, redacted presence-check for `NUXT_COPILOTKIT_*` env (booleans, never values).
2. **Registrations** — components, imports, active GenUI tools, pending HITL (from Section 7 registries), route URL + health probe.
3. **Docs** — `docs-page` capability; links to the deferred docus site once it exists.

---

## 9. Testing strategy

`@nuxt/test-utils` + vitest (in starter):

| Test | Asserts |
|---|---|
| `ssr.test.ts` | autoWrap SSR: 200, full page HTML, zero live state, no hydration warnings |
| `route.test.ts` | `/api/_copilotkit` + `/**` registered & responding; disabled/external modes register nothing; path override |
| `registration.test.ts` | prefix applied; composables resolve from `#copilotkit`; `global` default true; `include` trims |
| `runtime-config.test.ts` | `NUXT_COPILOTKIT_*` env plumbing; `public.runtimeUrl` === resolved path |
| `upstream-drift.test.ts` | churn-guard diffs vs upstream `index.d.ts` |
| `genui.unit.test.ts` | name resolution, SSR no-op, dev errors |

Playground = E2E criterion: chat vs `/api/_copilotkit` + mock-agent GenUI page (CI-safe without live key).

---

## 10. Build order (derisk-first)

0. Housekeeping: renames (`configKey`, `meta.name`, devtools id, playground key); deps (`@copilotkit/vue` peer `^1.79.0`; `@copilotkit/runtime` conditional).
1. **Spike #1** — route bridge: node-listener ↔ Nitro (`fromNodeMiddleware`), SSE round-trip in playground.
2. **Spike #2** — provider/SSR: server-import safety of `@copilotkit/vue`; headless context install availability.
3. Module skeleton: `options.ts`, `nuxt/schema` augmentation, runtimeConfig, alias, `addServerHandler`.
4. Client layer: `plugin.client.ts`, `CopilotKit.vue`, styles.
5. Registration pass (components + composables barrel).
6. GenUI/HITL helpers.
7. DevTools tab.
8. Playground: chat E2E + mock-agent GenUI.

## 11. Versioning & constraints

- Independent module versioning; peer `@copilotkit/vue: ^1.79.0` floor-pin; latest-verified in README.
- Pass-through principle: upstream breaking renames surface to users (documented, not hidden).
- v1: Node presets only; edge runtimes unsupported (documented).

## 12. Open-questions ledger

1. Exact v2 listener subpath surface (`/threads`, `/agents/:id/runs`) — `/**` covers; document after spike #1.
2. Official headless/plugin install API in `@copilotkit/vue`? (autoWrap mechanism quality)
3. h3 v2 in Nuxt 4.6: `fromNodeMiddleware` vs `fromNodeHandler`.
4. BuiltInAgent v2 `model` string format (`'openai/gpt-4o'`) — verify in spike #1.
5. Health-probe semantics (`GET /api/_copilotkit`) for DevTools.

## 13. Future (post-v1, decision-locked where noted)

- **Docs site: docus on `@nuxt/content`** (decision locked; phase deferred). Directory convention: `documentation/` is reserved as the docs app root (published markdown in `documentation/content/`); internal design/planning documents stay in `docs/plans/` (never published — the two trees are fully separate).
- vNext hooks consumers: agent scaffolding (`copilotkit:runtime`), auth glue (`copilotkit:request`), thread persistence (`copilotkit:threads` — storage engine chosen then; better-sqlite3 is `@nuxt/content`'s concern, not the module's).
- Voltagent integration (post-v1).
- Edge-runtime support for the route.
- DevTools two-way actions (interrupt approval etc.).
- Server-rendered agent state (revisit when upstream supports serializable state).
