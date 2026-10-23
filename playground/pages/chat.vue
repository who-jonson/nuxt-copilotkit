<!-- Chat demo page wrapping CopilotChat against the built-in runtime route. -->
<template>
  <div style="height: 100vh; display: flex; flex-direction: column;">
    <header style="padding: 1rem; border-bottom: 1px solid #ddd;">
      <h1>CopilotChat Demo</h1>
      <NuxtLink to="/">← Back to Home</NuxtLink>
    </header>
    <CopilotKit>
      <CopilotChat style="flex: 1;" />
    </CopilotKit>
  </div>
</template>

<script setup lang="ts">
</script>
