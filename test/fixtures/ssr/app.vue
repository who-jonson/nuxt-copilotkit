<!--
  SSR fixture page for ssr.test.ts.
  INTERIM: Manual component usage until L2E reconciles global component registration.
  Demonstrates slot content rendering on SSR without CopilotKit provider markup.
-->
<template>
  <CopilotKit>
    <div id="ssr-slot-marker">
      SSR slot content — this must appear in server-rendered HTML
    </div>
  </CopilotKit>
</template>

<script setup lang="ts">
import CopilotKit from '../../../src/runtime/components/CopilotKit.vue';
import { useNuxtCopilotKit } from '#copilotkit/keys';

// Verify #copilotkit/keys alias resolution
const _context = useNuxtCopilotKit();
// Context will be undefined on server (plugin is .client), defined on client
</script>
