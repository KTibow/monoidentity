import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'receive-callback': 'src/receive-callback.ts',
  },
});
