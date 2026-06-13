import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const { data } = await db.database
      .from('nerc_reports')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({ reports: data || [] })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
