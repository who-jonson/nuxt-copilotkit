import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  // Provided by the host Nuxt install; do not bundle or declare it.
  externals: ['defu'],
  failOnWarn: false
});
