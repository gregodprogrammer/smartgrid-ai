import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })

  return { headers, rows }
}

function parseJSON(text: string): Record<string, any>[] {
  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : [data]
  } catch {
    return []
  }
}

function applyMapping(rows: Record<string, any>[], mapping: Record<string, string>): Record<string, any>[] {
  if (Object.keys(mapping).length === 0) return rows
  return rows.map(row => {
    const mapped: Record<string, any> = {}
    Object.entries(mapping).forEach(([dbCol, fileCol]) => {
      if (fileCol && row[fileCol] !== undefined) mapped[dbCol] = row[fileCol]
    })
    return mapped
  })
}

const ALLOWED_TABLES = ['zones', 'assets', 'customers', 'meter_readings', 'load_readings']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const importType = formData.get('import_type') as string | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file || !importType) {
      return NextResponse.json({ success: false, error: 'File and import_type are required' }, { status: 400 })
    }

    if (!ALLOWED_TABLES.includes(importType)) {
      return NextResponse.json({ success: false, error: 'Invalid import type' }, { status: 400 })
    }

    const mapping: Record<string, string> = mappingRaw ? JSON.parse(mappingRaw) : {}
    const text = await file.text()

    let rawRows: Record<string, any>[] = []
    if (file.name.toLowerCase().endsWith('.json')) {
      rawRows = parseJSON(text)
    } else {
      const { rows } = parseCSV(text)
      rawRows = rows
    }

    const rows = applyMapping(rawRows, mapping)

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No rows found in file', rowsImported: 0, errors: [] })
    }

    const db = getDb()
    const errors: string[] = []
    let rowsImported = 0

    const batchSize = 50
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).filter(r => Object.keys(r).length > 0)
      if (batch.length === 0) continue

      try {
        const { error } = await db.database
          .from(importType)
          .insert(batch)

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else {
          rowsImported += batch.length
        }
      } catch (err: any) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message ?? 'Insert failed'}`)
      }
    }

    const jobStatus = errors.length === 0 ? 'completed' : rowsImported > 0 ? 'completed' : 'failed'
    try {
      await db.database.from('import_jobs').insert({
        filename: file.name,
        import_type: importType,
        status: jobStatus,
        rows_imported: rowsImported,
        error_log: errors.length > 0 ? errors.slice(0, 5).join('\n') : null,
        imported_by: 'admin',
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: rowsImported > 0,
      rowsImported,
      rowsFailed: errors.length * batchSize,
      errors: errors.slice(0, 10),
      total: rows.length,
    })
  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json({ success: false, error: 'Import failed', rowsImported: 0, errors: [] }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = getDb()
    const { data } = await db.database
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ jobs: data ?? [] })
  } catch {
    return NextResponse.json({ jobs: [] })
  }
}
