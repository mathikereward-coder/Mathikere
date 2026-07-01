import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabaseClient'
import { BOOTHS } from '../constants'

export default function FieldTeam() {
  const { t } = useI18n()
  const { session } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [flash, setFlash] = useState('')
  const [err, setErr] = useState('')

  // add-worker form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pwd, setPwd] = useState('')
  const [booths, setBooths] = useState([])
  const [busy, setBusy] = useState(false)

  // inline booth editor
  const [editId, setEditId] = useState(null)
  const [editBooths, setEditBooths] = useState([])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_list_team')
    if (error) setErr(error.message)
    else setTeam(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggle = (arr, setArr, b) =>
    setArr(arr.includes(b) ? arr.filter(x => x !== b) : [...arr, b].sort((a, c) => a - c))

  async function createWorker(e) {
    e.preventDefault()
    setErr(''); setFlash(''); setBusy(true)
    const { data, error } = await supabase.rpc('admin_create_worker', {
      p_name: name.trim(), p_phone: phone.trim(), p_password: pwd, p_booths: booths
    })
    setBusy(false)
    if (error) { setErr(error.message); return }
    setFlash(`${t('worker_created')}  →  ${data.login_phone} / ${pwd}`)
    setName(''); setPhone(''); setPwd(''); setBooths([]); setShowAdd(false)
    load()
  }

  async function resetPassword(w) {
    const np = window.prompt(`${t('new_password')} — ${w.full_name}`)
    if (!np) return
    const { error } = await supabase.rpc('admin_reset_password', { p_user_id: w.user_id, p_password: np })
    setErr(error ? error.message : ''); if (!error) setFlash(`${t('saved_ok')}: ${w.full_name} → ${np}`)
  }
  async function setActive(w, active) {
    if (!active && !window.confirm(t('confirm_deactivate'))) return
    const { error } = await supabase.rpc('admin_set_active', { p_user_id: w.user_id, p_active: active })
    if (error) setErr(error.message); else load()
  }
  async function setRole(w, role) {
    const { error } = await supabase.rpc('admin_set_role', { p_user_id: w.user_id, p_role: role })
    if (error) setErr(error.message); else load()
  }
  function startEditBooths(w) { setEditId(w.user_id); setEditBooths(w.booths || []) }
  async function saveBooths(w) {
    const { error } = await supabase.rpc('admin_set_booths', { p_user_id: w.user_id, p_booths: editBooths })
    if (error) setErr(error.message); else { setEditId(null); load() }
  }

  if (loading) return <div className="center-screen">{t('loading')}</div>
  const myId = session?.user?.id

  return (
    <div className="team">
      {flash && <div className="banner-ok">{flash}</div>}
      {err && <div className="banner-error">{err}</div>}

      <div className="team-head">
        <h2>{t('field_team')}</h2>
        <button className="btn-primary btn-inline" onClick={() => setShowAdd(s => !s)}>
          {showAdd ? t('cancel') : `＋ ${t('add_worker')}`}
        </button>
      </div>
      <p className="muted small">{t('login_as_worker')}</p>

      {showAdd && (
        <form className="card" onSubmit={createWorker}>
          <div className="field"><label>{t('worker_name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="grid2">
            <div className="field"><label>{t('phone_number')}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" required /></div>
            <div className="field"><label>{t('set_password')}</label>
              <input value={pwd} onChange={e => setPwd(e.target.value)} required /></div>
          </div>
          <div className="field">
            <label>{t('assign_booths')}</label>
            <div className="booth-grid">
              {BOOTHS.map(b => (
                <button type="button" key={b}
                  className={`booth-chip ${booths.includes(b) ? 'on' : ''}`}
                  onClick={() => toggle(booths, setBooths, b)}>{b}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? '…' : t('create_worker')}
          </button>
        </form>
      )}

      {team.length === 0 ? <div className="card">{t('no_workers')}</div> : team.map(w => (
        <div className="card worker-card" key={w.user_id}>
          <div className="worker-top">
            <div>
              <div className="worker-name">{w.full_name || '—'}
                <span className={`role-badge ${w.role}`}>{w.role === 'admin' ? t('role_admin') : t('role_worker')}</span>
                {!w.active && <span className="role-badge inactive">{t('inactive_label')}</span>}
              </div>
              <div className="muted small">{w.phone ? `📞 ${w.phone}` : ''}</div>
            </div>
          </div>

          {w.role !== 'admin' && (
            editId === w.user_id ? (
              <div className="field">
                <div className="booth-grid">
                  {BOOTHS.map(b => (
                    <button type="button" key={b}
                      className={`booth-chip ${editBooths.includes(b) ? 'on' : ''}`}
                      onClick={() => toggle(editBooths, setEditBooths, b)}>{b}</button>
                  ))}
                </div>
                <button className="btn-add" onClick={() => saveBooths(w)}>💾 {t('save_booths')}</button>
              </div>
            ) : (
              <div className="worker-booths">
                <span className="muted small">{t('booths_label')}: </span>
                {(w.booths || []).length ? w.booths.map(b => <span className="booth-tag" key={b}>{b}</span>)
                  : <span className="muted small">—</span>}
                <button className="link-btn" onClick={() => startEditBooths(w)}>{t('edit_booths')}</button>
              </div>
            )
          )}

          {w.user_id !== myId && (
            <div className="worker-actions">
              <button className="chip-btn" onClick={() => resetPassword(w)}>🔑 {t('reset_password')}</button>
              {w.active
                ? <button className="chip-btn danger" onClick={() => setActive(w, false)}>🚫 {t('deactivate')}</button>
                : <button className="chip-btn" onClick={() => setActive(w, true)}>✅ {t('activate')}</button>}
              {w.role === 'admin'
                ? <button className="chip-btn" onClick={() => setRole(w, 'supporter')}>{t('make_worker')}</button>
                : <button className="chip-btn" onClick={() => setRole(w, 'admin')}>👑 {t('make_admin')}</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
