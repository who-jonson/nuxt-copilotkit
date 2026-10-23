// Playground Nuxt app used to develop the nuxt-copilotkit module locally.
import { resolve } from 'node:path';
import { defineNuxtModule } from '@nuxt/kit';
import { startSubprocess } from '@nuxt/devtools-kit';

export default defineNuxtConfig({
  modules: [
    /**
     * The module under development.
     */
    '../src/module',
    /**
     * Start a sub Nuxt Server for developing the devtools client.
     *
     * The terminal output can be found in the Terminals tab of the devtools.
     */
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev) {
          return;
        }

        const _process = startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3300'],
            cwd: resolve(__dirname, '../client')
          },
          {
            id: 'nuxt-copilotkit:client',
            name: 'Nuxt CopilotKit Client Dev'
          }
        );
      }
    })
  ],

  devtools: {
    enabled: true
  },

  compatibilityDate: 'latest',

  copilotkit: {
    // Runtime endpoint points to our built-in route handler
    runtime: {
      url: '/api/_copilotkit'
    },
    provider: {
      // Enable debug logging in development
      debug: true
    },
    // Components and imports are auto-registered by default
    components: {
      global: true
    },
    imports: {}
  }
});
