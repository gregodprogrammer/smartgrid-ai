import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await req.json()
    const { id } = await params

    const validStatuses = ['open', 'confirmed_fraud', 'false_positive', 'investigating']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const db = getDb()
    const { error } = await db.database
      .from('fraud_alerts')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    console.error('Fraud update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
