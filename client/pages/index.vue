<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client';

interface DevToolsConfig {
  options: {
    runtime: { enabled?: boolean; path?: string; url?: string; model?: string } | false;
    provider: { autoWrap?: boolean; debug?: boolean; inspector?: boolean | 'dev' };
    components: { prefix?: string; global?: boolean; include?: string[] } | false;
    imports: { prefix?: string; include?: string[] } | false;
    styles: boolean;
    devtools: boolean;
  };
  publicConfig: {
    runtimeUrl: string;
    debug?: boolean;
  };
  apiKeys: {
    openaiSet: boolean;
    anthropicSet: boolean;
  };
  runtimeMode: 'builtin' | 'external' | 'disabled';
}

const client = useDevtoolsClient();

const activeTab = ref('config');

// RPC config data
const configData = ref<DevToolsConfig | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Fetch config from server RPC
async function fetchConfig() {
  if (!client.value) return;

  loading.value = true;
  error.value = null;

  try {
    // Namespaced proxy pairing with the server's `extendServerRpc('nuxt-copilotkit', ...)`
    const rpc = client.value.devtools.extendClientRpc<{ getConfig: () => DevToolsConfig }>('nuxt-copilotkit', {});
    configData.value = await rpc.getConfig();
  }
  catch (err: unknown) {
    error.value = (err as Error)?.message || 'Failed to fetch config';
  }
  finally {
    loading.value = false;
  }
}

// Auto-fetch when client connects
watchEffect(() => {
  if (client.value) {
    fetchConfig();
  }
});
</script>

