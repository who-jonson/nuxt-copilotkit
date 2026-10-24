/**
 * Upstream drift guard: verifies that composables re-exported in the barrel
 * (src/runtime/app/copilotkit/index.ts) actually exist in the installed @copilotkit/vue/v2.
 * Excludes legacy v1 exports (useCopilotAction, useCopilotReadable) per design decision D1.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('upstream-drift guard', () => {
  it('barrel re-exports match runtime exports from @copilotkit/vue/v2', async () => {
    // Read the barrel source
    const barrelPath = resolve(__dirname, '../src/runtime/app/copilotkit/index.ts');
    const barrelSource = readFileSync(barrelPath, 'utf-8');

    // Extract composable names from the upstream re-export block
    // Match: `export { ... } from '@copilotkit/vue/v2'`
    const upstreamBlockMatch = barrelSource.match(
      /export\s*\{([^}]+)\}\s*from\s*['"]@copilotkit\/vue\/v2['"]/g
    );

    expect(upstreamBlockMatch).toBeTruthy();
    expect(upstreamBlockMatch?.length).toBeGreaterThan(0);

    // Extract all named exports from the matched blocks
    const exportedNames: string[] = [];
    for (const block of upstreamBlockMatch || []) {
      const namesMatch = block.match(/export\s*\{([^}]+)\}/);
      if (namesMatch) {
        const names = (namesMatch[1] ?? '')
          .split(',')
          .map(n => n.trim())
          .filter(n => n && !n.startsWith('//') && !n.startsWith('type '))
          .map(n => n.replace(/\s+as\s+(?:\S.*)?$/, '').trim());
        exportedNames.push(...names);
      }
    }

    // Filter to composables only (starts with 'use')
    const barrelComposables = exportedNames.filter(name => name.startsWith('use'));

    expect(barrelComposables.length).toBeGreaterThan(0);

    // Get runtime exports from the installed package
    const runtimeExports = await import('@copilotkit/vue/v2');
    const runtimeComposables = Object.keys(runtimeExports).filter(k =>
      k.startsWith('use')
    );

    // Verify each barrel composable exists in runtime
    for (const composable of barrelComposables) {
      expect(
        runtimeComposables,
        `barrel re-exports ${composable} but it does not exist in @copilotkit/vue/v2 runtime exports`
      ).toContain(composable);
    }

    // Log for debugging
    console.log(
      `✓ Verified ${barrelComposables.length} composables against ${runtimeComposables.length} runtime exports`
    );
    console.log(`  Barrel: ${barrelComposables.sort().join(', ')}`);
  });

  it('excludes legacy v1 exports per design decision D1', async () => {
    // Read the barrel source
    const barrelPath = resolve(__dirname, '../src/runtime/app/copilotkit/index.ts');
    const barrelSource = readFileSync(barrelPath, 'utf-8');

    // Verify legacy v1 composables are NOT present in export statements
    const legacyExports = ['useCopilotAction', 'useCopilotReadable'];

    // Extract all export statements (not comments)
    const exportBlocks = barrelSource.match(/^export\s+(?:type\s+)?\{[^}]+\}/gm) || [];
    const allExports = exportBlocks.join('\n');

    for (const legacy of legacyExports) {
      expect(
        allExports,
        `barrel must NOT re-export legacy v1 ${legacy} (design decision D1)`
      ).not.toMatch(new RegExp(`\b${legacy}\b`));
    }

    console.log(`✓ Confirmed exclusion of legacy v1 exports: ${legacyExports.join(', ')}`);
  });
});
