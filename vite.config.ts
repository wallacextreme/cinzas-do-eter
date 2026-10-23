import { defineConfig } from 'vite';
import path from 'path';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@core': path.resolve(root, 'src/core'),
      '@scenes': path.resolve(root, 'src/scenes'),
      '@entities': path.resolve(root, 'src/entities'),
      '@systems': path.resolve(root, 'src/systems'),
      '@battle': path.resolve(root, 'src/battle'),
      '@world': path.resolve(root, 'src/world'),
      '@ui': path.resolve(root, 'src/ui'),
      '@data': path.resolve(root, 'src/data'),
      '@audio': path.resolve(root, 'src/audio'),
      '@art': path.resolve(root, 'src/art'),
      '@save': path.resolve(root, 'src/save'),
      '@utils': path.resolve(root, 'src/utils'),
      '@config': path.resolve(root, 'src/config'),
      '@inventory': path.resolve(root, 'src/inventory'),
      '@shop': path.resolve(root, 'src/shop'),
    },
  },
  build: {
    target: 'es2023',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
    open: true,
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8' as never,
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.d.ts'],
    },
  },
});
