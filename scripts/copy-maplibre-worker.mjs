/**
 * MapLibre v6 spawns its GeoJSON/tile worker as a separate ES module. Next's
 * bundler does not emit that asset, so the worker 404s and every source stays
 * unloaded — the map paints its background and nothing else.
 *
 * Copying the worker (and the shared chunk it imports) into public/ lets us
 * point MapLibre at a URL we control via setWorkerUrl(). Runs before dev and
 * build so a fresh clone works without a manual step.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'))
const target = join(process.cwd(), 'public', 'maplibre')

// The worker imports the shared chunk by relative path, so both must travel.
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

await mkdir(target, { recursive: true })
for (const file of FILES) {
  await copyFile(join(dist, file), join(target, file))
}

console.log(`[maplibre] copied ${FILES.length} worker files to public/maplibre`)
