import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { report_id } = await req.json()
    const db = getDb()
    await db.database
      .from('nerc_reports')
      .update({ submission_status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', report_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
