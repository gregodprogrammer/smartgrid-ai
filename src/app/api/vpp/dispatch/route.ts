import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { asset_ids, dispatch_type, commanded_kw, notes } = await req.json()
    const db = getDb()

    const { data: firstAsset } = await db.database
      .from('der_assets')
      .select('zone_id')
      .eq('id', asset_ids[0])
      .single()

    const { data } = await db.database
      .from('vpp_dispatch')
      .insert({
        zone_id: firstAsset?.zone_id,
        dispatch_type,
        target_asset_ids: asset_ids.join(','),
        commanded_kw,
        status: 'pending',
        operator_id: 'op-admin-001',
        notes: notes || `Dispatch via VPP console`,
      })
      .select()
      .single()

    return NextResponse.json({ success: true, dispatch: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
