import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import { useI18n } from '../i18n'
import { supabase } from '../supabaseClient'
import { BOOTHS, SCHEMES, ISSUES } from '../constants'

const COLORS = ['#0b6e4f', '#f4a300', '#1f77b4', '#d62728', '#9467bd', '#17becf']

export default function Dashboard() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [households, setHouseholds] = useState([])
  const [voters, setVoters] = useState([])
  const [people, setPeople] = useState({}) // userId -> name

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: hh }, { data: v }, { data: pr }] = await Promise.all([
        supabase.from('households').select('id, booth_number, ration_card, schemes, issues, collected_by, created_at'),
        supabase.from('voters').select('id, household_id'),
        supabase.from('profiles').select('id, full_name')
      ])
      setHouseholds(hh || [])
      setVoters(v || [])
      const map = {}; (pr || []).forEach(p => { map[p.id] = p.full_name || '—' })
      setPeople(map)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="center-screen">{t('loading')}</div>

  // ---- aggregates ----
  const byBooth = BOOTHS.map(b => ({ name: String(b), value: households.filter(h => h.booth_number === b).length }))
  const ration = ['APL', 'BPL', 'None'].map(r => ({ name: r, value: households.filter(h => h.ration_card === r).length }))
  const schemeCov = SCHEMES.map(s => ({ name: t(s), value: households.filter(h => (h.schemes || []).includes(s)).length }))
  const issueCounts = ISSUES.map(s => ({ name: t(s), value: households.filter(h => (h.issues || []).includes(s)).length }))
  const byCollector = Object.entries(
    households.reduce((acc, h) => { const k = h.collected_by || 'unknown'; acc[k] = (acc[k] || 0) + 1; return acc }, {})
  ).map(([id, count]) => ({ name: people[id] || '—', value: count })).sort((a, b) => b.value - a.value)

  function exportExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byBooth.map(r => ({ Booth: r.name, Households: r.value }))), 'By Booth')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ration.map(r => ({ RationCard: r.name, Households: r.value }))), 'Ration')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schemeCov.map(r => ({ Scheme: r.name, Households: r.value }))), 'Schemes')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issueCounts.map(r => ({ Issue: r.name, Households: r.value }))), 'Issues')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byCollector.map(r => ({ Worker: r.name, Households: r.value }))), 'Team')
    XLSX.writeFile(wb, 'mathikere-ward-summary.xlsx')
  }

  return (
    <div className="dashboard">
      <div className="stat-row">
        <div className="stat"><div className="stat-num">{households.length}</div><div className="stat-lbl">{t('total_households')}</div></div>
        <div className="stat"><div className="stat-num">{voters.length}</div><div className="stat-lbl">{t('total_voters')}</div></div>
        <button className="btn-ghost export-btn" onClick={exportExcel}>⬇ {t('export_excel')}</button>
      </div>

      {households.length === 0 ? <div className="card">{t('no_data')}</div> : (
        <>
          <div className="card">
            <h3>{t('by_booth')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byBooth}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} />
                <Tooltip /><Bar dataKey="value" fill="#0b6e4f" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-grid">
            <div className="card">
              <h3>{t('ration_split')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={ration} dataKey="value" nameKey="name" outerRadius={70} label>
                  {ration.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>{t('scheme_coverage')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={schemeCov} layout="vertical"><XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={90} fontSize={11} /><Tooltip />
                  <Bar dataKey="value" fill="#f4a300" radius={[0,4,4,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>{t('issues_reported')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={issueCounts}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip /><Bar dataKey="value" fill="#d62728" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>{t('collector_activity')}</h3>
              <table className="mini-table">
                <tbody>{byCollector.map((r, i) => (
                  <tr key={i}><td>{r.name}</td><td className="num">{r.value}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
