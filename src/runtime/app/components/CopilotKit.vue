<!--
  Universal CopilotKit wrapper component for nuxt-copilotkit.
  MUST be universal (NOT mode:'client') to ensure slot content server-renders.
  Renders <slot/> transparently in SSR and during hydration; switches to upstream
  CopilotKitProvider after onMounted. Per Design §4/§1 criterion 2.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CopilotKitProvider } from '@copilotkit/vue';
import { useRuntimeConfig } from '#imports';
import type { ModulePublicRuntimeConfig } from '@whoj/nuxt-copilotkit';

defineOptions({ inheritAttrs: false });

// Read public runtime config (runtimeUrl + debug); defensive cast
const ck = (useRuntimeConfig().public.copilotkit || {}) as ModulePublicRuntimeConfig['copilotkit'];

// false on SSR + hydration → identical vnode tree; true after mount → live provider
const live = ref(false);
onMounted(() => {
  live.value = true;
});
</script>

<template>
  <!-- Live provider gates to client-only (after hydration) -->
  <CopilotKitProvider
    v-if="live"
    :runtime-url="ck.runtimeUrl"
    :debug="ck.debug"
    v-bind="$attrs"
  >
    <slot />
  </CopilotKitProvider>
  <!-- Transparent slot on SSR and during hydration -->
  <slot v-else />
</template>
