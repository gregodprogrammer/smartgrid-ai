'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Download, AlertTriangle, TrendingDown, Activity, Zap, Loader2 } from 'lucide-react'

type EnergyRow = {
  id: string
  asset_name: string
  zone_name: string
  zone_id: string
  energy_injected_kwh: number
  energy_consumed_kwh: number
  loss_percent: number
  load_kw: number
  reading_date: string
}

const SEED_DATA: EnergyRow[] = [
  { id: 'e1', asset_name: 'Transformer T1-CBD', zone_name: 'Abuja Central', zone_id: 'z1', energy_injected_kwh: 12400, energy_consumed_kwh: 10850, loss_percent: 12.5, load_kw: 2100, reading_date: '2026-05-01' },
  { id: 'e2', asset_name: 'Transformer T2-North', zone_name: 'Abuja North', zone_id: 'z2', energy_injected_kwh: 8900, energy_consumed_kwh: 6800, loss_percent: 23.6, load_kw: 1450, reading_date: '2026-05-01' },
  { id: 'e3', asset_name: 'Feeder F1-Island', zone_name: 'Lagos Island', zone_id: 'z3', energy_injected_kwh: 21500, energy_consumed_kwh: 19800, loss_percent: 7.9, load_kw: 4200, reading_date: '2026-05-01' },
  { id: 'e4', asset_name: 'Transformer T4-Kano', zone_name: 'Kano North', zone_id: 'z4', energy_injected_kwh: 15200, energy_consumed_kwh: 12900, loss_percent: 15.1, load_kw: 2800, reading_date: '2026-05-01' },
  { id: 'e5', asset_name: 'Feeder F5-PH', zone_name: 'Port Harcourt', zone_id: 'z5', energy_injected_kwh: 9800, energy_consumed_kwh: 9100, loss_percent: 7.1, load_kw: 1900, reading_date: '2026-05-01' },
  { id: 'e6', asset_name: 'Transformer T6-Ibadan', zone_name: 'Ibadan Metro', zone_id: 'z6', energy_injected_kwh: 13600, energy_consumed_kwh: 11200, loss_percent: 17.6, load_kw: 2300, reading_date: '2026-05-01' },
  { id: 'e7', asset_name: 'Feeder F7-Enugu', zone_name: 'Enugu Central', zone_id: 'z7', energy_injected_kwh: 7200, energy_consumed_kwh: 6850, loss_percent: 4.9, load_kw: 1400, reading_date: '2026-05-01' },
  { id: 'e8', asset_name: 'Transformer T8-Benin', zone_name: 'Benin City', zone_id: 'z8', energy_injected_kwh: 6500, energy_consumed_kwh: 4800, loss_percent: 26.2, load_kw: 980, reading_date: '2026-05-01' },
  { id: 'e9', asset_name: 'Feeder F9-Kaduna', zone_name: 'Kaduna South', zone_id: 'z9', energy_injected_kwh: 11000, energy_consumed_kwh: 10200, loss_percent: 7.3, load_kw: 2050, reading_date: '2026-05-01' },
  { id: 'e10', asset_name: 'Transformer T10-Maid', zone_name: 'Maiduguri', zone_id: 'z10', energy_injected_kwh: 4800, energy_consumed_kwh: 4200, loss_percent: 12.5, load_kw: 850, reading_date: '2026-05-01' },
]

function getLossColor(loss: number): { bg: string; color: string } {
  if (loss > 15) return { bg: '#fee2e2', color: '#991b1b' }
  if (loss > 8) return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#d1fae5', color: '#065f46' }
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const loss = payload[0]?.value
  const lc = getLossColor(loss)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13 }}>
        Loss: <span style={{ color: lc.color, fontWeight: 700 }}>{loss?.toFixed(1)}%</span>
      </p>
    </div>
  )
}

