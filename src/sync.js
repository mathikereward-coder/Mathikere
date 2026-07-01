import { db } from './db'
import { supabase, isConfigured } from './supabaseClient'

let running = false

// Push all queued submissions to Supabase. Safe to call often; it no-ops if offline,
// not configured, or already running. Returns number successfully synced.
export async function syncPending() {
  if (running || !isConfigured || !navigator.onLine) return 0
  running = true
  let count = 0
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const pending = await db.submissions.where('synced').equals(0).toArray()
    for (const sub of pending) {
      const { household, voters } = sub

      // Insert household. client_uuid is UNIQUE, so a re-run won't create duplicates.
      const { data: hh, error: hhErr } = await supabase
        .from('households')
        .upsert({ ...household, collected_by: user.id }, { onConflict: 'client_uuid' })
        .select('id')
        .single()

      if (hhErr) { console.warn('household sync failed', hhErr.message); continue }

      // Replace voters for this household (idempotent on re-sync).
      await supabase.from('voters').delete().eq('household_id', hh.id)
      if (voters && voters.length) {
        const rows = voters.map(v => ({ ...v, household_id: hh.id }))
        const { error: vErr } = await supabase.from('voters').insert(rows)
        if (vErr) { console.warn('voters sync failed', vErr.message); continue }
      }

      await db.submissions.update(sub.id, { synced: 1, synced_at: new Date().toISOString() })
      count++
    }
  } catch (e) {
    console.warn('sync error', e)
  } finally {
    running = false
  }
  return count
}

// Auto-sync when the device comes back online.
export function startAutoSync() {
  window.addEventListener('online', () => { syncPending() })
  // Also try every 60s while the app is open.
  setInterval(() => { syncPending() }, 60000)
}
