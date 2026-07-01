import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabaseClient'
import { BOOTHS } from '../constants'

export default function Households() {
  const { t } = useI18n()
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [booth, setBooth] = useState('all')
  const [detail, setDetail] = useState(null) // household object shown in modal

  useEffect(() => {
    (async () => {
      setLoading(true)
      // Secure RPC: returns only households the caller may see, with mobile masked
      // (null) unless admin or the worker was granted permission.
      const { data, error } = await supabase.rpc('list_households_visible')
      if (error) console.warn(error.message)
      setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const boothsPresent = useMemo(
    () => Array.from(new Set(rows.map(r => r.booth_number))).sort((a, b) => a - b),
    [rows]
  )

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(h => {
      if (booth !== 'all' && h.booth_number !== Number(booth)) return false
      if (!s) return true
      return (h.voters || []).some(v =>
        (v.name || '').toLowerCase().includes(s) ||
        (v.voter_id || '').toLowerCase().includes(s) ||
        (v.contact || '').includes(s)
      ) || String(h.booth_number).includes(s)
    })
  }, [rows, q, booth])

  function exportExcel() {
    const flat = []
    filtered.forEach(h => (h.voters || []).forEach(v => flat.push({
      Booth: h.booth_number, Part: h.part_number, Door: h.door_no, Street: h.street, Landmark: h.landmark,
      RationCard: h.ration_card, Schemes: (h.schemes || []).join(', '), Issues: (h.issues || []).join(', '),
      IssueNote: h.issue_note, VoterName: v.name, Age: v.age, VoterID: v.voter_id, Contact: v.contact,
      CapturedBy: h.collector_name
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), 'Voters')
    XLSX.writeFile(wb, 'mathikere-ward-voters.xlsx')
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  if (loading) return <div className="center-screen">{t('loading')}</div>

  return (
    <div className="households">
      <div className="list-toolbar">
        <input className="search" placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
        <select className="booth-filter" value={booth} onChange={e => setBooth(e.target.value)}>
          <option value="all">{t('all_booths')}</option>
          {(isAdmin ? BOOTHS : boothsPresent).map(b => <option key={b} value={b}>{t('booth_number')} {b}</option>)}
        </select>
        {isAdmin && <button className="btn-ghost" onClick={exportExcel}>⬇ {t('export_excel')}</button>}
      </div>

      <div className="muted small count-line">{filtered.length} {t('households')}</div>

      {filtered.length === 0 ? <div className="card">{t('no_data')}</div> : filtered.map(h => (
        <div className="card hh-card" key={h.id} onClick={() => setDetail(h)} role="button">
          <div className="hh-top">
            <span className="pill">{t('booth_number')} {h.booth_number}{h.part_number ? ` · ${t('part_number')} ${h.part_number}` : ''}</span>
            <span className="muted small">{[h.door_no, h.street, h.landmark].filter(Boolean).join(', ')}</span>
          </div>
          <div className="hh-tags">
            {h.ration_card && h.ration_card !== 'None' && <span className="tag">{h.ration_card}</span>}
            {(h.schemes || []).map(s => <span className="tag tag-amber" key={s}>{t(s)}</span>)}
            {(h.issues || []).map(s => <span className="tag tag-red" key={s}>{t(s)}</span>)}
          </div>
          <div className="hh-voters">
            {(h.voters || []).map((v, i) => (
              <div className="voter-line" key={i}>
                <strong>{v.name}</strong>{v.age ? `, ${v.age}` : ''} {v.voter_id ? `· ${v.voter_id}` : ''}
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
              <h3>{t('booth_number')} {detail.booth_number}{detail.part_number ? ` · ${t('part_number')} ${detail.part_number}` : ''}</h3>
              <button className="modal-x" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="dl"><span>{t('door_no')}</span><b>{detail.door_no || '—'}</b></div>
              <div className="dl"><span>{t('street')}</span><b>{detail.street || '—'}</b></div>
              <div className="dl"><span>{t('landmark')}</span><b>{detail.landmark || '—'}</b></div>
              <div className="dl"><span>{t('ration_card')}</span><b>{detail.ration_card}</b></div>
              <div className="dl"><span>{t('schemes')}</span><b>{(detail.schemes || []).map(s => t(s)).join(', ') || '—'}</b></div>
              <div className="dl"><span>{t('issues')}</span><b>{(detail.issues || []).map(s => t(s)).join(', ') || '—'}</b></div>
              {detail.issue_note && <div className="dl"><span>{t('issue_note')}</span><b>{detail.issue_note}</b></div>}
              <div className="dl"><span>{t('captured_by')}</span><b>{detail.collector_name || '—'} · {fmtDate(detail.created_at)}</b></div>

              <h4 className="modal-sub">{t('voters')} ({(detail.voters || []).length})</h4>
              {(detail.voters || []).map((v, i) => (
                <div className="voter-detail" key={i}>
                  <div className="vd-name">{i + 1}. <strong>{v.name}</strong>{v.age ? `, ${v.age}` : ''}</div>
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
