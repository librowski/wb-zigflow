/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
