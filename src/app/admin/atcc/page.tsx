'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingDown, AlertTriangle, CheckCircle, Loader2, Download, Sparkles, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type AtccRecord = {
  id: string
  zone_id: string
  feeder_name: string
  period_month: string
  energy_input_kwh: number
  energy_billed_kwh: number
  energy_collected_kwh: number
  technical_loss_pct: number
  commercial_loss_pct: number
  collection_loss_pct: number
  atcc_loss_pct: number
  target_atcc_pct: number
  zone_name?: string
}

type Zone = { id: string; name: string }

const SEED_RECORDS: AtccRecord[] = [
  { id: '1', zone_id: 'a1000000-0000-0000-0000-000000000001', feeder_name: 'Abuja Central Feeder 1', period_month: '2026-04', energy_input_kwh: 595000, energy_billed_kwh: 525000, energy_collected_kwh: 505000, technical_loss_pct: 7.9, commercial_loss_pct: 3.2, collection_loss_pct: 3.8, atcc_loss_pct: 14.9, target_atcc_pct: 30, zone_name: 'Abuja Central' },
  { id: '2', zone_id: 'a1000000-0000-0000-0000-000000000002', feeder_name: 'Abuja North Feeder 1',   period_month: '2026-04', energy_input_kwh: 430000, energy_billed_kwh: 295000, energy_collected_kwh: 245000, technical_loss_pct: 12.1, commercial_loss_pct: 14.0, collection_loss_pct: 20.0, atcc_loss_pct: 46.1, target_atcc_pct: 30, zone_name: 'Abuja North' },
  { id: '3', zone_id: 'a1000000-0000-0000-0000-000000000003', feeder_name: 'Lagos Island Feeder 1',  period_month: '2026-04', energy_input_kwh: 660000, energy_billed_kwh: 600000, energy_collected_kwh: 575000, technical_loss_pct: 7.0,  commercial_loss_pct: 2.2,  collection_loss_pct: 3.8,  atcc_loss_pct: 13.0, target_atcc_pct: 30, zone_name: 'Lagos Island' },
  { id: '4', zone_id: 'a1000000-0000-0000-0000-000000000004', feeder_name: 'Lagos Mainland Feeder 1',period_month: '2026-04', energy_input_kwh: 730000, energy_billed_kwh: 615000, energy_collected_kwh: 565000, technical_loss_pct: 9.1,  commercial_loss_pct: 6.2,  collection_loss_pct: 7.4,  atcc_loss_pct: 22.7, target_atcc_pct: 30, zone_name: 'Lagos Mainland' },
  { id: '5', zone_id: 'a1000000-0000-0000-0000-000000000005', feeder_name: 'Kano North Feeder 1',   period_month: '2026-04', energy_input_kwh: 400000, energy_billed_kwh: 330000, energy_collected_kwh: 305000, technical_loss_pct: 10.2, commercial_loss_pct: 7.5,  collection_loss_pct: 7.7,  atcc_loss_pct: 25.4, target_atcc_pct: 30, zone_name: 'Kano North' },
  { id: '6', zone_id: 'a1000000-0000-0000-0000-000000000006', feeder_name: 'Kano South Feeder 1',   period_month: '2026-04', energy_input_kwh: 315000, energy_billed_kwh: 215000, energy_collected_kwh: 183000, technical_loss_pct: 13.0, commercial_loss_pct: 12.7, collection_loss_pct: 14.9, atcc_loss_pct: 40.6, target_atcc_pct: 30, zone_name: 'Kano South' },
  { id: '7', zone_id: 'a1000000-0000-0000-0000-000000000007', feeder_name: 'Port Harcourt Feeder 1',period_month: '2026-04', energy_input_kwh: 490000, energy_billed_kwh: 440000, energy_collected_kwh: 420000, technical_loss_pct: 7.5,  commercial_loss_pct: 2.4,  collection_loss_pct: 4.6,  atcc_loss_pct: 14.5, target_atcc_pct: 30, zone_name: 'Port Harcourt Central' },
  { id: '8', zone_id: 'a1000000-0000-0000-0000-000000000008', feeder_name: 'Enugu Urban Feeder 1',  period_month: '2026-04', energy_input_kwh: 355000, energy_billed_kwh: 305000, energy_collected_kwh: 285000, technical_loss_pct: 9.2,  commercial_loss_pct: 5.5,  collection_loss_pct: 6.7,  atcc_loss_pct: 21.4, target_atcc_pct: 30, zone_name: 'Enugu Urban' },
  { id: '9', zone_id: 'a1000000-0000-0000-0000-000000000009', feeder_name: 'Ibadan North Feeder 1', period_month: '2026-04', energy_input_kwh: 445000, energy_billed_kwh: 395000, energy_collected_kwh: 375000, technical_loss_pct: 8.5,  commercial_loss_pct: 3.5,  collection_loss_pct: 5.1,  atcc_loss_pct: 17.1, target_atcc_pct: 30, zone_name: 'Ibadan North' },
  { id: '10',zone_id: 'a1000000-0000-0000-0000-000000000010', feeder_name: 'Kaduna Central Feeder 1',period_month:'2026-04', energy_input_kwh: 525000, energy_billed_kwh: 465000, energy_collected_kwh: 445000, technical_loss_pct: 7.9,  commercial_loss_pct: 3.4,  collection_loss_pct: 4.2,  atcc_loss_pct: 15.5, target_atcc_pct: 30, zone_name: 'Kaduna Central' },
]

