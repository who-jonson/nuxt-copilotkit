// Minimal Nuxt fixture mirroring the nuxt-copilotkit module's real consumer shape.
import NuxtCopilotKit from '../../../src/module';

export default defineNuxtConfig({
  modules: [
    NuxtCopilotKit
  ],

  compatibilityDate: 'latest',

  copilotkit: {}
});
