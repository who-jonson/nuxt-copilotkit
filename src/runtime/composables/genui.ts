/**
 * GenUI and HITL composables for nuxt-copilotkit.
 * Wraps @copilotkit/vue's useRenderTool and useHumanInTheLoop with Nuxt-aware
 * SSR guards, component resolution, and devtools registry recording.
 */

import { useState, resolveComponent } from '#imports';
import { useRenderTool, useHumanInTheLoop } from '@copilotkit/vue/v2';
import type { WatchSource, Component, VNodeChild } from 'vue';
import type { StandardSchemaV1 } from '@copilotkit/shared';
import type {
  RenderToolProps,
  VueHumanInTheLoop
} from '@copilotkit/vue/v2';
import { h } from 'vue';

/**
 * Serializable metadata for a registered GenUI tool (devtools consumption).
 */
export interface GenUIToolRegistration {
  name: string;
  description?: string;
  kind: 'genui';
}

/**
 * Serializable metadata for a registered HITL action (devtools consumption).
 */
export interface HITLActionRegistration {
  name: string;
  description?: string;
  kind: 'hitl';
}

/**
 * Configuration for a GenUI tool registration (wildcard variant).
 */
export interface GenUIConfigWildcard {
  name: '*';
  render: ((props: unknown) => VNodeChild) | Component<unknown> | string;
  agentId?: string;
  description?: string;
}

/**
 * Configuration for a GenUI tool registration (typed variant).
 */
export interface GenUIConfigTyped<S extends StandardSchemaV1> {
  name: string;
  parameters: S;
  render: ((props: RenderToolProps<S>) => VNodeChild) | Component<RenderToolProps<S>> | string;
  agentId?: string;
  description?: string;
}

/**
 * Registers a GenUI tool that renders custom UI during tool execution.
 *
 * Wraps `@copilotkit/vue`'s `useRenderTool` with SSR safety, component resolution,
 * and devtools registry recording.
 *
 * @param config - Tool configuration with name, parameters, and render component/function
 * @param deps - Optional reactive dependencies to re-register on change
 *
 * @example
 * ```ts
 * useCopilotGenUI({
 *   name: 'visualize',
 *   parameters: z.object({ data: z.array(z.number()) }),
 *   render: ChartComponent,
 * })
 * ```
 */
export function useCopilotGenUI(
  config: GenUIConfigWildcard,
  deps?: WatchSource<unknown>[]
): void;
export function useCopilotGenUI<S extends StandardSchemaV1>(
  config: GenUIConfigTyped<S>,
  deps?: WatchSource<unknown>[]
): void;
export function useCopilotGenUI(
  config: GenUIConfigWildcard | GenUIConfigTyped<StandardSchemaV1>,
  deps?: WatchSource<unknown>[]
): void {
  // SSR no-op per §7.2
  if (import.meta.server) return;

  // Resolve component if string name provided
  const renderValue = config.render;
  let resolvedRender: ((props: unknown) => VNodeChild) | Component<unknown>;

  if (typeof renderValue === 'string') {
    const resolved = resolveComponent(renderValue);

    // Check if component resolution failed (returns string when not found)
    if (typeof resolved === 'string') {
      // Explicit dev error per §7.3
      console.error(
        `[nuxt-copilotkit] GenUI component "${renderValue}" not found. `
        + `Ensure the component is globally registered with \`components: { global: true }\` `
        + `or imported locally.`
      );
      return;
    }

    // Wrap component in render function
    resolvedRender = (props: unknown) => h(resolved as Component, props);
  }
  else if (typeof renderValue === 'function') {
    resolvedRender = renderValue;
  }
  else {
    // It's already a Component
    resolvedRender = renderValue;
  }

  // Record registration in devtools registry
  const registry = useState<GenUIToolRegistration[]>('copilotkit:genui-tools', () => []);
  const existing = registry.value.findIndex(r => r.name === config.name);
  const metadata: GenUIToolRegistration = {
    name: config.name,
    description: config.description,
    kind: 'genui'
  };

  if (existing >= 0) {
    registry.value[existing] = metadata;
  }
  else {
    registry.value.push(metadata);
  }

  // Delegate to upstream useRenderTool
  if (config.name === '*') {
    useRenderTool(
      {
        name: config.name,
        render: resolvedRender,
        agentId: config.agentId
      },
      deps
    );
  }
  else {
    const typedConfig = config as GenUIConfigTyped<StandardSchemaV1>;
    useRenderTool(
      {
        name: typedConfig.name,
        parameters: typedConfig.parameters,
        render: resolvedRender,
        agentId: typedConfig.agentId
      },
      deps
    );
  }
}

/**
 * Registers a Human-In-The-Loop action that pauses execution until user responds.
 *
 * Wraps `@copilotkit/vue`'s `useHumanInTheLoop` with SSR safety, component resolution,
 * and devtools registry recording.
 *
 * @param tool - HITL tool configuration with name, parameters, and render component
 * @param deps - Optional reactive dependencies to re-register on change
 *
 * @example
 * ```ts
 * useCopilotHITL({
 *   name: 'approveAction',
 *   parameters: z.object({ reason: z.string() }),
 *   render: ApprovalCard,
 * })
 * ```
 */
export function useCopilotHITL<T extends Record<string, unknown>>(
  tool: Omit<VueHumanInTheLoop<T>, 'render'> & {
    render: VueHumanInTheLoop<T>['render'] | string;
    description?: string;
  },
  deps?: WatchSource<unknown>[]
): void {
  // SSR no-op per §7.2
  if (import.meta.server) return;

  // Resolve component if string name provided
  const renderValue = tool.render;
  let resolvedRender: VueHumanInTheLoop<T>['render'];

  if (typeof renderValue === 'string') {
    const resolved = resolveComponent(renderValue);

    // Check if component resolution failed
    if (typeof resolved === 'string') {
      // Explicit dev error per §7.3
      console.error(
        `[nuxt-copilotkit] HITL component "${renderValue}" not found. `
        + `Ensure the component is globally registered with \`components: { global: true }\` `
        + `or imported locally.`
      );
      return;
    }

    // Wrap component in render function
    resolvedRender = (props: unknown) => h(resolved as Component, props);
  }
  else if (typeof renderValue === 'function') {
    resolvedRender = renderValue;
  }
  else {
    // It's already a Component
    resolvedRender = renderValue;
  }

  // Record registration in devtools registry
  const registry = useState<HITLActionRegistration[]>('copilotkit:hitl-actions', () => []);
  const existing = registry.value.findIndex(r => r.name === tool.name);
  const metadata: HITLActionRegistration = {
    name: tool.name,
    description: tool.description,
    kind: 'hitl'
  };

  if (existing >= 0) {
    registry.value[existing] = metadata;
  }
  else {
    registry.value.push(metadata);
  }

  // Delegate to upstream useHumanInTheLoop
  const upstreamTool: VueHumanInTheLoop<T> = {
    ...tool,
    render: resolvedRender
  };

  useHumanInTheLoop(upstreamTool, deps);
}