<template>
  <div class="relative n-bg-base flex flex-col h-screen">
    <!-- Header -->
    <div class="p-4 border-b n-border-base">
      <h1 class="text-2xl font-bold">
        CopilotKit
      </h1>
      <div class="opacity-50 text-sm">
        CopilotKit integration for Nuxt
      </div>
    </div>

    <div
      v-if="!client"
      class="flex-1 flex items-center justify-center opacity-60"
    >
      This page must be opened inside Nuxt DevTools.
    </div>

    <div
      v-else
      class="flex-1 flex flex-col overflow-hidden"
    >
      <!-- Tab Navigation -->
      <div class="flex gap-2 px-4 pt-4 border-b n-border-base">
        <button
          class="px-4 py-2 rounded-t-md transition"
          :class="activeTab === 'config' ? 'n-bg-active font-semibold' : 'hover:n-bg-hover'"
          @click="activeTab = 'config'"
        >
          Config
        </button>
        <button
          class="px-4 py-2 rounded-t-md transition"
          :class="activeTab === 'registrations' ? 'n-bg-active font-semibold' : 'hover:n-bg-hover'"
          @click="activeTab = 'registrations'"
        >
          Registrations
        </button>
        <button
          class="px-4 py-2 rounded-t-md transition"
          :class="activeTab === 'docs' ? 'n-bg-active font-semibold' : 'hover:n-bg-hover'"
          @click="activeTab = 'docs'"
        >
          Docs
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-auto p-4">
        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex items-center justify-center h-full"
        >
          <div class="text-center">
            <div class="text-lg opacity-60">
              Loading...
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex items-center justify-center h-full"
        >
          <div class="text-center text-red-500">
            <div class="text-lg font-semibold">
              Error
            </div>
            <div class="text-sm opacity-80 mt-2">
              {{ error }}
            </div>
            <NButton
              n="red"
              class="mt-4"
              @click="fetchConfig"
            >
              Retry
            </NButton>
          </div>
        </div>

        <!-- Config Panel -->
        <div
          v-else-if="activeTab === 'config' && configData"
          class="space-y-4"
        >
          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              Runtime Mode
            </h2>
            <div class="flex items-center gap-2">
              <NBadge
                :type="configData.runtimeMode === 'builtin' ? 'success' : configData.runtimeMode === 'external' ? 'info' : 'warning'"
              >
                {{ configData.runtimeMode }}
              </NBadge>
            </div>
          </div>

          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              Public Config
            </h2>
            <div class="space-y-2 font-mono text-sm">
              <div class="flex justify-between">
                <span class="opacity-60">runtimeUrl:</span>
                <span>{{ configData.publicConfig.runtimeUrl || '(empty)' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-60">debug:</span>
                <span>{{ configData.publicConfig.debug ?? 'undefined' }}</span>
              </div>
            </div>
          </div>

          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              API Keys
            </h2>
            <div class="space-y-2 font-mono text-sm">
              <div class="flex justify-between">
                <span class="opacity-60">OpenAI:</span>
                <NBadge :type="configData.apiKeys.openaiSet ? 'success' : 'warning'">
                  {{ configData.apiKeys.openaiSet ? 'Set' : 'Not Set' }}
                </NBadge>
              </div>
              <div class="flex justify-between">
                <span class="opacity-60">Anthropic:</span>
                <NBadge :type="configData.apiKeys.anthropicSet ? 'success' : 'warning'">
                  {{ configData.apiKeys.anthropicSet ? 'Set' : 'Not Set' }}
                </NBadge>
              </div>
            </div>
          </div>

          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              Module Options
            </h2>
            <div class="space-y-3 font-mono text-xs">
              <div>
                <div class="opacity-60 mb-1">
                  runtime:
                </div>
                <pre class="n-code-block p-2 rounded overflow-auto">{{ JSON.stringify(configData.options.runtime, null, 2) }}</pre>
              </div>
              <div>
                <div class="opacity-60 mb-1">
                  provider:
                </div>
                <pre class="n-code-block p-2 rounded overflow-auto">{{ JSON.stringify(configData.options.provider, null, 2) }}</pre>
              </div>
              <div>
                <div class="opacity-60 mb-1">
                  components:
                </div>
                <pre class="n-code-block p-2 rounded overflow-auto">{{ JSON.stringify(configData.options.components, null, 2) }}</pre>
              </div>
              <div>
                <div class="opacity-60 mb-1">
                  imports:
                </div>
                <pre class="n-code-block p-2 rounded overflow-auto">{{ JSON.stringify(configData.options.imports, null, 2) }}</pre>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex gap-2">
                  <span class="opacity-60">styles:</span>
                  <span>{{ configData.options.styles }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="opacity-60">devtools:</span>
                  <span>{{ configData.options.devtools }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Registrations Panel (Empty State) -->
        <div
          v-else-if="activeTab === 'registrations'"
          class="flex items-center justify-center h-full"
        >
          <div class="text-center max-w-md">
            <div class="text-6xl opacity-20 mb-4">
              🚧
            </div>
            <div class="text-lg font-semibold mb-2">
              Registrations Panel
            </div>
            <div class="text-sm opacity-60">
              This panel will display components, imports, active GenUI tools, pending HITL, route URL, and health probe.
              <br><br>
              Full implementation is scheduled for Phase 4 (after GenUI/HITL implementation).
            </div>
          </div>
        </div>

        <!-- Docs Panel -->
        <div
          v-else-if="activeTab === 'docs'"
          class="space-y-4"
        >
          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              Documentation
            </h2>
            <div class="space-y-3 text-sm">
              <div>
                <h3 class="font-semibold mb-1">
                  Official CopilotKit Documentation
                </h3>
                <a
                  href="https://docs.copilotkit.ai"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                >
                  https://docs.copilotkit.ai
                </a>
              </div>
              <div>
                <h3 class="font-semibold mb-1">
                  Module Architecture
                </h3>
                <div class="opacity-60">
                  See <code>ARCHITECTURE.md</code> in the repository for detailed information about the module's design, config flow, and SSR boundary.
                </div>
              </div>
              <div>
                <h3 class="font-semibold mb-1">
                  Design Document
                </h3>
                <div class="opacity-60">
                  See <code>docs/plans/2026-10-23-nuxt-copilotkit-design.md</code> for key decisions, success criteria, and testing strategy.
                </div>
              </div>
            </div>
          </div>

          <div class="n-card-base p-4">
            <h2 class="text-lg font-semibold mb-3">
              Quick Links
            </h2>
            <div class="space-y-2">
              <a
                href="https://docs.copilotkit.ai/getting-started"
                target="_blank"
                class="block px-3 py-2 rounded hover:n-bg-hover transition"
              >
                → Getting Started
              </a>
              <a
                href="https://docs.copilotkit.ai/reference"
                target="_blank"
                class="block px-3 py-2 rounded hover:n-bg-hover transition"
              >
                → API Reference
              </a>
              <a
                href="https://docs.copilotkit.ai/guides"
                target="_blank"
                class="block px-3 py-2 rounded hover:n-bg-hover transition"
              >
                → Guides
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
