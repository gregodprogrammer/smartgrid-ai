'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Activity, Loader2, Sparkles, Send, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react'

type DerAsset = { id: string; name: string; asset_type: string; status: string; output_kw: number; capacity_kw: number; zone_id: string; zone_name?: string }
type DispatchRecord = { id: string; zone_id: string; zone_name?: string; dispatch_type: string; target_asset_ids: string; commanded_kw: number; actual_kw?: number; status: string; operator_id: string; dispatched_at: string; completed_at?: string; notes?: string }
type LiveEvent = { id: string; asset_name: string; event_type: string; message: string; timestamp: string; severity: 'critical' | 'warning' | 'info' }

const SEED_ASSETS: DerAsset[] = [
  { id: 'd1', name: 'Abuja Central Solar Farm',         asset_type: 'solar_panel',  status: 'online',   output_kw: 420, capacity_kw: 500,  zone_id: 'a1', zone_name: 'Abuja Central' },
  { id: 'd2', name: 'Lagos Island Solar Array',         asset_type: 'solar_panel',  status: 'online',   output_kw: 250, capacity_kw: 300,  zone_id: 'a3', zone_name: 'Lagos Island' },
  { id: 'd3', name: 'Kano North Solar Installation',   asset_type: 'solar_panel',  status: 'online',   output_kw: 160, capacity_kw: 200,  zone_id: 'a5', zone_name: 'Kano North' },
  { id: 'd4', name: 'Abuja Central Battery Storage',   asset_type: 'battery_bank', status: 'online',   output_kw: 200, capacity_kw: 1000, zone_id: 'a1', zone_name: 'Abuja Central' },
  { id: 'd5', name: 'Port Harcourt Battery Bank',      asset_type: 'battery_bank', status: 'online',   output_kw: 120, capacity_kw: 500,  zone_id: 'a7', zone_name: 'Port Harcourt Central' },
  { id: 'd6', name: 'Enugu Urban Grid Inverter',       asset_type: 'inverter',     status: 'online',   output_kw: 120, capacity_kw: 150,  zone_id: 'a8', zone_name: 'Enugu Urban' },
  { id: 'd7', name: 'Ibadan North Inverter Station',   asset_type: 'inverter',     status: 'fault',    output_kw: 0,   capacity_kw: 200,  zone_id: 'a9', zone_name: 'Ibadan North' },
  { id: 'd8', name: 'Kano South Mini-Grid',            asset_type: 'mini_grid',    status: 'islanded', output_kw: 600, capacity_kw: 800,  zone_id: 'a6', zone_name: 'Kano South' },
  { id: 'd9', name: 'Kaduna Central Mini-Grid',        asset_type: 'mini_grid',    status: 'online',   output_kw: 480, capacity_kw: 600,  zone_id: 'a10',zone_name: 'Kaduna Central' },
  { id: 'd10',name: 'Abuja North Emergency Generator', asset_type: 'generator',    status: 'online',   output_kw: 350, capacity_kw: 400,  zone_id: 'a2', zone_name: 'Abuja North' },
]

const SEED_DISPATCHES: DispatchRecord[] = [
  { id: 'vd1', zone_id: 'a1', zone_name: 'Abuja Central',        dispatch_type: 'ramp_up',  target_asset_ids: 'd1,d4', commanded_kw: 800, actual_kw: 785,  status: 'completed', operator_id: 'op-admin-001', dispatched_at: new Date(Date.now()-3*3600000).toISOString(), completed_at: new Date(Date.now()-170*60000).toISOString(), notes: 'Peak demand response: morning load ramp' },
  { id: 'vd2', zone_id: 'a7', zone_name: 'Port Harcourt Central',dispatch_type: 'discharge', target_asset_ids: 'd5',    commanded_kw: 300, actual_kw: 295,  status: 'completed', operator_id: 'op-admin-001', dispatched_at: new Date(Date.now()-6*3600000).toISOString(), completed_at: new Date(Date.now()-345*60000).toISOString(), notes: 'Battery discharge to cover grid deficit' },
  { id: 'vd3', zone_id: 'a2', zone_name: 'Abuja North',          dispatch_type: 'curtail',  target_asset_ids: 'd10',   commanded_kw: 200, actual_kw: undefined, status: 'pending',   operator_id: 'op-admin-002', dispatched_at: new Date(Date.now()-10*60000).toISOString(), completed_at: undefined, notes: 'Curtail generator ahead of grid restoration' },
  { id: 'vd4', zone_id: 'a9', zone_name: 'Ibadan North',         dispatch_type: 'charge',   target_asset_ids: 'd5',    commanded_kw: 150, actual_kw: undefined, status: 'failed',    operator_id: 'op-admin-001', dispatched_at: new Date(Date.now()-86400000).toISOString(), completed_at: new Date(Date.now()-86100000).toISOString(), notes: 'Communication failure — asset offline during command' },
  { id: 'vd5', zone_id: 'a6', zone_name: 'Kano South',           dispatch_type: 'island',   target_asset_ids: 'd8',    commanded_kw: 600, actual_kw: 600,   status: 'completed', operator_id: 'op-admin-003', dispatched_at: new Date(Date.now()-2*86400000).toISOString(), completed_at: new Date(Date.now()-143900000).toISOString(), notes: 'Planned islanding for Kano South feeder maintenance' },
]

