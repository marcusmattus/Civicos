/**
 * Illustrative Greater London geography for MobilitySim.
 *
 * Hand-drawn approximations, not official boundaries — enough to reason about
 * zone policy, not to site anything. Replace with the authoritative TfL
 * boundary files when the sandbox moves beyond demonstration.
 */
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson'

export const LONDON_CENTRE: [number, number] = [-0.1005, 51.5115]

type ZoneKind = 'approved' | 'pilot' | 'restricted'

function polygon(
  id: string,
  name: string,
  kind: ZoneKind,
  note: string,
  ring: [number, number][],
): Feature<Polygon, { id: string; name: string; kind: ZoneKind; note: string }> {
  return {
    type: 'Feature',
    id,
    properties: { id, name, kind, note },
    geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]!]] },
  }
}

function point<P extends Record<string, unknown>>(
  id: string,
  coordinates: [number, number],
  properties: P,
): Feature<Point, P & { id: string }> {
  return {
    type: 'Feature',
    id,
    properties: { ...properties, id },
    geometry: { type: 'Point', coordinates },
  }
}

/* ----------------------------------------------------------------- Zones */

export const zones: FeatureCollection<
  Polygon,
  { id: string; name: string; kind: ZoneKind; note: string }
> = {
  type: 'FeatureCollection',
  features: [
    polygon(
      'zone-central',
      'Central approved zone',
      'approved',
      'Full autonomous licence, 24-hour operation permitted.',
      [
        [-0.1585, 51.5245],
        [-0.0715, 51.5285],
        [-0.0605, 51.5065],
        [-0.1195, 51.4945],
        [-0.1655, 51.5065],
      ],
    ),
    polygon(
      'zone-docklands',
      'Docklands pilot',
      'pilot',
      'Pilot licence to 2028, capped at 400 vehicles.',
      [
        [-0.0405, 51.5115],
        [-0.0075, 51.5135],
        [-0.0035, 51.4975],
        [-0.0385, 51.4955],
      ],
    ),
    polygon(
      'zone-stratford',
      'Stratford pilot',
      'pilot',
      'Pilot licence with mandatory accessible-vehicle share.',
      [
        [-0.0235, 51.5495],
        [0.0125, 51.5495],
        [0.0125, 51.5335],
        [-0.0235, 51.5345],
      ],
    ),
    polygon(
      'zone-westminster',
      'Westminster restricted',
      'restricted',
      'No autonomous operation: heritage streets and protest routes.',
      [
        [-0.1395, 51.5035],
        [-0.1155, 51.5045],
        [-0.1165, 51.4935],
        [-0.1405, 51.4945],
      ],
    ),
    polygon(
      'zone-school-camden',
      'Camden school restriction',
      'restricted',
      'No autonomous pickup 08:00–09:30 and 15:00–16:30.',
      [
        [-0.1495, 51.5425],
        [-0.1275, 51.5435],
        [-0.1285, 51.5345],
        [-0.1495, 51.5335],
      ],
    ),
  ],
}

/* -------------------------------------------------------------- Pickups */

export const pickupZones: FeatureCollection<Point, { id: string; name: string; capacity: number }> =
  {
    type: 'FeatureCollection',
    features: [
      point('pu-kings-cross', [-0.124, 51.5308], { name: "King's Cross", capacity: 42 }),
      point('pu-waterloo', [-0.1133, 51.5031], { name: 'Waterloo', capacity: 38 }),
      point('pu-liverpool-st', [-0.0817, 51.5178], { name: 'Liverpool Street', capacity: 34 }),
      point('pu-paddington', [-0.1759, 51.5154], { name: 'Paddington', capacity: 30 }),
      point('pu-canary-wharf', [-0.0235, 51.5054], { name: 'Canary Wharf', capacity: 28 }),
      point('pu-victoria', [-0.1448, 51.4952], { name: 'Victoria', capacity: 26 }),
      point('pu-shoreditch', [-0.0778, 51.5265], { name: 'Shoreditch High Street', capacity: 18 }),
      point('pu-stratford', [-0.0042, 51.5416], { name: 'Stratford', capacity: 24 }),
    ],
  }

/* ------------------------------------------------------------- Charging */

export const chargingSites: FeatureCollection<
  Point,
  { id: string; name: string; bays: number; power: string }
> = {
  type: 'FeatureCollection',
  features: [
    point('ch-city', [-0.0912, 51.5155], { name: 'City depot', bays: 64, power: '150 kW' }),
    point('ch-southwark', [-0.094, 51.503], { name: 'Southwark depot', bays: 48, power: '150 kW' }),
    point('ch-camden', [-0.1426, 51.5392], { name: 'Camden depot', bays: 36, power: '100 kW' }),
    point('ch-wharf', [-0.0195, 51.4995], { name: 'Wharf depot', bays: 52, power: '350 kW' }),
    point('ch-hackney', [-0.0555, 51.5445], { name: 'Hackney depot', bays: 30, power: '100 kW' }),
    point('ch-kensington', [-0.1875, 51.4995], { name: 'Kensington depot', bays: 26, power: '100 kW' }),
  ],
}

