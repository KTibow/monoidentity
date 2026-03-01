import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreWorkspaces: ['.'],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].map((x) => x[0]).join('\n'),
  },
  tags: ['-knipexternal'],
  workspaces: {
    'packages/base36-esm': {
      project: ['src/**/*.ts'],
      ignoreBinaries: ['tsc'],
    },
    'packages/firebase-functions': {
      entry: ['rolldown.config.ts'],
      ignoreBinaries: ['firebase'],
    },
    'packages/hub': {
      entry: ['src/**/*.astro'],
      project: ['src/**/*.{astro,css,js,ts}'],
      ignoreDependencies: ['@astrojs/check'],
    },
    'packages/monoidentity-sync': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
      ignoreUnresolved: ['\\$env/static/private'],
      ignoreBinaries: ['tsc'],
      ignoreDependencies: ['@types/wicg-file-system-access'],
    },
    'packages/monoidentity-verification': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
      ignoreUnresolved: ['\\$env/static/private'],
      ignoreBinaries: ['tsc'],
    },
    'packages/sdk': {
      entry: ['src/lib/+index.ts', 'src/lib/+receive-callback.ts'],
      project: ['src/**/*.ts'],
    },
  },
};

export default config;
