import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data } = await db.database
      .from('investment_recommendations')
      .select('*, zones(name)')
      .order('priority')
      .order('estimated_cost_naira', { ascending: false })

    const recommendations = (data || []).map((r: any) => ({ ...r, zone_name: r.zones?.name }))
    return NextResponse.json({ recommendations })
  } catch {
    return NextResponse.json({ recommendations: [] })
  }
}
