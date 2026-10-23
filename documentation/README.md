# nuxt-copilotkit Documentation

This directory is reserved as the root of the future documentation site, built with [Docus](https://docus.dev) on [@nuxt/content](https://content.nuxt.com). The published markdown content will live in `documentation/content/`.

**Current status:** Documentation site build is deferred post-v1 (decision D10 from the implementation plan).

## Documentation Structure (Planned)

- **`documentation/content/`** — Published user-facing documentation
- **`docs/plans/`** — Internal design and planning documents (never published)

These are fully separate trees: internal planning docs remain in `docs/` and are never exposed in the published site.

## Diagramming

All diagrams use [Mermaid](https://mermaid.js.org) syntax.

## Reference Materials

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Module layering, configuration flow, SSR boundary, and `ModuleOptions` reference
- [Implementation Plan](../docs/plans/2026-10-23-nuxt-copilotkit-implementation-plan.md) — Design decisions, success criteria, and phased rollout

---

*This stub satisfies gate G5 from the implementation plan.*
