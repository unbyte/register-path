import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  platform: 'node',
  target: 'esnext',
  dts: true,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
})
