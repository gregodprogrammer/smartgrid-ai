'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@insforge/sdk'
import 'leaflet/dist/leaflet.css'

type Zone = {
  id: string
  name: string
  state: string
  status: 'active' | 'outage' | 'maintenance'
  cause?: string
  severity?: string
  estimated_restoration?: string
  affected_customers?: number
  coordinates?: { lat: number; lng: number }
}

type Asset = {
  id: string
  name: string
  asset_type: string
  zone_id: string
  status: string
  coordinates?: { lat: number; lng: number }
}

// Fallback seed zones to always show something on the map
const SEED_ZONES: Zone[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Abuja Central',
    state: 'FCT',
    status: 'active',
    cause: undefined,
    affected_customers: 42000,
    coordinates: { lat: 9.0579, lng: 7.4951 },
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Abuja North',
    state: 'FCT',
    status: 'outage',
    cause: 'Feeder fault — transformer overload',
    severity: 'high',
    estimated_restoration: '2026-05-05T18:00:00Z',
    affected_customers: 18500,
    coordinates: { lat: 9.1726, lng: 7.4916 },
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    name: 'Lagos Island',
    state: 'Lagos',
    status: 'active',
    affected_customers: 65000,
    coordinates: { lat: 6.4541, lng: 3.3947 },
  },
  {
    id: 'z4',
    name: 'Kano North',
    state: 'Kano',
    status: 'active',
    affected_customers: 31200,
    coordinates: { lat: 12.0022, lng: 8.5920 },
  },
  {
    id: 'z5',
    name: 'Port Harcourt',
    state: 'Rivers',
    status: 'maintenance',
    cause: 'Scheduled maintenance',
    estimated_restoration: '2026-05-05T20:00:00Z',
    affected_customers: 22000,
    coordinates: { lat: 4.8156, lng: 7.0498 },
  },
  {
    id: 'z6',
    name: 'Ibadan Metro',
    state: 'Oyo',
    status: 'active',
    affected_customers: 38400,
    coordinates: { lat: 7.3775, lng: 3.9470 },
  },
  {
    id: 'z7',
    name: 'Enugu Central',
    state: 'Enugu',
    status: 'active',
    affected_customers: 19800,
    coordinates: { lat: 6.4584, lng: 7.5464 },
  },
  {
    id: 'z8',
    name: 'Benin City',
    state: 'Edo',
    status: 'outage',
    cause: 'Vandalism — transmission line',
    severity: 'critical',
    affected_customers: 14200,
    coordinates: { lat: 6.3350, lng: 5.6270 },
  },
  {
    id: 'z9',
    name: 'Kaduna South',
    state: 'Kaduna',
    status: 'active',
    affected_customers: 26500,
    coordinates: { lat: 10.5222, lng: 7.4383 },
  },
  {
    id: 'z10',
    name: 'Maiduguri',
    state: 'Borno',
    status: 'active',
    affected_customers: 12100,
    coordinates: { lat: 11.8311, lng: 13.1510 },
  },
]

const STATUS_COLORS = {
  active: '#10b981',
  outage: '#ef4444',
  maintenance: '#f59e0b',
}

