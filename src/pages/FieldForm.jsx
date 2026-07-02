import { useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { FORM_BOOTHS, RATION_CARDS, SCHEMES, ISSUES, ISSUE_ICONS, HOUSE_OWNERSHIP, GENDERS } from '../constants'
import { queueSubmission } from '../db'
import { syncPending } from '../sync'

const onlyDigits = (s, max) => (s || '').replace(/[^0-9]/g, '').slice(0, max)
const emptyVoter = () => ({ name: '', gender: '', age: '', voter_id: '', contact: '' })

const emptyHousehold = (assignedBooth) => ({
  booth_number: assignedBooth === 0 || assignedBooth ? String(assignedBooth) : '',
  part_number: '', house_ownership: '', door_no: '', street: '', landmark: '',
  ration_card: 'None', schemes: [], issues: [], issue_note: '',
  is_special: false, latitude: null, longitude: null
})

export default function FieldForm() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const onlyBooth = profile?.booths?.length === 1 ? profile.booths[0] : ''

  const [hh, setHh] = useState(emptyHousehold(onlyBooth))
  const [voters, setVoters] = useState([emptyVoter()])
  const [gps, setGps] = useState(false)
  const [err, setErr] = useState('')
  const [submitted, setSubmitted] = useState(null) // { synced: bool }

  const boothOptions = profile?.role === 'supporter' && profile?.booths?.length
    ? profile.booths : FORM_BOOTHS

  const setField = (k, v) => setHh(p => ({ ...p, [k]: v }))
  // multi-select where 'None' is exclusive
  const toggleArr = (k, v) => setHh(p => {
    const has = p[k].includes(v)
    let next
    if (v === 'None') next = has ? [] : ['None']
    else next = (has ? p[k].filter(x => x !== v) : [...p[k], v]).filter(x => x !== 'None')
    return { ...p, [k]: next }
  })

  const setVoter = (i, k, v) => setVoters(p => p.map((row, idx) => idx === i ? { ...row, [k]: v } : row))
  const addVoter = () => setVoters(p => [...p, emptyVoter()])
  const removeVoter = (i) => setVoters(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)

  function tagGps() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => { setField('latitude', pos.coords.latitude); setField('longitude', pos.coords.longitude); setGps(true) },
      () => setGps(false)
    )
  }

  function resetForm() {
    setHh(emptyHousehold(onlyBooth)); setVoters([emptyVoter()]); setGps(false); setErr(''); setSubmitted(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSave(e) {
    e.preventDefault()
    setErr('')
    if (hh.booth_number === '') { setErr(t('required_booth')); return }
    // contact: if entered, must be exactly 10 digits
    for (const v of voters) {
      if (v.contact && v.contact.length !== 10) { setErr(t('contact_invalid')); return }
    }
    const cleanVoters = voters
      .filter(v => v.name.trim())
      .map(v => ({
        name: v.name.trim(), gender: v.gender || null,
        age: v.age ? parseInt(v.age, 10) : null,
        voter_id: v.voter_id.trim() || null,
        contact: v.contact || null
      }))
    if (!cleanVoters.length) { setErr(t('required_voter')); return }

    const household = {
      client_uuid: crypto.randomUUID(),
      booth_number: parseInt(hh.booth_number, 10),
      part_number: hh.part_number.trim() || null,
      house_ownership: hh.house_ownership || null,
      door_no: hh.door_no.trim() || null,
      street: hh.street.trim() || null,
      landmark: hh.landmark.trim() || null,
      ration_card: hh.ration_card,
      schemes: hh.schemes, issues: hh.issues, issue_note: hh.issue_note.trim() || null,
      is_special: !!hh.is_special,
      latitude: hh.latitude, longitude: hh.longitude
    }

    await queueSubmission({ household, voters: cleanVoters })
    const synced = await syncPending()
    setSubmitted({ synced: synced > 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---------- success screen ----------
  if (submitted) {
    return (
      <div className="success-screen">
        <div className="success-emoji">👍</div>
        <h2>{t('submitted_title')}</h2>
        <p className="muted">{submitted.synced ? t('saved_synced') : t('saved_offline')}</p>
        <button className="btn-primary" onClick={resetForm}>＋ {t('start_new_entry')}</button>
      </div>
    )
  }

  const boothLabel = (b) => b === 0 ? t('booth_na') : b

  return (
    <form className="form" onSubmit={onSave}>
      {err && <div className="banner-error">{err}</div>}

      {/* ---------- VOTERS (top) ---------- */}
      <section className="card">
        <h2>🧑‍🤝‍🧑 {t('voters')} <span className="muted">({voters.length})</span></h2>
        {voters.map((v, i) => (
          <div className="voter-row" key={i}>
            <div className="voter-head">
              <span className="voter-num">#{i + 1}</span>
              {voters.length > 1 && (
                <button type="button" className="btn-remove" onClick={() => removeVoter(i)}>✕ {t('remove')}</button>
              )}
            </div>
            <div className="field">
              <label>{t('voter_name')}</label>
              <input value={v.name} onChange={e => setVoter(i, 'name', e.target.value)} />
            </div>
            <div className="field">
              <label>{t('gender')}</label>
              <div className="chips">
                {GENDERS.map(g => (
                  <button type="button" key={g} className={`chip ${v.gender === g ? 'on' : ''}`}
                    onClick={() => setVoter(i, 'gender', v.gender === g ? '' : g)}>
                    {g === 'M' ? `👨 ${t('male')}` : `👩 ${t('female')}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label>{t('age')}</label>
                <input value={v.age} onChange={e => setVoter(i, 'age', onlyDigits(e.target.value, 3))} inputMode="numeric" />
              </div>
              <div className="field">
                <label>{t('contact')}</label>
                <input value={v.contact} onChange={e => setVoter(i, 'contact', onlyDigits(e.target.value, 10))}
                       inputMode="tel" placeholder="10 digits" />
              </div>
            </div>
            <div className="field">
              <label>{t('voter_id')}</label>
              <input value={v.voter_id} onChange={e => setVoter(i, 'voter_id', e.target.value)}
                     style={{ textTransform: 'uppercase' }} />
            </div>
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addVoter}>＋ {t('add_voter')}</button>
      </section>

      {/* ---------- HOUSEHOLD (below) ---------- */}
      <section className="card">
        <h2>🏠 {t('household_details')}</h2>
        <div className="grid2">
          <div className="field">
            <label>{t('booth_number')} *</label>
            <select value={hh.booth_number} onChange={e => setField('booth_number', e.target.value)}>
              <option value="">{t('select')}</option>
              {boothOptions.map(b => <option key={b} value={b}>{boothLabel(b)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('part_number')}</label>
            <input value={hh.part_number} onChange={e => setField('part_number', onlyDigits(e.target.value, 4))} inputMode="numeric" />
          </div>
        </div>

        <div className="field">
          <label>{t('house_ownership')}</label>
          <div className="chips">
            {HOUSE_OWNERSHIP.map(o => (
              <button type="button" key={o} className={`chip ${hh.house_ownership === o ? 'on' : ''}`}
                onClick={() => setField('house_ownership', hh.house_ownership === o ? '' : o)}>
                {o === 'Own' ? `🏠 ${t('own')}` : `🔑 ${t('rented')}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>{t('door_no')}</label>
            <input value={hh.door_no} onChange={e => setField('door_no', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('landmark')}</label>
            <input value={hh.landmark} onChange={e => setField('landmark', e.target.value)} />
          </div>
          <div className="field span2">
            <label>{t('street')}</label>
            <input value={hh.street} onChange={e => setField('street', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>{t('ration_card')}</label>
          <div className="chips">
            {RATION_CARDS.map(rc => (
              <button type="button" key={rc} className={`chip ${hh.ration_card === rc ? 'on' : ''}`}
                onClick={() => setField('ration_card', rc)}>
                {rc === 'None' ? t('none') : t(rc)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('schemes')}</label>
          <div className="chips">
            {SCHEMES.map(s => (
              <button type="button" key={s} className={`chip ${hh.schemes.includes(s) ? 'on' : ''}`}
                onClick={() => toggleArr('schemes', s)}>{s === 'None' ? t('none') : t(s)}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('issues')}</label>
          <div className="chips issue-chips">
            {ISSUES.map(s => (
              <button type="button" key={s} className={`chip ${hh.issues.includes(s) ? 'on' : ''}`}
                onClick={() => toggleArr('issues', s)}>
                <span className="chip-ic">{ISSUE_ICONS[s]}</span> {s === 'None' ? t('none') : t(s)}
              </button>
            ))}
          </div>
        </div>
        {hh.issues.length > 0 && !hh.issues.includes('None') && (
          <div className="field">
            <label>{t('note_on_issues')}</label>
            <textarea rows={2} value={hh.issue_note} onChange={e => setField('issue_note', e.target.value)} />
          </div>
        )}

        <div className="row-split">
          <button type="button" className={`btn-gps ${gps ? 'on' : ''}`} onClick={tagGps}>
            📍 {gps ? t('gps_tagged') : t('use_gps')}
          </button>
          <button type="button" className={`btn-special ${hh.is_special ? 'on' : ''}`}
            onClick={() => setField('is_special', !hh.is_special)}>
            {hh.is_special ? '⭐' : '☆'} {t('mark_special')}
          </button>
        </div>
      </section>

      <p className="consent">{t('consent_note')}</p>
      <button type="submit" className="btn-primary btn-save">💾 {t('save')}</button>
    </form>
  )
}
