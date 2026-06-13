import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const [assetsRes, readingsRes] = await Promise.allSettled([
      db.database.from('der_assets').select('*, zones(name)').order('status').order('name'),
      db.database.from('der_readings').select('der_asset_id, output_kw, utilisation_pct, battery_soc_pct, frequency_hz, voltage, event_type, reading_timestamp').order('reading_timestamp', { ascending: false }).limit(100),
    ])

    const assetsRaw = assetsRes.status === 'fulfilled' ? (assetsRes.value.data || []) : []
    const readings = readingsRes.status === 'fulfilled' ? (readingsRes.value.data || []) : []

    const latestByAsset = new Map<string, any>()
    for (const r of readings) {
      if (!latestByAsset.has(r.der_asset_id)) latestByAsset.set(r.der_asset_id, r)
    }

    const assets = assetsRaw.map((a: any) => {
      const latest = latestByAsset.get(a.id)
      return {
        ...a,
        zone_name: a.zones?.name,
        output_kw: latest?.output_kw ?? 0,
        utilisation_pct: latest?.utilisation_pct ?? 0,
        battery_soc_pct: latest?.battery_soc_pct,
      }
    })

    return NextResponse.json({ assets })
  } catch {
    return NextResponse.json({ assets: [] })
  }
}
