import Dexie from 'dexie'

// Local on-device database (IndexedDB) so the field form works fully offline.
// Each "submission" is one household + its voters, queued until it syncs to Supabase.
export const db = new Dexie('mathikere_ward')

db.version(1).stores({
  // synced: 0 = waiting, 1 = uploaded. client_uuid keeps sync idempotent.
  submissions: '++id, client_uuid, synced, created_at'
})

export async function queueSubmission(payload) {
  return db.submissions.add({
    ...payload,
    synced: 0,
    created_at: new Date().toISOString()
  })
}

export async function pendingCount() {
  return db.submissions.where('synced').equals(0).count()
}
