'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sun, Battery, Zap, Wind, Settings, RefreshCw, Loader2, Plus, X } from 'lucide-react'

type DerAsset = {
  id: string
  zone_id: string
  zone_name?: string
  asset_type: 'solar_panel' | 'battery_bank' | 'inverter' | 'mini_grid' | 'generator'
  name: string
  capacity_kw: number
  lat: number
  lng: number
  status: 'online' | 'offline' | 'fault' | 'islanded'
  manufacturer?: string
  installation_date?: string
  last_sync: string
  utilisation_pct?: number
  output_kw?: number
  battery_soc_pct?: number
}

type DerReading = {
  id: string
  der_asset_id: string
  output_kw: number
  utilisation_pct: number
  battery_soc_pct?: number
  frequency_hz?: number
  voltage?: number
  event_type?: string
  reading_timestamp: string
}

const SEED_ASSETS: DerAsset[] = [
  { id: 'd1', zone_id: 'a1', zone_name: 'Abuja Central',        asset_type: 'solar_panel',  name: 'Abuja Central Solar Farm',         capacity_kw: 500,  lat: 9.0579, lng: 7.4951, status: 'online',   manufacturer: 'Siemens',    installation_date: '2024-03-15', last_sync: new Date(Date.now() - 5*60000).toISOString(), utilisation_pct: 84, output_kw: 420 },
  { id: 'd2', zone_id: 'a3', zone_name: 'Lagos Island',         asset_type: 'solar_panel',  name: 'Lagos Island Solar Array',          capacity_kw: 300,  lat: 6.4541, lng: 3.3947, status: 'online',   manufacturer: 'SunPower',   installation_date: '2024-06-01', last_sync: new Date(Date.now() - 3*60000).toISOString(), utilisation_pct: 83, output_kw: 250 },
  { id: 'd3', zone_id: 'a5', zone_name: 'Kano North',           asset_type: 'solar_panel',  name: 'Kano North Solar Installation',    capacity_kw: 200,  lat: 12.0022,lng: 8.5920, status: 'online',   manufacturer: 'JA Solar',   installation_date: '2024-09-10', last_sync: new Date(Date.now() - 7*60000).toISOString(), utilisation_pct: 80, output_kw: 160 },
  { id: 'd4', zone_id: 'a1', zone_name: 'Abuja Central',        asset_type: 'battery_bank', name: 'Abuja Central Battery Storage',    capacity_kw: 1000, lat: 9.0650, lng: 7.4900, status: 'online',   manufacturer: 'Tesla',      installation_date: '2024-04-20', last_sync: new Date(Date.now() - 2*60000).toISOString(), utilisation_pct: 20, output_kw: 200, battery_soc_pct: 78.5 },
  { id: 'd5', zone_id: 'a7', zone_name: 'Port Harcourt Central',asset_type: 'battery_bank', name: 'Port Harcourt Battery Bank',       capacity_kw: 500,  lat: 4.8156, lng: 7.0498, status: 'online',   manufacturer: 'CATL',       installation_date: '2024-07-12', last_sync: new Date(Date.now() - 4*60000).toISOString(), utilisation_pct: 24, output_kw: 120, battery_soc_pct: 61.0 },
  { id: 'd6', zone_id: 'a8', zone_name: 'Enugu Urban',          asset_type: 'inverter',     name: 'Enugu Urban Grid Inverter',        capacity_kw: 150,  lat: 6.4698, lng: 7.5482, status: 'online',   manufacturer: 'ABB',        installation_date: '2023-11-05', last_sync: new Date(Date.now() - 6*60000).toISOString(), utilisation_pct: 80, output_kw: 120 },
  { id: 'd7', zone_id: 'a9', zone_name: 'Ibadan North',         asset_type: 'inverter',     name: 'Ibadan North Inverter Station',   capacity_kw: 200,  lat: 7.3775, lng: 3.9470, status: 'fault',    manufacturer: 'Schneider',  installation_date: '2023-08-22', last_sync: new Date(Date.now() - 30*60000).toISOString(), utilisation_pct: 0, output_kw: 0 },
  { id: 'd8', zone_id: 'a6', zone_name: 'Kano South',           asset_type: 'mini_grid',    name: 'Kano South Mini-Grid',            capacity_kw: 800,  lat: 11.9500,lng: 8.5200, status: 'islanded', manufacturer: 'PowerAfrica',installation_date: '2023-05-18', last_sync: new Date(Date.now() - 15*60000).toISOString(), utilisation_pct: 75, output_kw: 600 },
  { id: 'd9', zone_id: 'a10',zone_name: 'Kaduna Central',       asset_type: 'mini_grid',    name: 'Kaduna Central Mini-Grid',        capacity_kw: 600,  lat: 10.5264,lng: 7.4381, status: 'online',   manufacturer: 'GreenPower', installation_date: '2024-01-30', last_sync: new Date(Date.now() - 8*60000).toISOString(), utilisation_pct: 80, output_kw: 480 },
  { id: 'd10',zone_id: 'a2', zone_name: 'Abuja North',          asset_type: 'generator',    name: 'Abuja North Emergency Generator', capacity_kw: 400,  lat: 9.1200, lng: 7.4600, status: 'online',   manufacturer: 'Caterpillar',installation_date: '2022-12-01', last_sync: new Date(Date.now() - 1*60000).toISOString(), utilisation_pct: 87, output_kw: 350 },
]

