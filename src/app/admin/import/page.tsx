'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, CheckCircle, AlertTriangle, Download, Loader2, X, ChevronRight } from 'lucide-react'

type ImportJob = {
  id: string
  table_name: string
  filename: string
  status: 'pending' | 'success' | 'partial' | 'failed'
  rows_imported: number
  rows_failed: number
  created_at: string
}

type Step = 1 | 2 | 3 | 4

const TABLE_OPTIONS = [
  { value: 'meter_readings', label: 'Meter Readings', columns: ['customer_id', 'reading_kwh', 'reading_date'] },
  { value: 'customers', label: 'Customers', columns: ['name', 'account_number', 'email', 'zone_id', 'tariff_class'] },
  { value: 'outages', label: 'Outages', columns: ['zone_id', 'cause', 'severity', 'started_at'] },
  { value: 'assets', label: 'Assets', columns: ['name', 'asset_type', 'zone_id', 'status'] },
]

const SEED_JOBS: ImportJob[] = [
  { id: 'j1', table_name: 'meter_readings', filename: 'readings_may_2026.csv', status: 'success', rows_imported: 4820, rows_failed: 0, created_at: '2026-05-04T10:00:00Z' },
  { id: 'j2', table_name: 'customers', filename: 'new_customers_q1.csv', status: 'partial', rows_imported: 312, rows_failed: 8, created_at: '2026-04-15T14:00:00Z' },
  { id: 'j3', table_name: 'outages', filename: 'outages_april.json', status: 'success', rows_imported: 47, rows_failed: 0, created_at: '2026-05-01T08:00:00Z' },
]

