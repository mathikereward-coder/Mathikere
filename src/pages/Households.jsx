import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useI18n } from '../i18n'
import { supabase } from '../supabaseClient'

export default function Households() {
  const { t } = useI18n()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data } = await supabase
        .from('households')
        .select('id, booth_number, part_number, door_no, street, landmark, ration_card, schemes, issues, issue_note, created_at, voters(name, age, voter_id, contact)')
        .order('created_at', { ascending: false })
        .limit(2000)
      setRows(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(h =>
      (h.voters || []).some(v =>
        (v.name || '').toLowerCase().includes(s) ||
        (v.voter_id || '').toLowerCase().includes(s) ||
        (v.contact || '').includes(s)
      ) || String(h.booth_number).includes(s)
    )
  }, [rows, q])

  function exportExcel() {
    const flat = []
    filtered.forEach(h => (h.voters || []).forEach(v => flat.push({
      Booth: h.booth_number, Part: h.part_number, Door: h.door_no, Street: h.street, Landmark: h.landmark,
      RationCard: h.ration_card, Schemes: (h.schemes || []).join(', '), Issues: (h.issues || []).join(', '),
      IssueNote: h.issue_note, VoterName: v.name, Age: v.age, VoterID: v.voter_id, Contact: v.contact
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), 'Voters')
    XLSX.writeFile(wb, 'mathikere-ward-voters.xlsx')
  }

  if (loading) return <div className="center-screen">{t('loading')}</div>

  return (
    <div className="households">
      <div className="list-toolbar">
        <input className="search" placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn-ghost" onClick={exportExcel}>⬇ {t('export_excel')}</button>
      </div>
      {filtered.length === 0 ? <div className="card">{t('no_data')}</div> : filtered.map(h => (
        <div className="card hh-card" key={h.id}>
          <div className="hh-top">
            <span className="pill">Booth {h.booth_number}{h.part_number ? ` · Part ${h.part_number}` : ''}</span>
            <span className="muted">{[h.door_no, h.street, h.landmark].filter(Boolean).join(', ')}</span>
          </div>
          <div className="hh-tags">
            {h.ration_card && h.ration_card !== 'None' && <span className="tag">{h.ration_card}</span>}
            {(h.schemes || []).map(s => <span className="tag tag-amber" key={s}>{t(s)}</span>)}
            {(h.issues || []).map(s => <span className="tag tag-red" key={s}>{t(s)}</span>)}
          </div>
          <div className="hh-voters">
            {(h.voters || []).map((v, i) => (
              <div className="voter-line" key={i}>
                <strong>{v.name}</strong>{v.age ? `, ${v.age}` : ''} {v.voter_id ? `· ${v.voter_id}` : ''} {v.contact ? `· ${v.contact}` : ''}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
