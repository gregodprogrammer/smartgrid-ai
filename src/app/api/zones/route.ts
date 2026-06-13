import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data: zones, error } = await db.database
      .from('zones')
      .select('id, name, state, region, lat, lng, status, cause, severity, estimated_restoration, notes, affected_customers, updated_at')
      .order('name')

    const { data: assets } = await db.database
      .from('assets')
      .select('id, name, asset_type, zone_id, status, lat, lng')

    if (error) throw error

    // Transform flat lat/lng into nested coordinates for the map component
    const zonesWithCoords = (zones ?? []).map((z: any) => ({
      ...z,
      coordinates: z.lat && z.lng ? { lat: z.lat, lng: z.lng } : undefined,
    }))
    const assetsWithCoords = (assets ?? []).map((a: any) => ({
      ...a,
      coordinates: a.lat && a.lng ? { lat: a.lat, lng: a.lng } : undefined,
    }))

    return NextResponse.json({ zones: zonesWithCoords, assets: assetsWithCoords })
  } catch (error) {
    console.error('Zones API error:', error)
    return NextResponse.json({ zones: [], assets: [], error: 'Failed to fetch zones' }, { status: 500 })
  }
}
