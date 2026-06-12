/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { zigflowExec } from './vite-plugin-zigflow-exec';

export default defineConfig({
  plugins: [react(), zigflowExec()],
  server: {
    host: '127.0.0.1',
    port: 4202,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      // The SDK (and transitively @xyflow/react) imports CSS at module level;
      // inline them so vite transforms those imports instead of Node choking.
      deps: {
        inline: ['@workflowbuilder/sdk', '@xyflow/react', '@synergycodes/overflow-ui'],
      },
    },
  },
});
