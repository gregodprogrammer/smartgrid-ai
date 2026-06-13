import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data: customers } = await db.database
      .from('customers')
      .select('id, full_name, account_number, zone_id, tariff_class, billing_type, zones(name)')
      .order('full_name')
      .limit(100)

    const result = (customers || []).map((c: any) => ({
      ...c,
      zone_name: c.zones?.name,
      billing_type: c.billing_type || 'estimated',
    }))

    return NextResponse.json({ customers: result })
  } catch {
    return NextResponse.json({ customers: [] })
  }
}
