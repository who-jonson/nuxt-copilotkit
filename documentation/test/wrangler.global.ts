// Vitest global setup for the `worker` project: serves the built Worker with `wrangler dev`
// unless DOCS_URL points at a site that is already running.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8787;
const READY_TIMEOUT_MS = 60_000;

/** Starts `wrangler --cwd .output dev` and resolves once the base URL answers; returns the teardown. */
export default async function setup(): Promise<(() => void) | undefined> {
  if (process.env.DOCS_URL) {
    return undefined;
  }

  const root = fileURLToPath(new URL('..', import.meta.url));
  const child = spawn(join(root, 'node_modules', '.bin', 'wrangler'), ['--cwd', '.output', 'dev', '--port', String(PORT)], {
    cwd: root,
    // miniflare would otherwise fetch workers.cloudflare.com/cf.json for request.cf; the tests need no geo data.
    env: { ...process.env, CLOUDFLARE_CF_FETCH_ENABLED: 'false' },
    stdio: ['ignore', 'inherit', 'inherit']
  });
  const ready = `http://localhost:${PORT}/nuxt-copilotkit/`;
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`wrangler dev exited with code ${child.exitCode}; run \`pnpm docs:build\` first.`);
    }
    try {
      await fetch(ready);
      return () => {
        child.kill();
      };
    }
    catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  child.kill();
  throw new Error(`wrangler dev did not answer on ${ready} within ${READY_TIMEOUT_MS / 1000} s`);
}
