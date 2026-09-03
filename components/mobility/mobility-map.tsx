'use client'

import { Map as MlMap, NavigationControl, ScaleControl, setWorkerUrl } from 'maplibre-gl'
import type { MapLibreMap, MapOptions } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import {
  LONDON_CENTRE,
  accessibilityPoints,
  chargingSites,
  congestionPoints,
  pickupZones,
  safetyIncidents,
  zones,
} from '@/lib/data/mobility-geo'
import type { LayerId } from '@/lib/data/mobility-geo'

/**
 * A self-contained style: a flat canvas plus our own GeoJSON. No tile server,
 * no API key, no network at render time — the zones are the subject, and a
 * basemap would only be decoration here. Swap `background` for a raster or
 * vector source when a licensed basemap is available.
 */
const STYLE: MapOptions['style'] = {
  version: 8,
  sources: {},
  layers: [{ id: 'canvas', type: 'background', paint: { 'background-color': '#eef1f6' } }],
}

/**
 * MapLibre v6 spawns its worker as a separate ES module that Next's bundler
 * does not emit — without this the worker 404s, no source ever finishes
 * loading, and the map renders its background and nothing else. The file is
 * copied into public/maplibre by scripts/copy-maplibre-worker.mjs.
 */
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

const ZONE_FILL: Record<string, string> = {
  approved: '#0f9d83',
  pilot: '#06b6d4',
  restricted: '#dc2626',
}

type Props = {
  visible: Record<LayerId, boolean>
  onSelect: (feature: { title: string; detail: string } | null) => void
}

export function MobilityMap({ visible, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const ready = useRef(false)

  useEffect(() => {
    if (!container.current || map.current) return

    const instance = new MlMap({
      container: container.current,
      style: STYLE,
      center: LONDON_CENTRE,
      zoom: 10.6,
      attributionControl: false,
      // Honour a reduced-motion preference for every camera movement.
      fadeDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
    })
    map.current = instance

    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    instance.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')

    instance.on('error', (event) => {
      // Style and source errors are otherwise silent; a blank map is a bug.
      console.error('[MobilitySim] map error:', event.error?.message ?? event)
    })

    instance.on('load', () => {
      instance.addSource('zones', { type: 'geojson', data: zones })
      instance.addSource('pickup', { type: 'geojson', data: pickupZones })
      instance.addSource('charging', { type: 'geojson', data: chargingSites })
      instance.addSource('congestion', { type: 'geojson', data: congestionPoints })
      instance.addSource('accessibility', { type: 'geojson', data: accessibilityPoints })
      instance.addSource('safety', { type: 'geojson', data: safetyIncidents })

      // Zones: one fill + outline pair per kind so each toggles independently.
      for (const kind of ['approved', 'pilot', 'restricted'] as const) {
        instance.addLayer({
          id: `${kind}-fill`,
          type: 'fill',
          source: 'zones',
          filter: ['==', ['get', 'kind'], kind],
          paint: { 'fill-color': ZONE_FILL[kind]!, 'fill-opacity': 0.16 },
        })
        instance.addLayer({
          id: `${kind}-line`,
          type: 'line',
          source: 'zones',
          filter: ['==', ['get', 'kind'], kind],
          paint: {
            'line-color': ZONE_FILL[kind]!,
            'line-width': 1.5,
            // Dash only the restricted outline. Every dash value must be > 0,
            // so an "unbroken" line omits the property rather than passing [1, 0].
            ...(kind === 'restricted' ? { 'line-dasharray': [2, 1.5] } : {}),
          },
        })
      }

      instance.addLayer({
        id: 'congestion-circles',
        type: 'circle',
        source: 'congestion',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'level'], 60, 10, 95, 26],
          'circle-color': '#d97706',
          'circle-opacity': 0.28,
          'circle-stroke-color': '#d97706',
          'circle-stroke-width': 1,
        },
      })

      instance.addLayer({
        id: 'accessibility-circles',
        type: 'circle',
        source: 'accessibility',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'coverage'], 40, 12, 80, 24],
          'circle-color': '#1d4ed8',
          'circle-opacity': 0.18,
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 1,
        },
      })

      instance.addLayer({
        id: 'charging-points',
        type: 'circle',
        source: 'charging',
        paint: {
          'circle-radius': 6,
          'circle-color': '#0f9d83',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      instance.addLayer({
        id: 'pickup-points',
        type: 'circle',
        source: 'pickup',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'capacity'], 18, 4, 42, 9],
          'circle-color': '#2563eb',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      instance.addLayer({
        id: 'safety-points',
        type: 'circle',
        source: 'safety',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'severity'],
            'high',
            9,
            'medium',
            7,
            5,
          ],
          'circle-color': '#dc2626',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      ready.current = true
      applyVisibility(instance, visible)
    })

    // One click handler for every interactive layer.
    const interactive = [
      'approved-fill',
      'pilot-fill',
      'restricted-fill',
      'pickup-points',
      'charging-points',
      'congestion-circles',
      'accessibility-circles',
      'safety-points',
    ]

    instance.on('click', (event) => {
      const hits = instance.queryRenderedFeatures(event.point, { layers: interactive })
      const hit = hits[0]
      if (!hit) {
        onSelect(null)
        return
      }
      const props = hit.properties ?? {}
      const title = String(props.name ?? 'Feature')
      const detail =
        props.note !== undefined
          ? String(props.note)
          : props.capacity !== undefined
            ? `Kerbside capacity: ${props.capacity} vehicles/hour`
            : props.bays !== undefined
              ? `${props.bays} charging bays · ${props.power}`
              : props.level !== undefined
                ? `Peak congestion index: ${props.level}/100`
                : props.coverage !== undefined
                  ? `Accessible-vehicle coverage: ${props.coverage}%`
                  : props.severity !== undefined
                    ? `Severity: ${props.severity} · reported ${props.at}`
                    : ''
      onSelect({ title, detail })
    })

    instance.on('mousemove', (event) => {
      const hits = instance.queryRenderedFeatures(event.point, { layers: interactive })
      instance.getCanvas().style.cursor = hits.length ? 'pointer' : ''
    })

    return () => {
      instance.remove()
      map.current = null
      ready.current = false
    }
    // The map is created once; layer visibility is driven by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (map.current && ready.current) applyVisibility(map.current, visible)
  }, [visible])

  return (
    <div
      ref={container}
      className="h-full w-full rounded-lg"
      role="application"
      aria-label="Map of Greater London showing autonomous-vehicle zones, pickup points, charging depots, congestion, accessibility coverage and safety incidents. The same data is listed in the layer panel and feature details beside the map."
    />
  )
}

const LAYER_MAP: Record<LayerId, string[]> = {
  'approved-zones': ['approved-fill', 'approved-line'],
  'pilot-zones': ['pilot-fill', 'pilot-line'],
  'restricted-zones': ['restricted-fill', 'restricted-line'],
  'pickup-zones': ['pickup-points'],
  charging: ['charging-points'],
  congestion: ['congestion-circles'],
  accessibility: ['accessibility-circles'],
  safety: ['safety-points'],
}

function applyVisibility(instance: MapLibreMap, visible: Record<LayerId, boolean>) {
  for (const [layerId, mapLayers] of Object.entries(LAYER_MAP) as [LayerId, string[]][]) {
    for (const id of mapLayers) {
      if (!instance.getLayer(id)) continue
      instance.setLayoutProperty(id, 'visibility', visible[layerId] ? 'visible' : 'none')
    }
  }
}