function StepIndicator({ step, current }: { step: number; current: Step }) {
  const isComplete = current > step
  const isActive = current === step
  return (
    <div className="flex items-center">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isComplete ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border)',
          color: isComplete || isActive ? '#fff' : 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 700,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {isComplete ? <CheckCircle size={16} /> : step}
      </div>
    </div>
  )
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string[][]>([])
  const [targetTable, setTargetTable] = useState('meter_readings')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ success: boolean; rowsImported: number; errors: string[] } | null>(null)
  const [jobs, setJobs] = useState<ImportJob[]>(SEED_JOBS)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const res = await fetch('/api/import/history')
      if (res.ok) {
        const data = await res.json()
        if (data.jobs?.length > 0) setJobs(data.jobs)
      }
    } catch {
      // use seed
    } finally {
      setLoadingJobs(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (f.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text)
          const arr = Array.isArray(json) ? json : [json]
          const cols = Object.keys(arr[0] || {})
          setFileContent([cols, ...arr.slice(0, 10).map((row: any) => cols.map(c => String(row[c] ?? '')))])
        } catch {
          setFileContent([['Error parsing JSON']])
        }
      } else {
        const rows = text.split('\n').filter(Boolean).map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
        setFileContent(rows.slice(0, 11)) // header + first 10
      }
    }
    reader.readAsText(f)
  }

  const selectedTable = TABLE_OPTIONS.find(t => t.value === targetTable)!
  const csvHeaders = fileContent[0] ?? []

  const initMapping = useCallback(() => {
    const mapping: Record<string, string> = {}
    selectedTable.columns.forEach(col => {
      const match = csvHeaders.find(h => h.toLowerCase().includes(col.replace('_', '')) || h === col)
      mapping[col] = match ?? ''
    })
    setColumnMapping(mapping)
  }, [selectedTable, csvHeaders])

  const handleImport = async () => {
    setImporting(true)
    setImportProgress(0)

    const interval = setInterval(() => {
      setImportProgress(prev => Math.min(prev + 12, 90))
    }, 300)

    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      formData.append('table', targetTable)
      formData.append('mapping', JSON.stringify(columnMapping))

      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      clearInterval(interval)
      setImportProgress(100)
      setImportResult({
        success: data.success ?? false,
        rowsImported: data.rowsImported ?? 0,
        errors: data.errors ?? [],
      })

      // Add to jobs
      const newJob: ImportJob = {
        id: `j-${Date.now()}`,
        table_name: targetTable,
        filename: file?.name ?? 'unknown',
        status: data.success ? (data.errors?.length > 0 ? 'partial' : 'success') : 'failed',
        rows_imported: data.rowsImported ?? 0,
        rows_failed: data.errors?.length ?? 0,
        created_at: new Date().toISOString(),
      }
      setJobs(prev => [newJob, ...prev])

      setTimeout(() => setStep(4), 100)
    } catch {
      clearInterval(interval)
      setImportProgress(100)
      setImportResult({ success: false, rowsImported: 0, errors: ['Network error — please try again'] })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (table: string) => {
    const cols: Record<string, string[]> = {
      meter_readings: ['customer_id', 'reading_kwh', 'reading_date'],
      customers: ['name', 'account_number', 'email', 'zone_id', 'tariff_class', 'meter_number', 'address'],
      outages: ['zone_id', 'cause', 'severity', 'started_at', 'affected_customers'],
      assets: ['name', 'asset_type', 'zone_id', 'status'],
    }
    const header = cols[table]?.join(',') || ''
    const blob = new Blob([header + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const STEPS = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Map Columns' },
    { n: 3, label: 'Validate' },
    { n: 4, label: 'Import' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Data Import</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Import CSV or JSON data into the SmartGrid database</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <StepIndicator step={s.n} current={step} />
              <span style={{ fontSize: 11, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? 'var(--primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 40, height: 2, background: step > s.n ? 'var(--success)' : 'var(--border)', margin: '0 4px', marginBottom: 18, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h2 className="font-sora font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Select Table & Upload File</h2>

              <div className="mb-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Target Table
                </label>
                <select
                  value={targetTable}
                  onChange={e => setTargetTable(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
                >
                  {TABLE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div
                ref={dropRef}
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? 'var(--success)' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: 40,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: file ? '#f0fdf4' : 'var(--background)',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {(file.size / 1024).toFixed(1)} KB · {fileContent.length - 1} rows detected
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="var(--text-secondary)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Drop file here or click to browse</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supports CSV and JSON files</p>
                  </>
                )}
              </div>

              {file && (
                <button
                  onClick={() => { initMapping(); setStep(2) }}
                  style={{ marginTop: 16, width: '100%', padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  Continue to Column Mapping <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Templates */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, height: 'fit-content' }}>
            <h3 className="font-sora font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Download Templates</h3>
            <div className="flex flex-col gap-2">
              {TABLE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => downloadTemplate(t.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <Download size={13} color="var(--primary)" />
                  {t.label} Template
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h2 className="font-sora font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>Map Columns</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Match your file columns to the database fields for <strong>{selectedTable.label}</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {selectedTable.columns.map(col => (
              <div key={col}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  {col.replace(/_/g, ' ')}
                </label>
                <select
                  value={columnMapping[col] ?? ''}
                  onChange={e => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
                >
                  <option value="">— Skip —</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Preview Data <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validate */}
      {step === 3 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-sora font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Data Preview (first 10 rows)</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              File: {file?.name} · Table: {selectedTable.label}
            </p>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)', position: 'sticky', top: 0 }}>
                  {fileContent[0]?.map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fileContent.slice(1, 11).map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {cell || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>empty</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: importing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? `Importing... ${importProgress}%` : 'Start Import'}
            </button>
          </div>
          {importing && (
            <div style={{ padding: '0 24px 16px' }}>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 100, width: `${importProgress}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && importResult && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          {importResult.success || importResult.rowsImported > 0 ? (
            <>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Import Successful</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                <strong>{importResult.rowsImported}</strong> rows imported into <strong>{selectedTable.label}</strong>
              </p>
              {importResult.errors.length > 0 && (
                <p style={{ color: 'var(--warning)', fontSize: 13, marginBottom: 16 }}>
                  {importResult.errors.length} rows skipped due to validation errors
                </p>
              )}
            </>
          ) : (
            <>
              <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-sora font-bold text-xl mb-2" style={{ color: 'var(--danger)' }}>Import Failed</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                {importResult.errors[0] ?? 'Unable to process the file. Please check the format and try again.'}
              </p>
            </>
          )}
          <button
            onClick={() => { setStep(1); setFile(null); setFileContent([]); setImportResult(null); setImportProgress(0) }}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Import History */}
      <div style={{ marginTop: 32 }}>
        <h2 className="font-sora font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Import History</h2>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)' }}>
                  {['Filename', 'Table', 'Rows Imported', 'Errors', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => {
                  const sc = {
                    success: { bg: '#d1fae5', color: '#065f46', label: 'Success' },
                    partial: { bg: '#fef3c7', color: '#92400e', label: 'Partial' },
                    failed: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
                    pending: { bg: '#f3f4f6', color: '#374151', label: 'Pending' },
                  }[job.status]
                  return (
                    <tr key={job.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{job.filename}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{job.table_name.replace('_', ' ')}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{job.rows_imported.toLocaleString()}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: job.rows_failed > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{job.rows_failed}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: sc?.bg, color: sc?.color, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                          {sc?.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(job.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
