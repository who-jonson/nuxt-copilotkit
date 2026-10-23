<!-- GenUI demo page for the nuxt-copilotkit playground. Demonstrates component integration. -->
<template>
  <div style="height: 100vh; display: flex; flex-direction: column;">
    <header style="padding: 1rem; border-bottom: 1px solid #ddd;">
      <h1>GenUI Demo (Mock Agent)</h1>
      <NuxtLink to="/">← Back to Home</NuxtLink>
    </header>
    <CopilotKit>
      <div style="flex: 1; padding: 2rem;">
        <p>This page demonstrates CopilotKit integration with a mock agent that streams canned tool calls.</p>
        <p>The mock agent in <code>/api/_copilotkit</code> returns deterministic responses for CI-safe testing.</p>
        <CopilotChat />
      </div>
    </CopilotKit>
  </div>
</template>

<script setup lang="ts">
// GenUI composable registration will be demonstrated when Phase 4 implements
// the src/runtime/copilotkit/index.ts barrel and useCopilotGenUI helper.
</script>
