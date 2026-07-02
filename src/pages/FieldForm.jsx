import { useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { BOOTHS, RATION_CARDS, SCHEMES, ISSUES } from '../constants'
import { queueSubmission } from '../db'
import { syncPending } from '../sync'

const emptyVoter = () => ({ name: '', age: '', voter_id: '', contact: '' })

const emptyHousehold = (assignedBooth) => ({
  booth_number: assignedBooth || '',
  part_number: '', door_no: '', street: '', landmark: '',
  ration_card: 'None', schemes: [], issues: [], issue_note: '',
  latitude: null, longitude: null
})

export default function FieldForm() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const onlyBooth = profile?.booths?.length === 1 ? profile.booths[0] : ''

  const [hh, setHh] = useState(emptyHousehold(onlyBooth))
  const [voters, setVoters] = useState([emptyVoter()])
  const [gps, setGps] = useState(false)
  const [flash, setFlash] = useState('')
  const [err, setErr] = useState('')

  // If a supporter is assigned specific booths, restrict the dropdown to those.
  const boothOptions = profile?.role === 'supporter' && profile?.booths?.length
    ? profile.booths : BOOTHS

  const setField = (k, v) => setHh(p => ({ ...p, [k]: v }))
  const toggleArr = (k, v) => setHh(p => ({
    ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v]
  }))

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

  async function onSave(e) {
    e.preventDefault()
    setErr(''); setFlash('')
    if (!hh.booth_number) { setErr(t('required_booth')); return }
    const cleanVoters = voters
      .filter(v => v.name.trim())
      .map(v => ({
        name: v.name.trim(),
        age: v.age ? parseInt(v.age, 10) : null,
        voter_id: v.voter_id.trim() || null,
        contact: v.contact.trim() || null
      }))
    if (!cleanVoters.length) { setErr(t('required_voter')); return }

    const household = {
      client_uuid: crypto.randomUUID(),
      booth_number: parseInt(hh.booth_number, 10),
      part_number: hh.part_number.trim() || null,
      door_no: hh.door_no.trim() || null,
      street: hh.street.trim() || null,
      landmark: hh.landmark.trim() || null,
      ration_card: hh.ration_card,
      schemes: hh.schemes,
      issues: hh.issues,
      issue_note: hh.issue_note.trim() || null,
      latitude: hh.latitude, longitude: hh.longitude
    }

    await queueSubmission({ household, voters: cleanVoters })
    const synced = await syncPending()
    setFlash(synced > 0 ? t('saved_synced') : t('saved_offline'))

    // Reset for the next house.
    setHh(emptyHousehold(onlyBooth))
    setVoters([emptyVoter()])
    setGps(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <form className="form" onSubmit={onSave}>
      {flash && <div className="banner-ok">{flash}</div>}
      {err && <div className="banner-error">{err}</div>}

      <section className="card">
        <h2>{t('voters')} ({voters.length})</h2>
        {voters.map((v, i) => (
          <div className="voter-row" key={i}>
            <div className="voter-head">
              <span className="voter-num">#{i + 1}</span>
              {voters.length > 1 && (
                <button type="button" className="btn-remove" onClick={() => removeVoter(i)}>✕ {t('remove')}</button>
              )}
            </div>
            <div className="grid2">
              <div className="field span2">
                <label>{t('voter_name')}</label>
                <input value={v.name} onChange={e => setVoter(i, 'name', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('age')}</label>
                <input value={v.age} onChange={e => setVoter(i, 'age', e.target.value)} inputMode="numeric" />
              </div>
              <div className="field">
                <label>{t('contact')}</label>
                <input value={v.contact} onChange={e => setVoter(i, 'contact', e.target.value)} inputMode="tel" />
              </div>
              <div className="field span2">
                <label>{t('voter_id')}</label>
                <input value={v.voter_id} onChange={e => setVoter(i, 'voter_id', e.target.value)}
                       style={{ textTransform: 'uppercase' }} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add" onClick={addVoter}>＋ {t('add_voter')}</button>
      </section>

      <section className="card">
        <h2>{t('household_details')}</h2>
        <div className="grid2">
          <div className="field">
            <label>{t('booth_number')} *</label>
            <select value={hh.booth_number} onChange={e => setField('booth_number', e.target.value)}>
              <option value="">{t('select')}</option>
              {boothOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('part_number')}</label>
            <input value={hh.part_number} onChange={e => setField('part_number', e.target.value)} inputMode="numeric" />
          </div>
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
              <button type="button" key={rc}
                className={`chip ${hh.ration_card === rc ? 'on' : ''}`}
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
              <button type="button" key={s}
                className={`chip ${hh.schemes.includes(s) ? 'on' : ''}`}
                onClick={() => toggleArr('schemes', s)}>{t(s)}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('issues')}</label>
          <div className="chips">
            {ISSUES.map(s => (
              <button type="button" key={s}
                className={`chip ${hh.issues.includes(s) ? 'on' : ''}`}
                onClick={() => toggleArr('issues', s)}>{t(s)}</button>
            ))}
          </div>
        </div>
        {hh.issues.length > 0 && (
          <div className="field">
            <label>{t('issue_note')}</label>
            <textarea rows={2} value={hh.issue_note} onChange={e => setField('issue_note', e.target.value)} />
          </div>
        )}

        <button type="button" className={`btn-gps ${gps ? 'on' : ''}`} onClick={tagGps}>
          📍 {gps ? t('gps_tagged') : t('use_gps')}
        </button>
      </section>

      <p className="consent">{t('consent_note')}</p>
      <button type="submit" className="btn-primary btn-save">💾 {t('save')}</button>
    </form>
  )
}