/* ----------------------------------------------------------- Congestion */

export const congestionPoints: FeatureCollection<
  Point,
  { id: string; name: string; level: number }
> = {
  type: 'FeatureCollection',
  features: [
    point('cg-oxford-circus', [-0.1417, 51.5154], { name: 'Oxford Circus', level: 92 }),
    point('cg-bank', [-0.0886, 51.5133], { name: 'Bank junction', level: 88 }),
    point('cg-elephant', [-0.0997, 51.4946], { name: 'Elephant & Castle', level: 76 }),
    point('cg-euston', [-0.1335, 51.5282], { name: 'Euston Road', level: 84 }),
    point('cg-aldgate', [-0.0755, 51.5143], { name: 'Aldgate', level: 68 }),
    point('cg-vauxhall', [-0.1225, 51.4861], { name: 'Vauxhall Cross', level: 71 }),
    point('cg-tower', [-0.0759, 51.5055], { name: 'Tower Hill', level: 63 }),
  ],
}

/* -------------------------------------------------------- Accessibility */

export const accessibilityPoints: FeatureCollection<
  Point,
  { id: string; name: string; coverage: number }
> = {
  type: 'FeatureCollection',
  features: [
    point('ac-central', [-0.1105, 51.5165], { name: 'Central core', coverage: 78 }),
    point('ac-north', [-0.1215, 51.5395], { name: 'Camden & Islington', coverage: 54 }),
    point('ac-east', [-0.0345, 51.5265], { name: 'Tower Hamlets', coverage: 47 }),
    point('ac-south', [-0.0995, 51.4805], { name: 'Southwark & Lambeth', coverage: 41 }),
    point('ac-west', [-0.1955, 51.5085], { name: 'Kensington & Chelsea', coverage: 62 }),
  ],
}

/* --------------------------------------------------------------- Safety */

export const safetyIncidents: FeatureCollection<
  Point,
  { id: string; name: string; severity: 'low' | 'medium' | 'high'; at: string }
> = {
  type: 'FeatureCollection',
  features: [
    point('si-1', [-0.1345, 51.5205], {
      name: 'Disengagement at roadworks',
      severity: 'low',
      at: '2026-08-14',
    }),
    point('si-2', [-0.0885, 51.5085], {
      name: 'Cyclist near miss',
      severity: 'medium',
      at: '2026-08-22',
    }),
    point('si-3', [-0.1155, 51.4975], {
      name: 'Emergency-vehicle handover',
      severity: 'medium',
      at: '2026-08-29',
    }),
    point('si-4', [-0.0295, 51.5035], {
      name: 'Kerbside obstruction stall',
      severity: 'low',
      at: '2026-09-01',
    }),
    point('si-5', [-0.1465, 51.5115], {
      name: 'Pedestrian crossing hard stop',
      severity: 'high',
      at: '2026-07-30',
    }),
  ],
}

export const LAYER_IDS = [
  'approved-zones',
  'pilot-zones',
  'restricted-zones',
  'pickup-zones',
  'charging',
  'congestion',
  'accessibility',
  'safety',
] as const

export type LayerId = (typeof LAYER_IDS)[number]

export const LAYER_META: Record<
  LayerId,
  { label: string; description: string; swatch: string; shape: 'area' | 'point' }
> = {
  'approved-zones': {
    label: 'Approved zones',
    description: 'Full autonomous licence in force.',
    swatch: '#0f9d83',
    shape: 'area',
  },
  'pilot-zones': {
    label: 'Pilot zones',
    description: 'Time-limited sandbox licence.',
    swatch: '#06b6d4',
    shape: 'area',
  },
  'restricted-zones': {
    label: 'Restricted zones',
    description: 'Autonomous operation prohibited.',
    swatch: '#dc2626',
    shape: 'area',
  },
  'pickup-zones': {
    label: 'Pickup zones',
    description: 'Designated kerbside pickup points.',
    swatch: '#2563eb',
    shape: 'point',
  },
  charging: {
    label: 'Charging locations',
    description: 'Depot charging capacity.',
    swatch: '#0f9d83',
    shape: 'point',
  },
  congestion: {
    label: 'Congestion',
    description: 'Peak vehicle-hour pressure.',
    swatch: '#d97706',
    shape: 'point',
  },
  accessibility: {
    label: 'Accessibility',
    description: 'Accessible-vehicle coverage by area.',
    swatch: '#1d4ed8',
    shape: 'point',
  },
  safety: {
    label: 'Safety incidents',
    description: 'Reported incidents in the last 60 days.',
    swatch: '#dc2626',
    shape: 'point',
  },
}
