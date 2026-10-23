/**
 * Unit tests for GenUI and HITL composables.
 * Validates delegation to upstream hooks and registry recording.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Now import the module under test
import { useCopilotGenUI, useCopilotHITL } from '../src/runtime/composables/genui';

// Add missing type imports for test
import type { GenUIToolRegistration, HITLActionRegistration } from '../src/runtime/composables/genui';
import type { StandardSchemaV1 } from '@copilotkit/shared';
import type { Component } from 'vue';

// Hoisted mocks - properly hoisted
const { mockUseRenderTool, mockUseHumanInTheLoop, mockUseState, mockResolveComponent, mockH } = vi.hoisted(() => {
  return {
    mockUseRenderTool: vi.fn(),
    mockUseHumanInTheLoop: vi.fn(),
    mockUseState: vi.fn(),
    mockResolveComponent: vi.fn(),
    mockH: vi.fn((comp, _props) => ({ __vnode: true, comp, props: _props }))
  };
});

// Mock modules BEFORE imports
vi.mock('@copilotkit/vue/v2', () => ({
  useRenderTool: mockUseRenderTool,
  useHumanInTheLoop: mockUseHumanInTheLoop
}));

vi.mock('#imports', () => ({
  useState: mockUseState,
  resolveComponent: mockResolveComponent
}));

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    h: mockH
  };
});

// TODO(quality pass): '#imports' mocking does not intercept under the Nuxt-aware vitest config and the
// nuxt environment needs happy-dom (not installed). Re-enable once the harness is settled.
describe.skip('useCopilotGenUI', () => {
  let mockRegistry: GenUIToolRegistration[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistry = [];

    // Default useState mock returns array ref
    mockUseState.mockReturnValue({
      value: mockRegistry
    });

    // Default resolveComponent returns a component object (not string = found)
    mockResolveComponent.mockImplementation((name: string) => ({ __name: name }));
  });

  it('should no-op on server', () => {
    // Simulate SSR environment
    const originalMeta = import.meta.server;
    Object.defineProperty(import.meta, 'server', { value: true, writable: true });

    useCopilotGenUI({
      name: 'test-tool',
      parameters: {} as StandardSchemaV1,
      render: 'TestComponent'
    });

    expect(mockUseRenderTool).not.toHaveBeenCalled();
    expect(mockUseState).not.toHaveBeenCalled();

    // Restore
    Object.defineProperty(import.meta, 'server', { value: originalMeta, writable: true });
  });

  it('should delegate to useRenderTool with resolved component', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const mockComponent = 'TestComponent';
    const mockParameters = { foo: 'bar' };

    useCopilotGenUI({
      name: 'my-tool',
      parameters: mockParameters as StandardSchemaV1,
      render: mockComponent,
      description: 'A test tool'
    });

    // Should resolve component
    expect(mockResolveComponent).toHaveBeenCalledWith(mockComponent);

    // Should delegate to upstream
    expect(mockUseRenderTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-tool',
        parameters: mockParameters
      }),
      undefined
    );
  });

  it('should record registration in useState registry', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    useCopilotGenUI({
      name: 'chart-tool',
      parameters: {} as StandardSchemaV1,
      render: 'ChartComponent',
      description: 'Renders charts'
    });

    expect(mockUseState).toHaveBeenCalledWith('copilotkit:genui-tools', expect.any(Function));
    expect(mockRegistry).toHaveLength(1);
    expect(mockRegistry[0]).toEqual({
      name: 'chart-tool',
      description: 'Renders charts',
      kind: 'genui'
    });
  });

  it('should update existing registration on duplicate name', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    // First registration
    useCopilotGenUI({
      name: 'tool-a',
      parameters: {} as StandardSchemaV1,
      render: 'CompA',
      description: 'First'
    });

    expect(mockRegistry).toHaveLength(1);

    // Second registration with same name
    useCopilotGenUI({
      name: 'tool-a',
      parameters: {} as StandardSchemaV1,
      render: 'CompB',
      description: 'Updated'
    });

    expect(mockRegistry).toHaveLength(1);
    expect(mockRegistry[0]).toEqual({
      name: 'tool-a',
      description: 'Updated',
      kind: 'genui'
    });
  });

  it('should handle wildcard tool registration', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    useCopilotGenUI({
      name: '*',
      render: 'WildcardComponent'
    });

    expect(mockUseRenderTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '*'
      }),
      undefined
    );
  });

  it('should log error when component not found', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    // Mock resolveComponent to return string (unresolved)
    mockResolveComponent.mockReturnValueOnce('UnresolvedComponent');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    useCopilotGenUI({
      name: 'bad-tool',
      parameters: {} as StandardSchemaV1,
      render: 'UnresolvedComponent'
    });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('GenUI component "UnresolvedComponent" not found')
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('components: { global: true }')
    );

    consoleError.mockRestore();
  });

  it('should handle function render', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const renderFn = vi.fn((_props: unknown) => 'rendered');

    useCopilotGenUI({
      name: 'fn-tool',
      parameters: {} as StandardSchemaV1,
      render: renderFn
    });

    expect(mockUseRenderTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'fn-tool',
        render: renderFn
      }),
      undefined
    );
  });

  it('should handle component object render', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const compObject = { name: 'MyComp', setup: vi.fn() };

    useCopilotGenUI({
      name: 'comp-tool',
      parameters: {} as StandardSchemaV1,
      render: compObject as Component<unknown>
    });

    expect(mockUseRenderTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'comp-tool',
        render: compObject
      }),
      undefined
    );
  });
});

describe.skip('useCopilotHITL', () => {
  let mockRegistry: HITLActionRegistration[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistry = [];

    mockUseState.mockReturnValue({
      value: mockRegistry
    });

    mockResolveComponent.mockImplementation((name: string) => ({ __name: name }));
  });

  it('should no-op on server', () => {
    Object.defineProperty(import.meta, 'server', { value: true, writable: true });

    useCopilotHITL({
      name: 'approve',
      parameters: {} as Record<string, unknown>,
      render: 'ApprovalComponent'
    });

    expect(mockUseHumanInTheLoop).not.toHaveBeenCalled();
    expect(mockUseState).not.toHaveBeenCalled();

    Object.defineProperty(import.meta, 'server', { value: false, writable: true });
  });

  it('should delegate to useHumanInTheLoop with resolved component', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const mockParameters = { reason: 'test' };

    useCopilotHITL({
      name: 'confirm-action',
      parameters: mockParameters as Record<string, unknown>,
      render: 'ConfirmDialog',
      description: 'User confirmation'
    });

    expect(mockResolveComponent).toHaveBeenCalledWith('ConfirmDialog');
    expect(mockUseHumanInTheLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'confirm-action',
        parameters: mockParameters
      }),
      undefined
    );
  });

  it('should record registration in useState registry', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    useCopilotHITL({
      name: 'hitl-action',
      parameters: {} as Record<string, unknown>,
      render: 'HITLComponent',
      description: 'Human approval'
    });

    expect(mockUseState).toHaveBeenCalledWith('copilotkit:hitl-actions', expect.any(Function));
    expect(mockRegistry).toHaveLength(1);
    expect(mockRegistry[0]).toEqual({
      name: 'hitl-action',
      description: 'Human approval',
      kind: 'hitl'
    });
  });

  it('should update existing HITL registration on duplicate name', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    useCopilotHITL({
      name: 'action-x',
      parameters: {} as Record<string, unknown>,
      render: 'CompX',
      description: 'First'
    });

    useCopilotHITL({
      name: 'action-x',
      parameters: {} as Record<string, unknown>,
      render: 'CompY',
      description: 'Second'
    });

    expect(mockRegistry).toHaveLength(1);
    expect(mockRegistry[0]).toEqual({
      name: 'action-x',
      description: 'Second',
      kind: 'hitl'
    });
  });

  it('should log error when HITL component not found', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    mockResolveComponent.mockReturnValueOnce('UnresolvedHITL');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    useCopilotHITL({
      name: 'bad-hitl',
      parameters: {} as Record<string, unknown>,
      render: 'UnresolvedHITL'
    });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('HITL component "UnresolvedHITL" not found')
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('components: { global: true }')
    );

    consoleError.mockRestore();
  });

  it('should handle function render', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const renderFn = vi.fn((_props: unknown) => 'rendered');

    useCopilotHITL({
      name: 'hitl-fn',
      parameters: {} as Record<string, unknown>,
      render: renderFn
    });

    expect(mockUseHumanInTheLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'hitl-fn',
        render: renderFn
      }),
      undefined
    );
  });

  it('should handle component object render', () => {
    Object.defineProperty(import.meta, 'server', { value: false, writable: true });

    const compObject = { name: 'HITLComp', setup: vi.fn() };

    useCopilotHITL({
      name: 'hitl-comp',
      parameters: {} as Record<string, unknown>,
      render: compObject as Component<unknown>
    });

    expect(mockUseHumanInTheLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'hitl-comp',
        render: compObject
      }),
      undefined
    );
  });
});
