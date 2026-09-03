/**
 * Bundles the design system into dist/ as a single ESM module.
 *
 * React and React DOM stay external — the consumer supplies them. The output
 * is what the Claude Design sync converter turns into `_ds_bundle.js`, so
 * every preview it renders is these exact compiled components.
 */
import { build } from 'esbuild'

const result = await build({
  entryPoints: ['design-system/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'next', 'next/link', 'next/navigation'],
  logLevel: 'info',
  logOverride: {
    // 'use client' is meaningful to Next, meaningless to a plain bundle.
    'ignored-directive': 'silent',
  },
  metafile: true,
})

const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0
console.log(`[design-system] dist/index.mjs — ${(bytes / 1024).toFixed(1)} kB`)
