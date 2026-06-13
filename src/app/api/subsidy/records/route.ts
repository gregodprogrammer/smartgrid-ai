import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data } = await db.database
      .from('subsidy_records')
      .select('*, zones(name)')
      .order('period_month', { ascending: false })
      .order('created_at', { ascending: false })

    const records = (data || []).map((r: any) => ({ ...r, zone_name: r.zones?.name }))
    return NextResponse.json({ records })
  } catch {
    return NextResponse.json({ records: [] })
  }
}