const SEED_EVENTS: DerReading[] = [
  { id: 'e1', der_asset_id: 'd8', output_kw: 600, utilisation_pct: 75, frequency_hz: 50.10, voltage: 416, event_type: 'islanding',            reading_timestamp: new Date(Date.now() - 15*60000).toISOString() },
  { id: 'e2', der_asset_id: 'd8', output_kw: 580, utilisation_pct: 72.5,frequency_hz: 50.08, voltage: 415.5,event_type: 'islanding',           reading_timestamp: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 'e3', der_asset_id: 'd7', output_kw: 0,   utilisation_pct: 0,   frequency_hz: 49.80, voltage: 390, event_type: 'frequency_deviation',  reading_timestamp: new Date(Date.now() - 30*60000).toISOString() },
]

const STATUS_CONFIG = {
  online:   { bg: '#d1fae5', color: '#065f46', label: 'Online' },
  offline:  { bg: '#f3f4f6', color: '#6b7280', label: 'Offline' },
  fault:    { bg: '#fee2e2', color: '#991b1b', label: 'Fault' },
  islanded: { bg: '#fef3c7', color: '#92400e', label: 'Islanded' },
}

const ASSET_ICONS: Record<string, React.ReactNode> = {
  solar_panel:  <Sun size={16} />,
  battery_bank: <Battery size={16} />,
  inverter:     <Zap size={16} />,
  mini_grid:    <Wind size={16} />,
  generator:    <Settings size={16} />,
}

const EVENT_CONFIG: Record<string, { bg: string; color: string }> = {
  islanding:          { bg: '#fef3c7', color: '#92400e' },
  reconnection:       { bg: '#d1fae5', color: '#065f46' },
  frequency_deviation:{ bg: '#fee2e2', color: '#991b1b' },
  normal:             { bg: '#f3f4f6', color: '#6b7280' },
}

function timeSince(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return `${Math.floor(diff/86400000)}d ago`
}

