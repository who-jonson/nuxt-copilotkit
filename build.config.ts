// Build overrides for `nuxt-module-build`.
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  hooks: {
    // INTERIM: mkdist needs `vue-tsc` to emit declarations once a runtime `.vue` file exists
    // (CopilotKit.vue), and the project typechecks with @golar/vue instead. Skip runtime
    // declaration emit until a deliberate declaration strategy is chosen.
    'mkdist:entry:options': function (_ctx, _entry, options) {
      options.declaration = false;
    }
  }
});
