import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const nullable = new Set(['cause', 'severity', 'estimated_restoration', 'notes'])
    const allowed = ['status', 'cause', 'severity', 'estimated_restoration', 'notes', 'affected_customers']
    const update: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (!(key in body)) continue
      const val = body[key]
      // Treat empty string as NULL for optional text/timestamp fields
      update[key] = (nullable.has(key) && val === '') ? null : val
    }

    const db = getDb()
    const { error } = await db.database
      .from('zones')
      .update(update)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Zone update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
