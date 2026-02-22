// @ts-check
import { defineConfig } from 'astro/config';
import { functionsMixins } from 'vite-plugin-functions-mixins';

// https://astro.build/config
export default defineConfig({
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  vite: {
    // @ts-expect-error vite hates vite
    plugins: [functionsMixins()],
  },
});
