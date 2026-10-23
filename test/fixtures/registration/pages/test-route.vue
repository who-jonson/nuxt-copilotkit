<template>
  <div>
    <h2>Test Route Page</h2>
    <p>Runtime URL: {{ runtimeConfig.public.copilotkit.runtimeUrl }}</p>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
</script>
