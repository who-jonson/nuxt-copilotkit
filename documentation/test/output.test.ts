// Post-build checks for the docs site. Docus prerenders with failOnError: false,
// so broken links and unprefixed URLs would otherwise pass silently.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ORIGIN = 'https://oss.whoj.dev';
const BASE = '/nuxt-copilotkit/';
const SITE = `${ORIGIN}${BASE}`;
const root = fileURLToPath(new URL('..', import.meta.url));
// The cloudflare_module preset writes static files to .output/public/{{ baseURL }}.
const outDir = join(root, '.output', 'public', 'nuxt-copilotkit');
const contentDir = join(root, 'content');

/** Lists every file below `dir`, recursively. */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** True when a path below BASE maps to a generated file; a directory alone does not count. */
function routeExists(path: string): boolean {
  const clean = decodeURIComponent(path.replace(/[?#].*$/, '')).replace(/\/$/, '');
  const candidates = clean === '' ? ['index.html'] : [clean, `${clean}.html`, `${clean}/index.html`];
  return candidates.some((candidate) => {
    const file = join(outDir, candidate);
    return existsSync(file) && statSync(file).isFile();
  });
}

/** Returns a problem for one same-site URL, or `undefined` when it is fine or points elsewhere. */
function checkUrl(raw: string): string | undefined {
  const url = raw.startsWith(`${ORIGIN}/`) ? raw.slice(ORIGIN.length) : raw;
  if (!url.startsWith('/') || url.startsWith('//')) {
    return undefined;
  }
  // The bare prefix is the home link; the Worker redirects it to BASE.
  if (url === BASE.slice(0, -1)) {
    return undefined;
  }
  if (!url.startsWith(BASE)) {
    return `unprefixed URL ${raw}`;
  }
  // Markdown alternates (`<page>.md`) are answered by the Worker, which redirects them to raw/<page>.md; they are not static files.
  if (url.replace(/[?#].*$/, '').endsWith('.md')) {
    return undefined;
  }
  return routeExists(url.slice(BASE.length)) ? undefined : `broken link ${raw}`;
}

beforeAll(() => {
  if (!existsSync(outDir)) {
    throw new Error(`Missing ${relative(root, outDir)}; run \`pnpm docs:build\` first.`);
  }
});

describe('generated output', () => {
  it('contains the required files', () => {
    // No 404.html: `nuxt build` does not prerender it. The Worker renders the 404 page (see worker.e2e.test.ts).
    const missing = ['index.html', 'llms.txt', 'llms-full.txt'].filter(file => !existsSync(join(outDir, file)));
    expect(missing).toEqual([]);
  });

  it('references the site in llms.txt', () => {
    expect(readFileSync(join(outDir, 'llms.txt'), 'utf8')).toContain(SITE);
  });

  it('has a page for every content file', () => {
    const missing = walk(contentDir)
      .filter(file => file.endsWith('.md'))
      .map(md => relative(contentDir, md)
        .replace(/\.md$/, '')
        .split(sep)
        .map(segment => segment.replace(/^\d+\./, ''))
        .join('/')
        .replace(/(?:^|\/)index$/, ''))
      .filter(route => !routeExists(route));
    expect(missing).toEqual([]);
  });

  it('prefixes and resolves every internal link', () => {
    const urlAttribute = /\s(?:href|src)=(["'])(.*?)\1/g;
    const problems = new Set<string>();

    for (const html of walk(outDir).filter(file => file.endsWith('.html'))) {
      for (const [, , url] of readFileSync(html, 'utf8').matchAll(urlAttribute)) {
        const problem = checkUrl(url);
        if (problem) {
          problems.add(`${relative(outDir, html)}: ${problem}`);
        }
      }
    }

    expect([...problems]).toEqual([]);
  });

  it('resolves every site link in llms.txt and llms-full.txt', () => {
    const markdownLink = /\]\((https:\/\/oss\.whoj\.dev\/nuxt-copilotkit\/[^)\s]*)\)/g;
    // Served only at Worker runtime, not a static file.
    const runtimeOnly = new Set(['.well-known/api-catalog']);
    const problems: string[] = [];

    for (const file of ['llms.txt', 'llms-full.txt']) {
      for (const [, url] of readFileSync(join(outDir, file), 'utf8').matchAll(markdownLink)) {
        const path = url.slice(SITE.length).replace(/[?#].*$/, '');
        if (runtimeOnly.has(path)) {
          continue;
        }
        const first = path.split('/')[0];
        if (first === '' || first === BASE.replaceAll('/', '')) {
          problems.push(`${file}: empty or repeated first segment ${url}`);
        }
        else if (path.includes('//')) {
          problems.push(`${file}: double slash ${url}`);
        }
        // Page links have no extension in llms-full.txt; routeExists also accepts route.html and route/index.html.
        else if (!routeExists(path)) {
          problems.push(`${file}: no page or file for ${url}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