export default function DerPage() {
  const [assets, setAssets] = useState<DerAsset[]>(SEED_ASSETS)
  const [events, setEvents] = useState<DerReading[]>(SEED_EVENTS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<DerAsset | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/der/assets')
      if (res.ok) {
        const data = await res.json()
        if (data.assets?.length > 0) setAssets(data.assets)
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const refresh = async () => {
    setRefreshing(true)
    await fetchAssets()
    setRefreshing(false)
  }

  const totalCapacity = assets.reduce((s, a) => s + a.capacity_kw, 0)
  const onlineAssets = assets.filter(a => a.status === 'online' || a.status === 'islanded')
  const totalOutput = onlineAssets.reduce((s, a) => s + (a.output_kw || 0), 0)
  const systemUtil = totalCapacity > 0 ? (totalOutput / totalCapacity * 100) : 0

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>DER Asset Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Distributed Energy Resources — solar panels, batteries, inverters, mini-grids, generators</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer' }}>
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total DER Capacity', value: `${(totalCapacity/1000).toFixed(1)} MW`, color: 'var(--primary)' },
          { label: 'Current Output', value: `${totalOutput} kW`, color: 'var(--success)' },
          { label: 'System Utilisation', value: `${systemUtil.toFixed(1)}%`, color: 'var(--warning)' },
          { label: 'Assets Online', value: `${onlineAssets.length}/${assets.length}`, color: assets.filter(a => a.status === 'fault').length > 0 ? 'var(--danger)' : 'var(--success)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <p className="font-sora font-bold text-2xl" style={{ color: k.color }}>{k.value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Table */}
        <div className="lg:col-span-2">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)' }}>Asset Register</h2>
            </div>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color="var(--text-secondary)" /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--background)' }}>
                      {['Asset', 'Zone', 'Capacity', 'Output', 'Util %', 'Status', 'Last Sync'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a, idx) => {
                      const sc = STATUS_CONFIG[a.status]
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setSelected(a)}
                          style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: selected?.id === a.id ? 'rgba(26,31,94,0.04)' : 'transparent' }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 30, height: 30, background: 'rgba(26,31,94,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                {ASSET_ICONS[a.asset_type]}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{a.asset_type.replace('_', ' ')}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{a.zone_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.capacity_kw} kW</td>
                          <td style={{ padding: '12px 14px', fontSize: 12, color: a.status === 'fault' ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'monospace', fontWeight: a.output_kw ? 600 : 400 }}>{a.output_kw ?? 0} kW</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, minWidth: 40 }}>
                                <div style={{ width: `${Math.min(a.utilisation_pct || 0, 100)}%`, height: '100%', background: (a.utilisation_pct || 0) > 85 ? 'var(--success)' : 'var(--warning)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{a.utilisation_pct ?? 0}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{timeSince(a.last_sync)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Asset Detail */}
          {selected ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>{selected.name}</h2>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Status', value: <span style={{ background: STATUS_CONFIG[selected.status].bg, color: STATUS_CONFIG[selected.status].color, padding: '2px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{STATUS_CONFIG[selected.status].label}</span> },
                  { label: 'Type', value: selected.asset_type.replace('_', ' ') },
                  { label: 'Zone', value: selected.zone_name },
                  { label: 'Capacity', value: `${selected.capacity_kw} kW` },
                  { label: 'Current Output', value: `${selected.output_kw || 0} kW` },
                  { label: 'Utilisation', value: `${selected.utilisation_pct || 0}%` },
                  ...(selected.battery_soc_pct !== undefined ? [{ label: 'Battery SoC', value: `${selected.battery_soc_pct}%` }] : []),
                  { label: 'Manufacturer', value: selected.manufacturer || '—' },
                  { label: 'Installed', value: selected.installation_date || '—' },
                  { label: 'Last Sync', value: timeSince(selected.last_sync) },
                  { label: 'Coordinates', value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {selected.status === 'fault' && (
                <div style={{ background: '#fee2e2', borderRadius: 8, padding: '10px 12px', marginTop: 12, fontSize: 12, color: '#991b1b', fontWeight: 500 }}>
                  ⚠ Asset in fault state. Frequency deviation detected. Field inspection required.
                </div>
              )}
              {selected.status === 'islanded' && (
                <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 12px', marginTop: 12, fontSize: 12, color: '#92400e', fontWeight: 500 }}>
                  ⚡ Asset is islanded — operating off main grid. Monitor frequency stability.
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <Zap size={32} color="var(--text-secondary)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click an asset to view details</p>
            </div>
          )}

          {/* Event Log */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>Event Log</h2>
            </div>
            <div>
              {events.map((e, idx) => {
                const asset = assets.find(a => a.id === e.der_asset_id)
                const ec = EVENT_CONFIG[e.event_type || 'normal']
                return (
                  <div key={e.id} style={{ padding: '12px 16px', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ background: ec.bg, color: ec.color, padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.event_type?.replace('_', ' ') || 'Normal'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{timeSince(e.reading_timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{asset?.name || 'Unknown Asset'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {e.frequency_hz ? `${e.frequency_hz} Hz` : ''}{e.voltage ? ` · ${e.voltage}V` : ''} · {e.output_kw} kW
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sora font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Add DER Asset</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Asset Name', placeholder: 'e.g. Abuja Solar Farm 2' },
                { label: 'Capacity (kW)', placeholder: 'e.g. 500' },
                { label: 'Latitude', placeholder: 'e.g. 9.0579' },
                { label: 'Longitude', placeholder: 'e.g. 7.4951' },
                { label: 'Manufacturer', placeholder: 'e.g. Siemens (optional)' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input placeholder={f.placeholder} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Asset Type</label>
                <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13 }}>
                  {['solar_panel', 'battery_bank', 'inverter', 'mini_grid', 'generator'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Asset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
