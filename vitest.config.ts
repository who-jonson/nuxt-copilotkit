// Root Vitest config for nuxt-copilotkit — owns the design §9 test matrix via defineVitestConfig from @nuxt/test-utils/config.
import { defineVitestConfig } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';

/**
 * Design §9 test matrix owned by this config:
 * - `ssr.test.ts` — autoWrap SSR: 200, full page HTML, zero live state, no hydration warnings.
 * - `route.test.ts` — `/api/_copilotkit` + `/**` registered and responding; disabled/external
 *   modes register nothing; path override.
 * - `registration.test.ts` — prefix applied; composables resolve from `#copilotkit`;
 *   `#copilotkit/keys` resolves; `global` default true; `include` trims; `<CopilotKit>`
 *   registered universal (not client-only).
 * - `runtime-config.test.ts` — `NUXT_COPILOTKIT_*` env plumbing; `public.runtimeUrl` === resolved path.
 * - `upstream-drift.test.ts` — churn guard: runtime exports of `@copilotkit/vue/v2` vs the
 *   module barrel + registered component list.
 * - `genui.unit.test.ts` (Phase 4) — needs the Nuxt environment and therefore MUST carry the
 *   `// @vitest-environment nuxt` file pragma; the pragma resolves because this root config
 *   is created with `defineVitestConfig` (plan-check W2 fix).
 *
 * Integration specs (SSR/route/registration) run in the default node environment and drive a
 * built fixture via `@nuxt/test-utils` `setup()` + `$fetch`.
 */
export default defineVitestConfig({
  test: {
    environment: 'node',
    // Keep sibling git worktrees and the pnpm store out of test discovery.
    exclude: [...configDefaults.exclude, '.pi/**', '.pnpm-store/**']
  }
});
