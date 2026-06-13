'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Plus, X, Loader2, CheckCircle } from 'lucide-react'

type Report = {
  id: string
  title: string
  report_type: string
  zone_id?: string
  period_start?: string
  period_end?: string
  content: string
  created_at: string
}

const SEED_REPORTS: Report[] = [
  { id: 'r1', title: 'Weekly Operations Report — Wk 18 2026', report_type: 'weekly', zone_id: undefined, period_start: '2026-04-28', period_end: '2026-05-04', content: 'Weekly grid performance summary...', created_at: '2026-05-05T06:00:00Z' },
  { id: 'r2', title: 'Monthly Fraud Analysis — April 2026', report_type: 'fraud', zone_id: 'z3', period_start: '2026-04-01', period_end: '2026-04-30', content: 'Fraud detection summary for Lagos Island...', created_at: '2026-05-01T08:00:00Z' },
  { id: 'r3', title: 'Incident Report — Abuja North Outage', report_type: 'incident', zone_id: 'a2', period_start: '2026-04-28', period_end: '2026-04-28', content: 'Detailed incident analysis...', created_at: '2026-04-29T10:00:00Z' },
  { id: 'r4', title: 'Monthly Operations — March 2026', report_type: 'monthly', zone_id: undefined, period_start: '2026-03-01', period_end: '2026-03-31', content: 'Full monthly summary...', created_at: '2026-04-01T07:00:00Z' },
]

const ZONES = [
  { id: '', label: 'All Zones (Network-wide)' },
  { id: 'a1000000-0000-0000-0000-000000000001', label: 'Abuja Central' },
  { id: 'a1000000-0000-0000-0000-000000000002', label: 'Abuja North' },
  { id: 'a1000000-0000-0000-0000-000000000003', label: 'Lagos Island' },
  { id: 'z4', label: 'Kano North' },
  { id: 'z5', label: 'Port Harcourt' },
  { id: 'z6', label: 'Ibadan Metro' },
  { id: 'z7', label: 'Enugu Central' },
  { id: 'z8', label: 'Benin City' },
]

const REPORT_TYPES = [
  { value: 'weekly', label: 'Weekly Operations' },
  { value: 'monthly', label: 'Monthly Summary' },
  { value: 'incident', label: 'Incident Report' },
  { value: 'fraud', label: 'Fraud Analysis' },
]

const TYPE_CONFIG: Record<string, { bg: string; color: string }> = {
  weekly: { bg: '#dbeafe', color: '#1e40af' },
  monthly: { bg: '#ede9fe', color: '#5b21b6' },
  incident: { bg: '#fee2e2', color: '#991b1b' },
  fraud: { bg: '#fef3c7', color: '#92400e' },
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (r: Report) => void }) {
  const [form, setForm] = useState({
    report_type: 'weekly',
    zone_id: '',
    period_start: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.report) {
        onGenerated(data.report)
        onClose()
      } else {
        setError(data.error ?? 'Failed to generate report')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-sora font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Generate Report</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI-powered report generation</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Report Type
            </label>
            <select
              value={form.report_type}
              onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
            >
              {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Zone
            </label>
            <select
              value={form.zone_id}
              onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
            >
              {ZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                From
              </label>
              <input
                type="date"
                value={form.period_start}
                onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                To
              </label>
              <input
                type="date"
                value={form.period_end}
                onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: generating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="font-sora font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{report.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Generated {new Date(report.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', marginLeft: 12 }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {report.content}
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => {
              const blob = new Blob([report.content], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${report.title}.txt`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={14} />
            Download Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS)
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        if (data.reports?.length > 0) setReports(data.reports)
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Report Generator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>AI-generated operational and compliance reports</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-sora font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Past Reports</h2>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Loader2 size={24} className="animate-spin" color="var(--text-secondary)" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)' }}>
                  {['Title', 'Type', 'Period', 'Generated', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => {
                  const tc = TYPE_CONFIG[report.report_type] || TYPE_CONFIG.monthly
                  return (
                    <tr key={report.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.title}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                          {report.report_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {report.period_start && report.period_end
                          ? `${new Date(report.period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} – ${new Date(report.period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(report.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <FileText size={12} /> View
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([report.content], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${report.title}.txt`
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(26,31,94,0.08)', color: 'var(--primary)', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Download size={12} /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerated={report => {
            setReports(prev => [report, ...prev])
          }}
        />
      )}

      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  )
}
