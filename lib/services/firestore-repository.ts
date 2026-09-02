/**
 * Firestore-backed repository, used when CIVICOS_PERSISTENCE=firestore and
 * service-account credentials are present.
 *
 * Collections:
 *   simulations/{simulationId}
 *   results/{simulationId__scenario}
 *   audit/{auditId}
 */
import 'server-only'
import type { App } from 'firebase-admin/app'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { Firestore } from 'firebase-admin/firestore'
import type { AuditEntry, ResultBundle, Simulation } from '../types'
import type { Repository, SimulationPatch } from './repository'

const APP_NAME = 'civicos-admin'

function adminApp(): App {
  const existing = getApps().find((app) => app.name === APP_NAME)
  if (existing) return existing

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      'Firestore persistence requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
    )
  }

  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    },
    APP_NAME,
  )
}

function db(): Firestore {
  return getFirestore(adminApp())
}

function resultKey(simulationId: string, scenario: string) {
  return `${simulationId}__${scenario}`
}

export class FirestoreRepository implements Repository {
  async listSimulations(): Promise<Simulation[]> {
    const snapshot = await db().collection('simulations').orderBy('updatedAt', 'desc').get()
    return snapshot.docs.map((doc) => doc.data() as Simulation)
  }

  async getSimulation(id: string): Promise<Simulation | null> {
    const doc = await db().collection('simulations').doc(id).get()
    return doc.exists ? (doc.data() as Simulation) : null
  }

  async createSimulation(simulation: Simulation): Promise<Simulation> {
    await db().collection('simulations').doc(simulation.id).set(simulation)
    return simulation
  }

  async updateSimulation(id: string, patch: SimulationPatch): Promise<Simulation | null> {
    const ref = db().collection('simulations').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return null
    const updated: Simulation = {
      ...(doc.data() as Simulation),
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    await ref.set(updated)
    return updated
  }

  async deleteSimulation(id: string): Promise<boolean> {
    const ref = db().collection('simulations').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return false
    await ref.delete()
    return true
  }

  async saveResults(bundle: ResultBundle): Promise<void> {
    await db()
      .collection('results')
      .doc(resultKey(bundle.simulationId, bundle.scenario))
      .set(bundle)
  }

  async getResults(simulationId: string, scenario: string): Promise<ResultBundle | null> {
    const doc = await db().collection('results').doc(resultKey(simulationId, scenario)).get()
    return doc.exists ? (doc.data() as ResultBundle) : null
  }

  async listAudit(limit = 50): Promise<AuditEntry[]> {
    const snapshot = await db().collection('audit').orderBy('at', 'desc').limit(limit).get()
    return snapshot.docs.map((doc) => doc.data() as AuditEntry)
  }

  async appendAudit(entry: AuditEntry): Promise<AuditEntry> {
    await db().collection('audit').doc(entry.id).set(entry)
    return entry
  }
}
