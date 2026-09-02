import 'server-only'
import { FirestoreRepository } from './firestore-repository'
import { MemoryRepository } from './memory-repository'
import { configuredPersistence, firebaseAdminConfigured } from './repository'
import type { Repository } from './repository'

let cached: Repository | null = null

/**
 * Resolves the active repository once per process. Firestore is used only when
 * it is both requested and fully configured — otherwise the app falls back to
 * the seeded in-memory store so it always runs.
 */
export function repository(): Repository {
  if (cached) return cached

  if (configuredPersistence() === 'firestore') {
    if (!firebaseAdminConfigured()) {
      console.warn(
        '[civicos] CIVICOS_PERSISTENCE=firestore but service-account credentials are missing — falling back to the in-memory store.',
      )
    } else {
      cached = new FirestoreRepository()
      return cached
    }
  }

  cached = new MemoryRepository()
  return cached
}

export type { Repository, SimulationPatch } from './repository'
