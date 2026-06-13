import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data, error } = await db.database
      .from('fraud_alerts')
      .select('*, customers(full_name, account_number, zone_id, zones(name))')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ alerts: data ?? [] })
  } catch (error) {
    console.error('Fraud list error:', error)
    return NextResponse.json({ alerts: [], error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
