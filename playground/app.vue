<!-- Minimal SSR demo page for the nuxt-copilotkit playground; the marker element is asserted by design §9 ssr.test.ts HTML assertions (wired in Phase 2). -->
<template>
  <div>
    <h1>nuxt-copilotkit playground</h1>
    <p>Server-rendered demo page for the nuxt-copilotkit Nuxt module.</p>
    <div
      id="copilotkit-ssr-demo"
      data-testid="copilotkit-ssr-demo"
    >
      copilotkit-ssr-demo
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
