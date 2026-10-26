---
seo:
  title: nuxt-copilotkit
  description: AI copilots, generative UI and agents for Nuxt — SSR-safe, zero-boilerplate, powered by CopilotKit.
---

::u-page-hero
#title
nuxt-copilotkit

#description
AI copilots, generative UI and agents for Nuxt — SSR-safe, zero-boilerplate, powered by [CopilotKit](https://copilotkit.ai).

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/who-jonson/nuxt-copilotkit
  target: _blank
  variant: outline
  ---
  View on GitHub
  :::
::

::u-page-section
#title
What the module does

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Built-in runtime route

  #description
  A Nitro handler at `/api/_copilotkit`, created lazily on the first request.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  SSR-safe

  #description
  The `<CopilotKit>` wrapper renders its slot on the server; browser-only code never runs during SSR.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-puzzle
  ---
  #title
  Auto-registered

  #description
  Every upstream `@copilotkit/vue` component and composable, auto-imported and available from `#copilotkit`.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-palette
  ---
  #title
  Generative UI and human in the loop

  #description
  `useCopilotGenUI` and `useCopilotHITL`, with components resolvable by name.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bot
  ---
  #title
  Bring any agent

  #description
  Register remote AG-UI agents (LangGraph, Google ADK, Claude Agent SDK, VoltAgent, A2A bridges) by URL.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-lock
  ---
  #title
  Secrets stay server-side

  #description
  API keys and agent headers live in private `runtimeConfig`.
  :::
::