export default function OutageMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [zones, setZones] = useState<Zone[]>(SEED_ZONES)
  const [assets, setAssets] = useState<Asset[]>([])
  const [showAssets, setShowAssets] = useState(false)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ active: 0, outage: 0, maintenance: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/zones')
        if (res.ok) {
          const data = await res.json()
          if (data.zones && data.zones.length > 0) {
            setZones(data.zones)
          }
          if (data.assets) setAssets(data.assets)
        }
      } catch {
        // Use seed data on error
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Realtime: subscribe to zone status changes and patch local state
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    })

    async function subscribeRealtime() {
      try {
        await insforge.realtime.connect()
        const res = await insforge.realtime.subscribe('zones')
        if (res.ok) {
          insforge.realtime.on('zone_updated', (payload: any) => {
            setZones(prev => prev.map(z =>
              z.id === payload.id ? { ...z, ...payload } : z
            ))
          })
        }
      } catch {
        // Realtime unavailable — map still shows via periodic fetch below
      }
    }
    subscribeRealtime()

    // Fallback polling every 30 s in case websocket is unavailable
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/zones')
        if (res.ok) {
          const data = await res.json()
          if (data.zones?.length > 0) setZones(data.zones)
        }
      } catch { /* ignore */ }
    }, 30_000)

    return () => {
      clearInterval(poll)
      insforge.realtime.unsubscribe('zones')
      insforge.realtime.disconnect()
    }
  }, [])

  useEffect(() => {
    const active = zones.filter(z => z.status === 'active').length
    const outage = zones.filter(z => z.status === 'outage').length
    const maintenance = zones.filter(z => z.status === 'maintenance').length
    setSummary({ active, outage, maintenance })
  }, [zones])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapRef.current) return
    if (loading) return

    let map: any

    async function initMap() {
      const L = (await import('leaflet')).default

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      map = L.map(mapRef.current!, {
        center: [9.082, 8.6753],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      // Add zone markers
      zones.forEach(zone => {
        const coords = zone.coordinates || { lat: 9.082, lng: 8.6753 }
        const color = STATUS_COLORS[zone.status] || '#6b7280'

        const circleMarker = L.circleMarker([coords.lat, coords.lng], {
          radius: 14,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        })

        const restorationStr = zone.estimated_restoration
          ? new Date(zone.estimated_restoration).toLocaleString('en-NG', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : 'N/A'

        const popupHtml = `
          <div style="font-family:'DM Sans',sans-serif;min-width:220px;padding:4px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
              <strong style="font-family:'Sora',sans-serif;color:#1a1f5e;font-size:14px">${zone.name}</strong>
            </div>
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              <tr><td style="color:#6b7280;padding:2px 0">State</td><td style="text-align:right;color:#1a1f5e;font-weight:500">${zone.state}</td></tr>
              <tr><td style="color:#6b7280;padding:2px 0">Status</td><td style="text-align:right"><span style="background:${color}22;color:${color};padding:2px 8px;border-radius:100px;font-weight:600;font-size:11px">${zone.status.toUpperCase()}</span></td></tr>
              ${zone.cause ? `<tr><td style="color:#6b7280;padding:2px 0">Cause</td><td style="text-align:right;color:#1a1f5e">${zone.cause}</td></tr>` : ''}
              ${zone.severity ? `<tr><td style="color:#6b7280;padding:2px 0">Severity</td><td style="text-align:right;color:#ef4444;font-weight:600">${zone.severity}</td></tr>` : ''}
              ${zone.estimated_restoration ? `<tr><td style="color:#6b7280;padding:2px 0">Est. Restoration</td><td style="text-align:right;color:#1a1f5e">${restorationStr}</td></tr>` : ''}
              ${zone.affected_customers ? `<tr><td style="color:#6b7280;padding:2px 0">Affected Customers</td><td style="text-align:right;color:#1a1f5e;font-weight:500">${zone.affected_customers.toLocaleString()}</td></tr>` : ''}
            </table>
          </div>
        `

        circleMarker.bindPopup(popupHtml, { maxWidth: 280 })
        circleMarker.addTo(map)

        // Zone label
        const label = L.divIcon({
          className: '',
          html: `<div style="font-family:'Sora',sans-serif;font-size:10px;font-weight:600;color:#1a1f5e;white-space:nowrap;text-shadow:0 1px 3px rgba(255,255,255,0.8);background:rgba(255,255,255,0.75);padding:2px 5px;border-radius:4px;margin-top:16px">${zone.name}</div>`,
          iconAnchor: [0, -16],
        })
        L.marker([coords.lat, coords.lng], { icon: label, interactive: false }).addTo(map)
      })
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [zones, loading])

  // Handle asset layer toggle
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapInstanceRef.current || assets.length === 0) return

    async function updateAssets() {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current
      if (!map) return

      // Remove existing asset markers (tracked by class)
      map.eachLayer((layer: any) => {
        if (layer._isAssetMarker) map.removeLayer(layer)
      })

      if (showAssets) {
        assets.forEach((asset: Asset) => {
          if (!asset.coordinates) return
          const marker = L.circleMarker([asset.coordinates.lat, asset.coordinates.lng], {
            radius: 6,
            fillColor: '#6b7280',
            color: '#fff',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.8,
          })
          ;(marker as any)._isAssetMarker = true
          marker.bindTooltip(`${asset.name} (${asset.asset_type})`, { direction: 'top' })
          marker.addTo(map)
        })
      }
    }

    updateAssets()
  }, [showAssets, assets])

  return (
    <div style={{ position: 'relative' }}>
      {/* Status summary bar */}
      <div
        style={{
          background: 'var(--primary)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <span className="text-xs font-medium text-white/60">ZONE STATUS:</span>
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS.active }} />
          <span className="text-xs text-white font-medium">{summary.active} Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS.outage }} />
          <span className="text-xs text-white font-medium">{summary.outage} Outage{summary.outage !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS.maintenance }} />
          <span className="text-xs text-white font-medium">{summary.maintenance} Maintenance</span>
        </div>
        {assets.length > 0 && (
          <button
            onClick={() => setShowAssets(!showAssets)}
            style={{
              marginLeft: 'auto',
              background: showAssets ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {showAssets ? 'Hide Assets' : 'Show Assets'}
          </button>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ width: '100%', height: 600 }}
      />

      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(248,249,252,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading grid data...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .leaflet-popup-tip { background: #fff !important; }
      `}</style>
    </div>
  )
}