const TREND_DATA = [
  { month: 'May-25', 'Abuja North': 51.2, 'Kano South': 43.5, 'System Avg': 24.1 },
  { month: 'Jun-25', 'Abuja North': 50.0, 'Kano South': 42.8, 'System Avg': 23.8 },
  { month: 'Jul-25', 'Abuja North': 49.2, 'Kano South': 42.0, 'System Avg': 23.2 },
  { month: 'Aug-25', 'Abuja North': 48.8, 'Kano South': 41.5, 'System Avg': 22.9 },
  { month: 'Sep-25', 'Abuja North': 48.0, 'Kano South': 41.2, 'System Avg': 22.5 },
  { month: 'Oct-25', 'Abuja North': 47.8, 'Kano South': 40.9, 'System Avg': 22.3 },
  { month: 'Nov-25', 'Abuja North': 47.5, 'Kano South': 41.1, 'System Avg': 22.2 },
  { month: 'Dec-25', 'Abuja North': 47.9, 'Kano South': 41.4, 'System Avg': 22.4 },
  { month: 'Jan-26', 'Abuja North': 47.3, 'Kano South': 41.0, 'System Avg': 22.1 },
  { month: 'Feb-26', 'Abuja North': 47.2, 'Kano South': 40.8, 'System Avg': 22.0 },
  { month: 'Mar-26', 'Abuja North': 47.1, 'Kano South': 40.8, 'System Avg': 22.1 },
  { month: 'Apr-26', 'Abuja North': 46.1, 'Kano South': 40.6, 'System Avg': 21.8 },
]

function atccColor(pct: number): { bg: string; color: string } {
  if (pct < 20) return { bg: '#d1fae5', color: '#065f46' }
  if (pct <= 30) return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

function AtccBadge({ pct }: { pct: number }) {
  const { bg, color } = atccColor(pct)
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {pct.toFixed(1)}%
    </span>
  )
}