export default function EnergyBalancePage() {
  const [data, setData] = useState<EnergyRow[]>(SEED_DATA)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo] = useState('2026-05-05')
  const [sortBy, setSortBy] = useState<'loss' | 'load' | 'zone'>('loss')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/energy-balance?from=${dateFrom}&to=${dateTo}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) setData(json.data)
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'loss') return b.loss_percent - a.loss_percent
    if (sortBy === 'load') return b.load_kw - a.load_kw
    return a.zone_name.localeCompare(b.zone_name)
  })

  const critical = data.filter(d => d.loss_percent > 15).sort((a, b) => b.loss_percent - a.loss_percent)
  const totalInjected = data.reduce((s, d) => s + d.energy_injected_kwh, 0)
  const totalConsumed = data.reduce((s, d) => s + d.energy_consumed_kwh, 0)
  const avgLoss = data.length > 0 ? data.reduce((s, d) => s + d.loss_percent, 0) / data.length : 0

  const exportCSV = () => {
    const header = 'Asset,Zone,Injected (kWh),Consumed (kWh),Loss (%),Load (kW)\n'
    const rows = sorted.map(d => `"${d.asset_name}","${d.zone_name}",${d.energy_injected_kwh},${d.energy_consumed_kwh},${d.loss_percent.toFixed(1)},${d.load_kw}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `energy-balance-${dateFrom}-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Energy Balance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Technical and commercial loss monitoring per transformer/feeder</p>
        </div>
        <button
          onClick={exportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Injected', value: `${(totalInjected / 1000).toFixed(1)} MWh`, icon: <Zap size={20} color="var(--primary)" />, bg: 'rgba(26,31,94,0.08)' },
          { label: 'Total Consumed', value: `${(totalConsumed / 1000).toFixed(1)} MWh`, icon: <Activity size={20} color="var(--success)" />, bg: '#d1fae5' },
          { label: 'Total Loss', value: `${((totalInjected - totalConsumed) / 1000).toFixed(1)} MWh`, icon: <TrendingDown size={20} color="var(--warning)" />, bg: '#fef3c7' },
          { label: 'Avg Loss Rate', value: `${avgLoss.toFixed(1)}%`, icon: <AlertTriangle size={20} color={avgLoss > 15 ? 'var(--danger)' : 'var(--warning)'} />, bg: avgLoss > 15 ? '#fee2e2' : '#fef3c7' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ width: 40, height: 40, background: kpi.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {kpi.icon}
            </div>
            <p className="font-sora font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Sort:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13 }}>
            <option value="loss">Highest Loss</option>
            <option value="load">Highest Load</option>
            <option value="zone">Zone Name</option>
          </select>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 className="font-sora font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
          Loss % by Transformer/Feeder
        </h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="asset_name"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} unit="%" domain={[0, 35]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '15% critical', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '8% warning', fill: '#f59e0b', fontSize: 10 }} />
              <Bar
                dataKey="loss_percent"
                radius={[4, 4, 0, 0]}
                fill="var(--primary)"
                label={false}
                // Color cells dynamically via cell component
              >
                {sorted.map((entry, index) => {
                  const color = entry.loss_percent > 15 ? '#ef4444' : entry.loss_percent > 8 ? '#f59e0b' : '#10b981'
                  return <rect key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-sora font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Energy Balance Data</h2>
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Loader2 size={24} className="animate-spin" color="var(--text-secondary)" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--background)' }}>
                    {['Asset', 'Zone', 'Injected (kWh)', 'Consumed (kWh)', 'Loss %', 'Load (kW)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => {
                    const lc = getLossColor(row.loss_percent)
                    return (
                      <tr key={row.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.asset_name}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.zone_name}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{row.energy_injected_kwh.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{row.energy_consumed_kwh.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ background: lc.bg, color: lc.color, padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                            {row.loss_percent.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{row.load_kw.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Priority List */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, height: 'fit-content' }}>
          <h2 className="font-sora font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            Field Intervention Priority
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Assets with loss &gt; 15% — requires immediate inspection
          </p>
          {critical.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              No critical losses detected
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {critical.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    padding: '12px 14px',
                    background: '#fff5f5',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    borderLeft: '3px solid var(--danger)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        #{idx + 1} — {row.asset_name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.zone_name}</p>
                    </div>
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {row.loss_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Lost: {(row.energy_injected_kwh - row.energy_consumed_kwh).toLocaleString()} kWh · Load: {row.load_kw.toLocaleString()} kW
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