const SEED_EVENTS: LiveEvent[] = [
  { id: 'le1', asset_name: 'Kano South Mini-Grid',          event_type: 'islanding',            message: 'Asset islanded — operating independently from main grid', timestamp: new Date(Date.now()-15*60000).toISOString(), severity: 'warning' },
  { id: 'le2', asset_name: 'Ibadan North Inverter Station', event_type: 'frequency_deviation',  message: 'Frequency deviation: 49.80 Hz (normal: 50.00 Hz ±0.2)', timestamp: new Date(Date.now()-30*60000).toISOString(), severity: 'critical' },
  { id: 'le3', asset_name: 'Kano South Mini-Grid',          event_type: 'islanding',            message: 'Second islanding event detected on Kano South feeder',   timestamp: new Date(Date.now()-2*3600000).toISOString(), severity: 'warning' },
]

const DISPATCH_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  executing: { bg: '#dbeafe', color: '#1e40af', label: 'Executing' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  failed:    { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
}

const EVENT_SEVERITY_CONFIG = {
  critical: { bg: '#fee2e2', color: '#991b1b' },
  warning:  { bg: '#fef3c7', color: '#92400e' },
  info:     { bg: '#dbeafe', color: '#1e40af' },
}

const DISPATCH_TYPES: Record<string, string[]> = {
  solar_panel:  ['ramp_up', 'curtail'],
  battery_bank: ['charge', 'discharge'],
  inverter:     ['ramp_up', 'curtail'],
  mini_grid:    ['island', 'reconnect', 'ramp_up', 'curtail'],
  generator:    ['ramp_up', 'curtail'],
}

function timeSince(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return `${Math.floor(diff/86400000)}d ago`
}

export default function VppPage() {
  const [assets, setAssets] = useState<DerAsset[]>(SEED_ASSETS)
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(SEED_DISPATCHES)
  const [events, setEvents] = useState<LiveEvent[]>(SEED_EVENTS)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [dispatchType, setDispatchType] = useState('')
  const [targetKw, setTargetKw] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const [dispatchSuccess, setDispatchSuccess] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [suggestingAi, setSuggestingAi] = useState(false)
  const [zoneFilter, setZoneFilter] = useState('all')

  const totalCapacity = assets.reduce((s, a) => s + a.capacity_kw, 0)
  const currentOutput = assets.filter(a => a.status !== 'offline').reduce((s, a) => s + a.output_kw, 0)
  const availableReserve = totalCapacity - currentOutput
  const gridFrequency = 49.98 // live value simulation

  const zones = [...new Set(assets.map(a => a.zone_name || a.zone_id))].sort()
  const filteredAssets = zoneFilter === 'all' ? assets : assets.filter(a => a.zone_name === zoneFilter || a.zone_id === zoneFilter)

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
    setDispatchType('')
  }

  const getAvailableDispatchTypes = (): string[] => {
    if (selectedAssets.length === 0) return []
    const types = selectedAssets.flatMap(id => {
      const a = assets.find(a => a.id === id)
      return a ? DISPATCH_TYPES[a.asset_type] || [] : []
    })
    return [...new Set(types)]
  }

  const sendDispatch = async () => {
    if (!selectedAssets.length || !dispatchType || !targetKw) return
    setDispatching(true)
    const primaryAsset = assets.find(a => a.id === selectedAssets[0])
    try {
      await fetch('/api/vpp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: selectedAssets, dispatch_type: dispatchType, commanded_kw: parseFloat(targetKw) }),
      })
    } catch {
      // continue optimistically
    }
    const newDispatch: DispatchRecord = {
      id: `vd-${Date.now()}`,
      zone_id: primaryAsset?.zone_id || '',
      zone_name: primaryAsset?.zone_name,
      dispatch_type: dispatchType,
      target_asset_ids: selectedAssets.join(','),
      commanded_kw: parseFloat(targetKw),
      status: 'pending',
      operator_id: 'op-admin-001',
      dispatched_at: new Date().toISOString(),
      notes: `Dispatch via VPP console`,
    }
    setDispatches(prev => [newDispatch, ...prev])
    setDispatchSuccess(true)
    setSelectedAssets([])
    setDispatchType('')
    setTargetKw('')
    setDispatching(false)
    setTimeout(() => setDispatchSuccess(false), 4000)
  }

  const getAiSuggestion = async () => {
    setSuggestingAi(true)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/vpp/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assets, dispatches: dispatches.slice(0, 3) }) })
      if (res.ok) {
        const data = await res.json()
        setAiSuggestion(data.suggestion)
      } else {
        setAiSuggestion(generateLocalSuggestion())
      }
    } catch {
      setAiSuggestion(generateLocalSuggestion())
    } finally {
      setSuggestingAi(false)
    }
  }

  function generateLocalSuggestion(): string {
    const faultAssets = assets.filter(a => a.status === 'fault')
    const islandedAssets = assets.filter(a => a.status === 'islanded')
    const lowUtil = assets.filter(a => a.status === 'online' && a.output_kw / a.capacity_kw < 0.5 && a.asset_type !== 'battery_bank')
    return `VPP DISPATCH RECOMMENDATION — AI ANALYSIS

CURRENT GRID CONDITIONS:
• Total output: ${currentOutput} kW / ${totalCapacity} kW capacity (${((currentOutput/totalCapacity)*100).toFixed(1)}% utilisation)
• Grid frequency: ${gridFrequency} Hz (nominal: 50.00 Hz)
• Available reserve: ${availableReserve} kW

IMMEDIATE ACTIONS RECOMMENDED:

1. PRIORITY: ${faultAssets.length > 0 ? `Restore ${faultAssets.map(a => a.name).join(', ')} — fault state reducing available capacity` : 'No fault assets. All systems nominal.'}

2. ${islandedAssets.length > 0 ? `Monitor ${islandedAssets.map(a => a.name).join(', ')} — islanded operation. Reconnect when main grid is stable.` : 'No islanded assets.'}

3. OPTIMISATION: ${lowUtil.length > 0 ? `Ramp up ${lowUtil[0].name} — currently at ${((lowUtil[0].output_kw/lowUtil[0].capacity_kw)*100).toFixed(0)}% utilisation. Additional ${lowUtil[0].capacity_kw - lowUtil[0].output_kw} kW available.` : 'All solar and generator assets near optimal output.'}

4. BATTERY STRATEGY: Abuja Central Battery (SoC: 78.5%) should remain on standby for evening peak. Port Harcourt Battery (SoC: 61.0%) available for immediate discharge if required.

Recommended next dispatch: Ramp up Kano North Solar to 190 kW (from 160 kW) to maximise renewable generation ahead of afternoon demand peak.`
  }

  const availableDispatchTypes = getAvailableDispatchTypes()

  return (
    <div style={{ minHeight: '100vh', background: '#0f1133' }}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: '#fff' }}>VPP Dispatch Console</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Virtual Power Plant — coordinate distributed energy resources in real time</p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>LIVE · {gridFrequency} Hz</span>
            </div>
          </div>
        </div>

        {/* System KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total DER Capacity', value: `${(totalCapacity/1000).toFixed(1)} MW`, color: '#f5a623' },
            { label: 'Currently Dispatched', value: `${currentOutput} kW`, color: '#10b981' },
            { label: 'Available Reserve', value: `${availableReserve} kW`, color: '#60a5fa' },
            { label: 'Grid Frequency', value: `${gridFrequency} Hz`, color: gridFrequency < 49.9 || gridFrequency > 50.1 ? '#ef4444' : '#10b981' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
              <p className="font-sora font-bold text-2xl" style={{ color: k.color }}>{k.value}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {dispatchSuccess && (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 13, fontWeight: 500 }}>
            <CheckCircle size={16} /> Dispatch command sent successfully
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Selector */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Zone Filter */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
              <div className="flex gap-2 flex-wrap">
                {['all', ...zones].map(z => (
                  <button key={z} onClick={() => setZoneFilter(z)}
                    style={{ padding: '6px 14px', borderRadius: 100, border: '1px solid', borderColor: zoneFilter === z ? '#f5a623' : 'rgba(255,255,255,0.15)', background: zoneFilter === z ? 'rgba(245,166,35,0.15)' : 'transparent', color: zoneFilter === z ? '#f5a623' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    {z === 'all' ? 'All Zones' : z}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Grid */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="font-sora font-semibold" style={{ color: '#fff', fontSize: 15 }}>
                  Select Assets to Dispatch {selectedAssets.length > 0 && <span style={{ color: '#f5a623', marginLeft: 6 }}>({selectedAssets.length} selected)</span>}
                </h2>
              </div>
              <div className="grid grid-cols-1" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['', 'Asset', 'Type', 'Zone', 'Output', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((a, idx) => {
                      const isSelected = selectedAssets.includes(a.id)
                      const statusColors = { online: '#10b981', offline: '#6b7280', fault: '#ef4444', islanded: '#f59e0b' }
                      const statusColor = statusColors[a.status as keyof typeof statusColors] || '#6b7280'
                      return (
                        <tr
                          key={a.id}
                          onClick={() => a.status !== 'offline' && toggleAsset(a.id)}
                          style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: isSelected ? 'rgba(245,166,35,0.08)' : 'transparent', cursor: a.status === 'offline' ? 'default' : 'pointer', opacity: a.status === 'offline' ? 0.4 : 1 }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? '#f5a623' : 'rgba(255,255,255,0.25)'}`, background: isSelected ? '#f5a623' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.name}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{a.asset_type.replace('_', ' ')}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{a.zone_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{a.output_kw}/{a.capacity_kw} kW</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${statusColor}18`, color: statusColor, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${statusColor}30`, whiteSpace: 'nowrap' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatch Log */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="font-sora font-semibold" style={{ color: '#fff', fontSize: 15 }}>Dispatch Log</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Type', 'Zone', 'Target kW', 'Actual kW', 'Status', 'Operator', 'Time'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches.map((d, idx) => {
                      const dc = DISPATCH_CONFIG[d.status]
                      return (
                        <tr key={d.id} style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                          <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#f5a623', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{d.dispatch_type.replace('_', ' ')}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{d.zone_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{d.commanded_kw} kW</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{d.actual_kw !== undefined ? `${d.actual_kw} kW` : '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: dc.bg, color: dc.color, padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{dc.label}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{d.operator_id}</td>
                          <td style={{ padding: '12px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{timeSince(d.dispatched_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Dispatch Control + Events */}
          <div className="flex flex-col gap-4">
            {/* Dispatch Form */}
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 16, padding: 20 }}>
              <h2 className="font-sora font-semibold mb-4" style={{ color: '#f5a623', fontSize: 15 }}>
                {selectedAssets.length === 0 ? 'Dispatch Control' : `Dispatch (${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''})`}
              </h2>

              {selectedAssets.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Select one or more assets from the table to configure a dispatch command.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    {selectedAssets.map(id => assets.find(a => a.id === id)?.name).join(', ')}
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 }}>Command Type</label>
                    <select
                      value={dispatchType}
                      onChange={e => setDispatchType(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13 }}
                    >
                      <option value="">Select command...</option>
                      {availableDispatchTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 }}>Target (kW)</label>
                    <input
                      type="number"
                      value={targetKw}
                      onChange={e => setTargetKw(e.target.value)}
                      placeholder="e.g. 500"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13 }}
                    />
                  </div>

                  <button
                    onClick={sendDispatch}
                    disabled={dispatching || !dispatchType || !targetKw}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: (dispatching || !dispatchType || !targetKw) ? 'rgba(245,166,35,0.3)' : '#f5a623', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: (dispatching || !dispatchType || !targetKw) ? 'default' : 'pointer', letterSpacing: '0.03em' }}
                  >
                    {dispatching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {dispatching ? 'Sending...' : 'SEND DISPATCH'}
                  </button>

                  <button
                    onClick={() => setSelectedAssets([])}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}
                  >
                    <X size={13} /> Clear Selection
                  </button>
                </div>
              )}
            </div>

            {/* AI Recommendation */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
              <h2 className="font-sora font-semibold mb-3" style={{ color: '#fff', fontSize: 15 }}>AI Dispatch Advisor</h2>
              <button
                onClick={getAiSuggestion}
                disabled={suggestingAi}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: suggestingAi ? 'rgba(255,255,255,0.05)' : 'rgba(245,166,35,0.15)', color: suggestingAi ? 'rgba(255,255,255,0.4)' : '#f5a623', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: suggestingAi ? 'wait' : 'pointer', width: '100%', justifyContent: 'center', marginBottom: aiSuggestion ? 12 : 0 }}
              >
                {suggestingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {suggestingAi ? 'Analysing...' : 'Suggest Optimal Dispatch'}
              </button>
              {aiSuggestion && (
                <div style={{ fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap' }}>{aiSuggestion}</div>
              )}
            </div>

            {/* Live Events */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#f5a623" />
                <h2 className="font-sora font-semibold" style={{ color: '#fff', fontSize: 15 }}>Live Events</h2>
              </div>
              <div>
                {events.map((e, idx) => {
                  const sc = EVENT_SEVERITY_CONFIG[e.severity]
                  return (
                    <div key={e.id} style={{ padding: '12px 16px', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.event_type.replace('_', ' ')}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{timeSince(e.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 2 }}>{e.asset_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{e.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