export default function AtccPage() {
  const [records, setRecords] = useState<AtccRecord[]>(SEED_RECORDS)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2026-04')
  const [runningAnalysis, setRunningAnalysis] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/atcc/records')
      if (res.ok) {
        const data = await res.json()
        if (data.records?.length > 0) setRecords(data.records)
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const runAnalysis = async () => {
    setRunningAnalysis(true)
    try {
      await fetch('/api/atcc/analyze', { method: 'POST' })
      await fetchRecords()
    } catch {
      // ignore
    } finally {
      setRunningAnalysis(false)
    }
  }

  const getAiInsight = async () => {
    setAnalyzing(true)
    setAiInsight(null)
    try {
      const worstZones = filtered.filter(r => r.atcc_loss_pct > 30)
        .sort((a, b) => b.atcc_loss_pct - a.atcc_loss_pct)
        .slice(0, 3)
      const res = await fetch('/api/atcc/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: worstZones, month: selectedMonth }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiInsight(data.insight)
      } else {
        setAiInsight(generateLocalInsight(filtered))
      }
    } catch {
      setAiInsight(generateLocalInsight(filtered))
    } finally {
      setAnalyzing(false)
    }
  }

  function generateLocalInsight(recs: AtccRecord[]): string {
    const worst = recs.filter(r => r.atcc_loss_pct > 30).sort((a, b) => b.atcc_loss_pct - a.atcc_loss_pct)
    if (worst.length === 0) return 'All feeders are performing within the NERC 30% ATC&C target. Continue monitoring trend data to sustain compliance.'
    const top = worst[0]
    return `CRITICAL: ${top.feeder_name} (${top.zone_name}) is recording ${top.atcc_loss_pct.toFixed(1)}% ATC&C loss — ${(top.atcc_loss_pct - 30).toFixed(1)} percentage points above the NERC 30% threshold. The breakdown shows technical losses at ${top.technical_loss_pct.toFixed(1)}%, commercial losses at ${top.commercial_loss_pct.toFixed(1)}%, and collection losses at ${top.collection_loss_pct.toFixed(1)}%. Recommended interventions: (1) Deploy AMI meters to eliminate commercial losses from unmetered connections; (2) Conduct physical infrastructure audit to identify transformer and line losses; (3) Engage debt recovery teams for collection loss reduction. ${worst.length > 1 ? `${worst[1].zone_name} also requires priority attention at ${worst[1].atcc_loss_pct.toFixed(1)}% ATC&C.` : ''}`
  }

  const exportCsv = () => {
    const headers = ['Feeder', 'Zone', 'Month', 'Input (kWh)', 'Billed (kWh)', 'Collected (kWh)', 'Technical %', 'Commercial %', 'Collection %', 'ATC&C %', 'Target %', 'Status']
    const rows = filtered.map(r => [
      r.feeder_name, r.zone_name || '', r.period_month,
      r.energy_input_kwh, r.energy_billed_kwh, r.energy_collected_kwh,
      r.technical_loss_pct.toFixed(1), r.commercial_loss_pct.toFixed(1), r.collection_loss_pct.toFixed(1),
      r.atcc_loss_pct.toFixed(1), r.target_atcc_pct,
      r.atcc_loss_pct > 30 ? 'ABOVE TARGET' : r.atcc_loss_pct > 20 ? 'WARNING' : 'COMPLIANT',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `atcc-report-${selectedMonth}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = records.filter(r => r.period_month === selectedMonth)
  const systemAvg = filtered.length > 0 ? filtered.reduce((s, r) => s + r.atcc_loss_pct, 0) / filtered.length : 0
  const techAvg = filtered.length > 0 ? filtered.reduce((s, r) => s + r.technical_loss_pct, 0) / filtered.length : 0
  const commAvg = filtered.length > 0 ? filtered.reduce((s, r) => s + r.commercial_loss_pct, 0) / filtered.length : 0
  const collEfficiency = filtered.length > 0 ? 100 - (filtered.reduce((s, r) => s + r.collection_loss_pct, 0) / filtered.length) : 0
  const aboveTarget = filtered.filter(r => r.atcc_loss_pct > 30).length

  const months = [...new Set(records.map(r => r.period_month))].sort().reverse()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
            ATC&C Loss Attribution
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Aggregate Technical, Commercial & Collection loss analysis — NERC compliance reporting
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runAnalysis}
            disabled={runningAnalysis}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: runningAnalysis ? 'var(--border)' : 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: runningAnalysis ? 'wait' : 'pointer' }}
          >
            {runningAnalysis ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {runningAnalysis ? 'Analysing...' : 'Run Analysis'}
          </button>
          <button
            onClick={exportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid', borderColor: selectedMonth === m ? 'var(--primary)' : 'var(--border)', background: selectedMonth === m ? 'var(--primary)' : 'var(--surface)', color: selectedMonth === m ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'System ATC&C', value: `${systemAvg.toFixed(1)}%`, sub: aboveTarget > 0 ? `${aboveTarget} zones above target` : 'All zones compliant', color: systemAvg > 30 ? 'var(--danger)' : systemAvg > 20 ? 'var(--warning)' : 'var(--success)', icon: <TrendingDown size={22} color={systemAvg > 30 ? 'var(--danger)' : systemAvg > 20 ? 'var(--warning)' : 'var(--success)'} /> },
          { label: 'Technical Losses', value: `${techAvg.toFixed(1)}%`, sub: 'Physical line & transformer', color: 'var(--primary)', icon: <TrendingDown size={22} color="var(--primary)" /> },
          { label: 'Commercial Losses', value: `${commAvg.toFixed(1)}%`, sub: 'Unmetered & theft', color: 'var(--warning)', icon: <AlertTriangle size={22} color="var(--warning)" /> },
          { label: 'Collection Efficiency', value: `${collEfficiency.toFixed(1)}%`, sub: 'Bills collected vs billed', color: 'var(--success)', icon: <CheckCircle size={22} color="var(--success)" /> },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ width: 40, height: 40, background: `${kpi.color}18`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {kpi.icon}
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: kpi.color }}>{kpi.value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>{kpi.label}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ATC&C Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)' }}>Feeder Performance — {selectedMonth}</h2>
          <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>&lt;20% Good</span>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>20–30% Amber</span>
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>&gt;30% Critical</span>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color="var(--text-secondary)" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)' }}>
                  {['Feeder / Zone', 'Input kWh', 'Billed kWh', 'Collected kWh', 'Technical %', 'Commercial %', 'Collection %', 'ATC&C %', 'vs Target'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.atcc_loss_pct - a.atcc_loss_pct).map((r, idx) => {
                  const diff = r.atcc_loss_pct - r.target_atcc_pct
                  return (
                    <tr key={r.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none', background: r.atcc_loss_pct > 30 ? '#fff5f5' : 'transparent' }}>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.feeder_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{r.zone_name}</div>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{(r.energy_input_kwh/1000).toFixed(0)}k</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{(r.energy_billed_kwh/1000).toFixed(0)}k</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{(r.energy_collected_kwh/1000).toFixed(0)}k</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: r.technical_loss_pct > 12 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: r.technical_loss_pct > 12 ? 700 : 400 }}>{r.technical_loss_pct.toFixed(1)}%</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: r.commercial_loss_pct > 10 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: r.commercial_loss_pct > 10 ? 700 : 400 }}>{r.commercial_loss_pct.toFixed(1)}%</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: r.collection_loss_pct > 15 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: r.collection_loss_pct > 15 ? 700 : 400 }}>{r.collection_loss_pct.toFixed(1)}%</td>
                      <td style={{ padding: '13px 14px' }}><AtccBadge pct={r.atcc_loss_pct} /></td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: diff > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                        {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trend Chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 className="font-sora font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>12-Month ATC&C Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={TREND_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 60]} />
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Legend />
            <Line type="monotone" dataKey="Abuja North" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Kano South" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="System Avg" stroke="#1a1f5e" strokeWidth={2} dot={false} />
            {/* NERC Target reference */}
            <Line type="monotone" dataKey={() => 30} stroke="#10b981" strokeWidth={1} strokeDasharray="6 3" dot={false} name="NERC Target (30%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)' }}>AI Analysis & Recommendations</h2>
          <button
            onClick={getAiInsight}
            disabled={analyzing}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: analyzing ? 'var(--border)' : 'var(--accent)', color: analyzing ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: analyzing ? 'wait' : 'pointer' }}
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {analyzing ? 'Analysing...' : 'Generate AI Insight'}
          </button>
        </div>
        {aiInsight ? (
          <div style={{ background: 'rgba(26,31,94,0.04)', borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {aiInsight}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Click "Generate AI Insight" to get a plain-English explanation of the worst-performing feeders and recommended interventions, suitable for NERC submission and World Bank evaluators.
          </p>
        )}
      </div>
    </div>
  )
}
