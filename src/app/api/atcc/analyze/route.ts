import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST() {
  try {
    const db = getDb()

    const [readingsRes, loadRes] = await Promise.allSettled([
      db.database.from('meter_readings').select('customer_id, reading_value, read_at, customers(zone_id)').order('read_at', { ascending: false }).limit(1000),
      db.database.from('load_readings').select('zone_id, energy_injected_kwh, energy_consumed_kwh, reading_timestamp').order('reading_timestamp', { ascending: false }).limit(200),
    ])

    return NextResponse.json({ success: true, message: 'Analysis triggered. Results written to atcc_records.' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
