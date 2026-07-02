import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabaseClient'
import { BOOTHS } from '../constants'

export default function FieldTeam() {
  const { t } = useI18n()
  const { session, isSuperAdmin } = useAuth()
  const myId = session?.user?.id

  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState('')
  const [err, setErr] = useState('')

  // add forms
  const [addMode, setAddMode] = useState(null) // 'member' | 'worker' | null
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
    if (error) setErr(error.message); else setTeam(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const members = team.filter(w => w.role === 'admin')
  const workers = team.filter(w => w.role === 'supporter')
  const superRow = team.find(w => w.role === 'super_admin')

  const toggle = (arr, setArr, b) =>
    setArr(arr.includes(b) ? arr.filter(x => x !== b) : [...arr, b].sort((a, c) => a - c))

  function openAdd(mode) {
    setAddMode(mode); setName(''); setPhone(''); setPwd(''); setBooths(''); setBooths([])
    setErr(''); setFlash('')
  }

  async function submitAdd(e) {
    e.preventDefault(); setErr(''); setFlash(''); setBusy(true)
    const fn = addMode === 'member' ? 'admin_create_member' : 'admin_create_worker'
    const args = addMode === 'member'
      ? { p_name: name.trim(), p_phone: phone.trim(), p_password: pwd }
      : { p_name: name.trim(), p_phone: phone.trim(), p_password: pwd, p_booths: booths }
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { setErr(error.message); return }
    setFlash(`${t('worker_created')}  →  ${data.login_phone} / ${pwd}`)
    setAddMode(null); setName(''); setPhone(''); setPwd(''); setBooths([])
    load()
  }

  async function resetPassword(w) {
    const np = window.prompt(`${t('new_password')} — ${w.full_name}`)
    if (!np) return
    const { error } = await supabase.rpc('admin_reset_password', { p_user_id: w.user_id, p_password: np })
    if (error) setErr(error.message); else setFlash(`${t('saved_ok')}: ${w.full_name} → ${np}`)
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
  async function setContact(w, can) {
    const { error } = await supabase.rpc('admin_set_contact_permission', { p_user_id: w.user_id, p_can: can })
    if (error) setErr(error.message); else load()
  }
  async function setSpecial(w, can) {
    const { error } = await supabase.rpc('admin_set_special_permission', { p_user_id: w.user_id, p_can: can })
    if (error) setErr(error.message); else load()
  }
  function startEditBooths(w) { setEditId(w.user_id); setEditBooths(w.booths || []) }
  async function saveBooths(w) {
    const { error } = await supabase.rpc('admin_set_booths', { p_user_id: w.user_id, p_booths: editBooths })
    if (error) setErr(error.message); else { setEditId(null); load() }
  }

  if (loading) return <div className="center-screen">{t('loading')}</div>

  const boothPicker = (arr, setArr) => (
    <div className="booth-grid">
      {BOOTHS.map(b => (
        <button type="button" key={b} className={`booth-chip ${arr.includes(b) ? 'on' : ''}`}
          onClick={() => toggle(arr, setArr, b)}>{b}</button>
      ))}
    </div>
  )

  return (
    <div className="team">
      {flash && <div className="banner-ok">{flash}</div>}
      {err && <div className="banner-error">{err}</div>}

      {/* Super admin identity */}
      {superRow && (
        <div className="card super-card">
          <span className="role-badge super">👑 {t('super_admin')}</span>
          <strong>{superRow.full_name}</strong>
          {superRow.user_id === myId && <span className="muted small"> · {t('you')}</span>}
        </div>
      )}

      {/* ---------- MEMBERS (super admin only) ---------- */}
      {isSuperAdmin && (
        <>
          <div className="team-head">
            <h2>{t('members_title')} <span className="muted small">({members.length}/5)</span></h2>
            <button className="btn-primary btn-inline" disabled={members.length >= 5}
              onClick={() => addMode === 'member' ? setAddMode(null) : openAdd('member')}>
              {addMode === 'member' ? t('cancel') : `＋ ${t('add_member')}`}
            </button>
          </div>
          <p className="muted small">{t('member_help')}</p>

          {addMode === 'member' && (
            <form className="card" onSubmit={submitAdd}>
              <div className="field"><label>{t('worker_name')}</label>
                <input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="grid2">
                <div className="field"><label>{t('phone_number')}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" required /></div>
                <div className="field"><label>{t('set_password')}</label>
                  <input value={pwd} onChange={e => setPwd(e.target.value)} required /></div>
              </div>
              <button className="btn-primary" type="submit" disabled={busy}>{busy ? '…' : t('add_member')}</button>
            </form>
          )}

          {members.length === 0 ? <div className="card muted">{t('no_members')}</div> : members.map(w => (
            <div className="card worker-card" key={w.user_id}>
              <div className="worker-name">{w.full_name || '—'}
                <span className="role-badge admin">{t('role_member')}</span>
                {!w.active && <span className="role-badge inactive">{t('inactive_label')}</span>}
              </div>
              <div className="muted small">{w.phone ? `📞 ${w.phone}` : ''}</div>
              <div className="worker-actions">
                <button className="chip-btn" onClick={() => resetPassword(w)}>🔑 {t('reset_password')}</button>
                {w.active
                  ? <button className="chip-btn danger" onClick={() => setActive(w, false)}>🚫 {t('deactivate')}</button>
                  : <button className="chip-btn" onClick={() => setActive(w, true)}>✅ {t('activate')}</button>}
                <button className="chip-btn" onClick={() => setRole(w, 'supporter')}>⬇ {t('remove_admin')}</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ---------- WORKERS (super admin + members) ---------- */}
      <div className="team-head team-head-gap">
        <h2>{t('field_workers')} <span className="muted small">({workers.length})</span></h2>
        <button className="btn-primary btn-inline"
          onClick={() => addMode === 'worker' ? setAddMode(null) : openAdd('worker')}>
          {addMode === 'worker' ? t('cancel') : `＋ ${t('add_worker')}`}
        </button>
      </div>
      <p className="muted small">{t('login_as_worker')}</p>

      {addMode === 'worker' && (
        <form className="card" onSubmit={submitAdd}>
          <div className="field"><label>{t('worker_name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="grid2">
            <div className="field"><label>{t('phone_number')}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" required /></div>
            <div className="field"><label>{t('set_password')}</label>
              <input value={pwd} onChange={e => setPwd(e.target.value)} required /></div>
          </div>
          <div className="field"><label>{t('assign_booths')}</label>{boothPicker(booths, setBooths)}</div>
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? '…' : t('create_worker')}</button>
        </form>
      )}

      {workers.length === 0 ? <div className="card muted">{t('no_workers')}</div> : workers.map(w => (
        <div className="card worker-card" key={w.user_id}>
          <div className="worker-name">{w.full_name || '—'}
            <span className="role-badge">{t('role_worker')}</span>
            {!w.active && <span className="role-badge inactive">{t('inactive_label')}</span>}
            {w.can_view_contact && <span className="role-badge mobile">📞 {t('sees_mobile')}</span>}
            {w.can_view_special && <span className="role-badge super">⭐ {t('sees_special')}</span>}
          </div>
          <div className="muted small">{w.phone ? `📞 ${w.phone}` : ''}</div>

          {editId === w.user_id ? (
            <div className="field">
              {boothPicker(editBooths, setEditBooths)}
              <button className="btn-add" onClick={() => saveBooths(w)}>💾 {t('save_booths')}</button>
            </div>
          ) : (
            <div className="worker-booths">
              <span className="muted small">{t('booths_label')}: </span>
              {(w.booths || []).length ? w.booths.map(b => <span className="booth-tag" key={b}>{b}</span>)
                : <span className="muted small">—</span>}
              <button className="link-btn" onClick={() => startEditBooths(w)}>{t('edit_booths')}</button>
            </div>
          )}

          <div className="access-label muted small">🔓 {t('access_label')}</div>
          <div className="worker-actions">
            <button className="chip-btn" onClick={() => resetPassword(w)}>🔑 {t('reset_password')}</button>
            {w.can_view_contact
              ? <button className="chip-btn" onClick={() => setContact(w, false)}>📵 {t('hide_mobile')}</button>
              : <button className="chip-btn" onClick={() => setContact(w, true)}>📞 {t('allow_mobile')}</button>}
            {isSuperAdmin && (w.can_view_special
              ? <button className="chip-btn" onClick={() => setSpecial(w, false)}>☆ {t('hide_special')}</button>
              : <button className="chip-btn" onClick={() => setSpecial(w, true)}>⭐ {t('allow_special')}</button>)}
            {w.active
              ? <button className="chip-btn danger" onClick={() => setActive(w, false)}>🚫 {t('deactivate')}</button>
              : <button className="chip-btn" onClick={() => setActive(w, true)}>✅ {t('activate')}</button>}
            {isSuperAdmin && members.length < 5 &&
              <button className="chip-btn" onClick={() => setRole(w, 'admin')}>⬆ {t('make_member')}</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
