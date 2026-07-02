import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useToast } from '../components/Toast'
import { supabase } from '../supabaseClient'
import { BOOTHS } from '../constants'

// Full-page form for adding a Member or a Worker. On success it shows the new
// login details, then the user returns to the Field Team page.
export default function AddPerson() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { kind } = useParams() // 'member' | 'worker'
  const isWorker = kind === 'worker'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pwd, setPwd] = useState('')
  const [booths, setBooths] = useState([])
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const toggle = (b) => setBooths(booths.includes(b) ? booths.filter(x => x !== b) : [...booths, b].sort((a, c) => a - c))
  const onlyDigits = (s) => s.replace(/[^0-9]/g, '')

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    const fn = isWorker ? 'admin_create_worker' : 'admin_create_member'
    const args = isWorker
      ? { p_name: name.trim(), p_phone: phone.trim(), p_password: pwd, p_booths: booths }
      : { p_name: name.trim(), p_phone: phone.trim(), p_password: pwd }
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { toast(error.message); return }
    setCreated({ ...data, name: name.trim(), password: pwd })
  }

  function addAnother() {
    setCreated(null); setName(''); setPhone(''); setPwd(''); setBooths([])
    window.scrollTo({ top: 0 })
  }

  if (created) {
    return (
      <div className="addperson">
        <div className="success-screen">
          <div className="success-emoji">👍</div>
          <h2>{isWorker ? t('worker_name') : t('role_member')} · {t('created_ok')}</h2>
          <div className="cred-box">
            <div><span className="muted small">{t('worker_name')}</span><b>{created.name}</b></div>
            <div><span className="muted small">{t('phone_number')}</span><b>{created.login_phone}</b></div>
            <div><span className="muted small">{t('password')}</span><b>{created.password}</b></div>
          </div>
          <p className="muted small">{t('login_as_worker')}</p>
          <div className="confirm-actions">
            <button className="btn-ghost" onClick={addAnother}>＋ {t('add_another')}</button>
            <button className="btn-primary" onClick={() => navigate('/team')}>{t('done_field_team')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="addperson">
      <button className="link-btn back-link" onClick={() => navigate('/team')}>← {t('back')}</button>
      <h2 className="add-title">{isWorker ? `＋ ${t('add_worker')}` : `＋ ${t('add_member')}`}</h2>
      {!isWorker && <p className="muted small">{t('member_help')}</p>}

      <form className="card" onSubmit={submit}>
        <div className="field"><label>{t('worker_name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} required autoFocus /></div>
        <div className="grid2">
          <div className="field"><label>{t('phone_number')}</label>
            <input value={phone} onChange={e => setPhone(onlyDigits(e.target.value))} inputMode="tel" required /></div>
          <div className="field"><label>{t('set_password')}</label>
            <input value={pwd} onChange={e => setPwd(e.target.value)} required /></div>
        </div>
        {isWorker && (
          <div className="field">
            <label>{t('assign_booths')}</label>
            <div className="booth-grid">
              {BOOTHS.map(b => (
                <button type="button" key={b} className={`booth-chip ${booths.includes(b) ? 'on' : ''}`}
                  onClick={() => toggle(b)}>{b}</button>
              ))}
            </div>
          </div>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? '…' : (isWorker ? t('create_worker') : t('add_member'))}
        </button>
      </form>
    </div>
  )
}
