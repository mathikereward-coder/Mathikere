import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabaseClient'
import { BOOTHS, ISSUE_ICONS } from '../constants'

export default function Households() {
  const { t } = useI18n()
  const { isAdmin, profile } = useAuth()
  const canSeeSpecial = isAdmin || profile?.canViewSpecial
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [booth, setBooth] = useState('all')
  const [tab, setTab] = useState('all') // 'all' | 'special'
  const [detail, setDetail] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_households_visible')
    if (error) console.warn(error.message)
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const boothsPresent = useMemo(
    () => Array.from(new Set(rows.map(r => r.booth_number))).sort((a, b) => a - b), [rows])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(h => {
      if (tab === 'special' && !h.is_special) return false
      if (booth !== 'all' && h.booth_number !== Number(booth)) return false
      if (!s) return true
      return (h.voters || []).some(v =>
        (v.name || '').toLowerCase().includes(s) ||
        (v.voter_id || '').toLowerCase().includes(s) || (v.contact || '').includes(s)
      ) || String(h.booth_number).includes(s)
    })
  }, [rows, q, booth, tab])

  const specialCount = useMemo(() => rows.filter(r => r.is_special).length, [rows])

  function exportExcel() {
    const flat = []
    filtered.forEach(h => (h.voters || []).forEach(v => flat.push({
      Booth: h.booth_number, Serial: h.part_number, House: h.house_ownership, Door: h.door_no,
      Street: h.street, Landmark: h.landmark, RationCard: h.ration_card,
      Schemes: (h.schemes || []).join(', '), Issues: (h.issues || []).join(', '), Note: h.issue_note,
      Special: h.is_special ? 'YES' : '', VoterName: v.name, Gender: v.gender, Age: v.age,
      VoterID: v.voter_id, Contact: v.contact, CapturedBy: h.collector_name
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), tab === 'special' ? 'Special' : 'Residents')
    XLSX.writeFile(wb, `mathikere-${tab === 'special' ? 'special-list' : 'residents'}.xlsx`)
  }

  async function toggleSpecial(h, e) {
    e.stopPropagation()
    const { error } = await supabase.from('households').update({ is_special: !h.is_special }).eq('id', h.id)
    if (!error) setRows(rows.map(r => r.id === h.id ? { ...r, is_special: !h.is_special } : r))
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const boothLabel = (b) => b === 0 ? t('booth_na') : b
  const genderIcon = (g) => g === 'M' ? '👨' : g === 'F' ? '👩' : ''

  if (loading) return <div className="center-screen">{t('loading')}</div>

  return (
    <div className="households">
      {/* tabs */}
      <div className="tabs-row">
        <button className={`seg ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>🏘️ {t('all_residents')}</button>
        {canSeeSpecial && (
          <button className={`seg ${tab === 'special' ? 'on' : ''}`} onClick={() => setTab('special')}>
            ⭐ {t('special_list')} {specialCount ? <span className="seg-count">{specialCount}</span> : null}
          </button>
        )}
      </div>

      <div className="list-toolbar">
        <input className="search" placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
        <select className="booth-filter" value={booth} onChange={e => setBooth(e.target.value)}>
          <option value="all">{t('all_booths')}</option>
          {(isAdmin ? [0, ...BOOTHS] : boothsPresent).map(b => <option key={b} value={b}>{t('booth_number')} {boothLabel(b)}</option>)}
        </select>
        {isAdmin && <button className="btn-ghost" onClick={exportExcel}>⬇ {t('export_excel')}</button>}
      </div>

      <div className="muted small count-line">{filtered.length} {t('households')}</div>

      {filtered.length === 0 ? <div className="card">{t('no_data')}</div> : filtered.map(h => (
        <div className={`card hh-card ${h.is_special ? 'special' : ''}`} key={h.id} onClick={() => setDetail(h)} role="button">
          <div className="hh-top">
            <span className="pill">{t('booth_number')} {boothLabel(h.booth_number)}{h.part_number ? ` · ${t('part_number')} ${h.part_number}` : ''}</span>
            {isAdmin && (
              <button className={`star-btn ${h.is_special ? 'on' : ''}`} title={t('mark_special')}
                onClick={e => toggleSpecial(h, e)}>{h.is_special ? '⭐' : '☆'}</button>
            )}
          </div>
          <div className="muted small addr-line">
            {[h.house_ownership && t(h.house_ownership.toLowerCase()), h.door_no, h.street, h.landmark].filter(Boolean).join(' · ')}
          </div>
          <div className="hh-tags">
            {h.ration_card && h.ration_card !== 'None' && <span className="tag">{h.ration_card}</span>}
            {(h.schemes || []).filter(s => s !== 'None').map(s => <span className="tag tag-amber" key={s}>{t(s)}</span>)}
            {(h.issues || []).filter(s => s !== 'None').map(s => <span className="tag tag-red" key={s}>{ISSUE_ICONS[s]} {t(s)}</span>)}
          </div>
          <div className="hh-voters">
            {(h.voters || []).map((v, i) => (
              <div className="voter-line" key={i}>
                {genderIcon(v.gender)} <strong>{v.name}</strong>{v.age ? `, ${v.age}` : ''} {v.voter_id ? `· ${v.voter_id}` : ''}
                {v.contact ? ` · 📞 ${v.contact}` : ''}
              </div>
            ))}
          </div>
          <div className="hh-foot muted small">
            {h.collector_name ? `${t('captured_by')}: ${h.collector_name}` : ''} · {fmtDate(h.created_at)} · {t('tap_details')}
          </div>
        </div>
      ))}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{detail.is_special ? '⭐ ' : ''}{t('booth_number')} {boothLabel(detail.booth_number)}{detail.part_number ? ` · ${t('part_number')} ${detail.part_number}` : ''}</h3>
              <button className="modal-x" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="dl"><span>{t('house_ownership')}</span><b>{detail.house_ownership ? t(detail.house_ownership.toLowerCase()) : '—'}</b></div>
              <div className="dl"><span>{t('door_no')}</span><b>{detail.door_no || '—'}</b></div>
              <div className="dl"><span>{t('street')}</span><b>{detail.street || '—'}</b></div>
              <div className="dl"><span>{t('landmark')}</span><b>{detail.landmark || '—'}</b></div>
              <div className="dl"><span>{t('ration_card')}</span><b>{detail.ration_card}</b></div>
              <div className="dl"><span>{t('schemes')}</span><b>{(detail.schemes || []).filter(s => s !== 'None').map(s => t(s)).join(', ') || '—'}</b></div>
              <div className="dl"><span>{t('issues')}</span><b>{(detail.issues || []).filter(s => s !== 'None').map(s => `${ISSUE_ICONS[s]} ${t(s)}`).join(', ') || '—'}</b></div>
              {detail.issue_note && <div className="dl"><span>{t('note_on_issues')}</span><b>{detail.issue_note}</b></div>}
              <div className="dl"><span>{t('captured_by')}</span><b>{detail.collector_name || '—'} · {fmtDate(detail.created_at)}</b></div>

              {detail.latitude && detail.longitude && (
                <div className="map-block">
                  <iframe title="map" loading="lazy"
                    src={`https://maps.google.com/maps?q=${detail.latitude},${detail.longitude}&z=16&output=embed`} />
                  <a className="btn-ghost map-open" target="_blank" rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`}>
                    🗺️ {t('open_in_maps')}
                  </a>
                </div>
              )}

              <h4 className="modal-sub">{t('voters')} ({(detail.voters || []).length})</h4>
              {(detail.voters || []).map((v, i) => (
                <div className="voter-detail" key={i}>
                  <div className="vd-name">{i + 1}. {genderIcon(v.gender)} <strong>{v.name}</strong>{v.age ? `, ${v.age}` : ''}</div>
                  <div className="muted small">{t('voter_id')}: {v.voter_id || '—'}</div>
                  <div className="muted small">
                    {t('contact')}: {v.contact ? <b>{v.contact}</b> : <span className="locked">🔒 {t('contact_hidden')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
