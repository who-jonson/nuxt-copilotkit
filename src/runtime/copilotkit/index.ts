/**
 * Central barrel for nuxt-copilotkit composables and types.
 * Re-exports upstream @copilotkit/vue v2 composables (21 total, legacy v1 excluded),
 * module-owned keys, and Phase-4 GenUI helpers.
 * Drift-guard coverage: test/upstream-drift.test.ts.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Upstream v2 composables (21 total; legacy v1 useCopilotAction/useCopilotReadable excluded)
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Agent hooks (17 from hooks/)
  useAgent,
  useAgentContext,
  useAttachments,
  useCapabilities,
  useComponent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
  useHumanInTheLoop,
  useInterrupt,
  useKatexStyles,
  useKeyboardHeight,
  useRenderActivityMessage,
  useRenderCustomMessages,
  useRenderTool,
  useSuggestions,
  useThreads,

  // Provider composables (4 from providers/)
  useCopilotKit,
  useCopilotChatConfiguration,
  useLicenseContext,
  useSandboxFunctions
} from '@copilotkit/vue/v2';

// ─────────────────────────────────────────────────────────────────────────────
// Companion types
// ─────────────────────────────────────────────────────────────────────────────

export type {
  // Core types commonly used with the composables above
  UseAgentUpdate
} from '@copilotkit/vue/v2';

// ─────────────────────────────────────────────────────────────────────────────
// Module-owned keys and context
// ─────────────────────────────────────────────────────────────────────────────

export { NuxtCopilotKitKey, useNuxtCopilotKit } from './keys';
export type { NuxtCopilotKitContext } from './keys';

// ─────────────────────────────────────────────────────────────────────────────
// GenUI helpers (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

export { useCopilotGenUI, useCopilotHITL } from '../composables/genui';
