import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type AlertType = 'zero_drop' | 'spike' | 'pattern_break' | 'consistent_zero'

interface MeterReading {
  id: string
  customer_id: string
  reading_value: number
  reading_date: string
}

function detectAnomaly(readings: MeterReading[]): { type: AlertType; confidence: number; readingId: string } | null {
  if (readings.length < 2) return null

  const values = readings.map(r => r.reading_value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const latest = values[0]
  const prev = values[1]
  const latestId = readings[0].id

  const zeroCount = values.slice(0, 5).filter(v => v === 0).length
  if (zeroCount >= 3) {
    return { type: 'consistent_zero', confidence: Math.min(0.7 + zeroCount * 0.05, 0.98), readingId: latestId }
  }

  if (latest === 0 && prev > 0) {
    return { type: 'zero_drop', confidence: prev > avg * 0.8 ? 0.88 : 0.72, readingId: latestId }
  }

  if (latest > avg * 3 && avg > 0) {
    const ratio = latest / avg
    return { type: 'spike', confidence: Math.min(0.6 + (ratio - 3) * 0.08, 0.96), readingId: latestId }
  }

  if (values.length >= 4) {
    const historicalAvg = values.slice(2).reduce((a, b) => a + b, 0) / values.slice(2).length
    const changePercent = Math.abs(latest - historicalAvg) / historicalAvg
    if (changePercent > 0.5 && historicalAvg > 0) {
      return { type: 'pattern_break', confidence: Math.min(0.55 + changePercent * 0.2, 0.84), readingId: latestId }
    }
  }

  return null
}

export async function POST() {
  try {
    const db = getDb()
    let newAlerts = 0

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 180)

    const { data: readings, error: readingsError } = await db.database
      .from('meter_readings')
      .select('id, customer_id, reading_value, reading_date')
      .gte('reading_date', cutoff.toISOString().split('T')[0])
      .order('customer_id')
      .order('reading_date', { ascending: false })

    if (readingsError) throw readingsError
    if (!readings || readings.length === 0) {
      return NextResponse.json({ newAlerts: 0, message: 'No readings to analyze' })
    }

    // Group by customer
    const byCustomer: Record<string, MeterReading[]> = {}
    for (const row of readings) {
      if (!byCustomer[row.customer_id]) byCustomer[row.customer_id] = []
      byCustomer[row.customer_id].push(row)
    }

    // Get existing open alerts to avoid duplicates
    const cutoff30 = new Date()
    cutoff30.setDate(cutoff30.getDate() - 30)
    const { data: existingAlerts } = await db.database
      .from('fraud_alerts')
      .select('customer_id, alert_type')
      .eq('status', 'open')
      .gte('created_at', cutoff30.toISOString())

    const existingSet = new Set(
      (existingAlerts ?? []).map((a: any) => `${a.customer_id}:${a.alert_type}`)
    )

    for (const [customerId, custReadings] of Object.entries(byCustomer)) {
      const anomaly = detectAnomaly(custReadings)
      if (!anomaly) continue

      const key = `${customerId}:${anomaly.type}`
      if (existingSet.has(key)) continue

      try {
        await db.database.from('fraud_alerts').insert({
          customer_id: customerId,
          meter_reading_id: anomaly.readingId,
          alert_type: anomaly.type,
          confidence_score: anomaly.confidence,
          status: 'open',
        })

        await db.database
          .from('meter_readings')
          .update({ is_flagged: true, anomaly_score: anomaly.confidence })
          .eq('id', anomaly.readingId)

        newAlerts++
        existingSet.add(key)
      } catch {
        // Skip failed inserts
      }
    }

    return NextResponse.json({
      newAlerts,
      analyzed: Object.keys(byCustomer).length,
      message: `Analyzed ${Object.keys(byCustomer).length} customers, found ${newAlerts} new alerts`,
    })
  } catch (error) {
    console.error('Fraud detection error:', error)
    return NextResponse.json({ error: 'Fraud detection failed', newAlerts: 0 }, { status: 500 })
  }
}
