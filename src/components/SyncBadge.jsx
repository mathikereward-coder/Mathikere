import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { pendingCount } from '../db'
import { syncPending } from '../sync'

// Shows "N waiting to sync" and online/offline status. Polls the local queue.
export default function SyncBadge() {
  const { t } = useI18n()
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const refresh = async () => setPending(await pendingCount())
    refresh()
    const id = setInterval(refresh, 2000)
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { clearInterval(id); window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <div className="sync-badge">
      <span className={online ? 'dot online' : 'dot offline'} />
      <span className="sync-text">
        {pending > 0 ? `${pending} ${t('pending_sync')}` : t('synced')}
      </span>
      {pending > 0 && online && (
        <button className="sync-now" onClick={() => syncPending()}>{t('sync_now')}</button>
      )}
    </div>
  )
}
