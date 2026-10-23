<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client';

const client = useDevtoolsClient();
</script>

<template>
  <div class="relative p-10 n-bg-base flex flex-col h-screen">
    <h1 class="text-3xl font-bold">
      Nuxt CopilotKit
    </h1>
    <div class="opacity-50 mb-4">
      CopilotKit integration for Nuxt
    </div>
    <div
      v-if="client"
      class="flex flex-col gap-2"
    >
      <div class="text-green">
        Nuxt DevTools is connected
      </div>
      <div>
        The current app is using
        <code class="text-green">vue@{{ client.host.nuxt.vueApp.version }}</code>
      </div>
      <div>
        <NButton
          n="green"
          class="mt-4"
          @click="client!.host.devtools.close()"
        >
          Close DevTools
        </NButton>
      </div>
    </div>
    <div
      v-else
      class="opacity-60"
    >
      This page must be opened inside Nuxt DevTools.
    </div>

    <div class="flex-auto" />
  </div>
</template>
