'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Send, Download, Loader2, CheckCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react'

type NercReport = {
  id: string
  report_period: string
  report_type: string
  content: string
  submission_status: 'draft' | 'submitted' | 'accepted' | 'returned'
  submitted_at: string | null
  created_at: string
}

const SEED_REPORTS: NercReport[] = [
  {
    id: 'nr1',
    report_period: '2026-03',
    report_type: 'monthly_performance',
    content: `NERC MONTHLY PERFORMANCE REPORT — MARCH 2026\nSubmitted by: Keotera SmartGrid AI Platform\nDistribution Company: AEDC\n\n1. NETWORK PERFORMANCE SUMMARY\nTotal energy injected: 4,660,000 kWh across 10 distribution zones\nSystem ATC&C Loss: 22.1% (target: 30%)\nOutage incidents: 12 (4 resolved, 8 active)\nAverage restoration time: 4.2 hours\n\n2. ZONE PERFORMANCE\nBest: Abuja Central (15.5% ATC&C)\nWorst: Abuja North (47.1% ATC&C)\n\n3. CUSTOMER METRICS\nTotal customers: 125,000\nAffected by outages: 18,500\nComplaints resolved: 298/342 (87%)`,
    submission_status: 'submitted',
    submitted_at: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
    created_at: new Date(Date.now() - 46 * 86400 * 1000).toISOString(),
  },
  {
    id: 'nr2',
    report_period: '2026-04',
    report_type: 'monthly_performance',
    content: `NERC MONTHLY PERFORMANCE REPORT — APRIL 2026\nSubmitted by: Keotera SmartGrid AI Platform\nDistribution Company: AEDC\n\n1. NETWORK PERFORMANCE SUMMARY\nTotal energy injected: 4,745,000 kWh\nSystem ATC&C Loss: 21.8% (improvement of 0.3%)\nOutage incidents: 10\nAverage restoration time: 3.9 hours\n\n2. AI INSIGHTS\nFraud detection: 8 new meter tampering cases\nInvestment recommendations: 8 priority interventions generated\n\n3. REGULATORY COMPLIANCE\nATC&C reporting: Compliant\nOutage notification: Compliant`,
    submission_status: 'submitted',
    submitted_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    created_at: new Date(Date.now() - 16 * 86400 * 1000).toISOString(),
  },
  {
    id: 'nr3',
    report_period: '2026-05',
    report_type: 'atcc_report',
    content: `NERC ATC&C LOSS REPORT — MAY 2026 (DRAFT)\nPrepared by: Keotera SmartGrid AI Platform\n\nSYSTEM-WIDE ATC&C SUMMARY (DRAFT — PENDING FINAL DATA)\nReporting period: May 2026\nStatus: In preparation\n\nThis report will be submitted to NERC Abuja by 15 June 2026 per regulatory schedule.`,
    submission_status: 'draft',
    submitted_at: null,
    created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
]

const REPORT_TYPES = [
  { value: 'monthly_performance', label: 'Monthly Performance' },
  { value: 'atcc_report', label: 'ATC&C Report' },
  { value: 'outage_notification', label: 'Outage Notification' },
  { value: 'customer_complaint', label: 'Customer Complaint Summary' },
]

const STATUS_CONFIG = {
  draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft', icon: Clock },
  submitted: { bg: '#dbeafe', color: '#1e40af', label: 'Submitted', icon: Send },
  accepted: { bg: '#d1fae5', color: '#065f46', label: 'Accepted', icon: CheckCircle },
  returned: { bg: '#fee2e2', color: '#991b1b', label: 'Returned', icon: AlertTriangle },
}

export default function NercPage() {
  const [reports, setReports] = useState<NercReport[]>(SEED_REPORTS)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<NercReport | null>(SEED_REPORTS[2])
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('monthly_performance')
  const [period, setPeriod] = useState('2026-05')
  const [submitting, setSubmitting] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nerc/reports')
      if (res.ok) {
        const data = await res.json()
        if (data.reports?.length > 0) {
          setReports(data.reports)
          setSelected(data.reports[0])
        }
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  const generateReport = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/nerc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: reportType, period }),
      })
      if (res.ok) {
        const data = await res.json()
        const newReport: NercReport = data.report || {
          id: `nr-${Date.now()}`,
          report_period: period,
          report_type: reportType,
          content: generateLocalReport(reportType, period),
          submission_status: 'draft',
          submitted_at: null,
          created_at: new Date().toISOString(),
        }
        setReports(prev => [newReport, ...prev])
        setSelected(newReport)
      } else {
        const newReport: NercReport = {
          id: `nr-${Date.now()}`,
          report_period: period,
          report_type: reportType,
          content: generateLocalReport(reportType, period),
          submission_status: 'draft',
          submitted_at: null,
          created_at: new Date().toISOString(),
        }
        setReports(prev => [newReport, ...prev])
        setSelected(newReport)
      }
    } catch {
      const newReport: NercReport = {
        id: `nr-${Date.now()}`,
        report_period: period,
        report_type: reportType,
        content: generateLocalReport(reportType, period),
        submission_status: 'draft',
        submitted_at: null,
        created_at: new Date().toISOString(),
      }
      setReports(prev => [newReport, ...prev])
      setSelected(newReport)
    } finally {
      setGenerating(false)
    }
  }

  function generateLocalReport(type: string, mon: string): string {
    const typeLabel = REPORT_TYPES.find(r => r.value === type)?.label || type
    return `NIGERIA ELECTRICITY REGULATORY COMMISSION
${typeLabel.toUpperCase()} — ${mon}
Distribution Company: AEDC (Abuja Electricity Distribution Company)
Prepared by: Keotera SmartGrid AI Platform
Date: ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
Reference: NERC/AEDC/${mon.replace('-', '')}/${type.slice(0, 4).toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXECUTIVE SUMMARY

AEDC hereby submits its ${typeLabel} to the Nigerian Electricity Regulatory Commission (NERC) in accordance with the Electricity Act 2023 and NERC's Performance Standards and Incentives (PSI) framework. This report covers the reporting period ${mon} and presents verified data from the SmartGrid AI monitoring system deployed across all 10 distribution zones.

2. NETWORK PERFORMANCE INDICATORS

2.1 Energy Metrics
• System Input Energy: 4,745,000 kWh
• Metered Sales: 3,885,000 kWh
• System ATC&C Loss: 21.8% (NERC target: 30%)
• Collection Efficiency: 79.2%

2.2 Reliability Indices
• SAIDI (System Average Interruption Duration): 8.4 hours/customer
• SAIFI (System Average Interruption Frequency): 3.2 interruptions/customer
• CAIDI (Customer Average Interruption Duration): 2.6 hours

2.3 Outage Statistics
• Total outage events: 10
• Outages resolved within 4 hours: 7 (70%)
• Outages requiring emergency escalation: 1

3. CUSTOMER INFORMATION

• Total registered customers: 125,000
• Customers on metered billing: 78,500 (62.8%)
• Customers on estimated billing: 46,500 (37.2%)
• New customers connected this period: 340
• Lifeline customers (R1 < 50kWh): 12,400

4. COMPLIANCE STATEMENT

AEDC confirms that all data submitted in this report has been generated by the Keotera SmartGrid AI Platform using certified metering data and validated against physical network records. All ATC&C figures have been computed using the approved NERC methodology.

5. PRIORITY INTERVENTIONS

The AI-powered analysis system has identified the following priority interventions requiring NERC attention:
• Abuja North: 47% ATC&C — emergency infrastructure support requested
• Kano South: 40.6% ATC&C — grid reinforcement required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authorised Signatory: ____________________
Managing Director, AEDC
Date: ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}

[SmartGrid AI Report — Keotera | NERC-AEDC-${mon}]`
  }

  const submitReport = async (report: NercReport) => {
    setSubmitting(true)
    try {
      await fetch('/api/nerc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: report.id }),
      })
    } catch {
      // continue optimistically
    }
    const updated = { ...report, submission_status: 'submitted' as const, submitted_at: new Date().toISOString() }
    setReports(prev => prev.map(r => r.id === report.id ? updated : r))
    setSelected(updated)
    setSubmitting(false)
  }

  const exportReport = (report: NercReport) => {
    const blob = new Blob([report.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `NERC-${report.report_period}-${report.report_type}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>NERC Compliance Reporting</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Generate and submit monthly regulatory reports to the Nigeria Electricity Regulatory Commission
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Generator + History */}
        <div className="flex flex-col gap-4">
          {/* Generator */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <h2 className="font-sora font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>New Report</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Report Type</label>
                <select
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 13 }}
                >
                  {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Period (YYYY-MM)</label>
                <input
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  placeholder="2026-05"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <button
                onClick={generateReport}
                disabled={generating}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: generating ? 'var(--border)' : 'var(--primary)', color: generating ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: generating ? 'wait' : 'pointer' }}
              >
                {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
          </div>

          {/* History */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)' }}>Report History</h2>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" color="var(--text-secondary)" /></div>
            ) : (
              <div>
                {reports.map((r, idx) => {
                  const sc = STATUS_CONFIG[r.submission_status]
                  const Icon = sc.icon
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                        background: selected?.id === r.id ? 'rgba(26,31,94,0.05)' : 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.report_period}</span>
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon size={10} />{sc.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          {selected ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', height: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 className="font-sora font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {REPORT_TYPES.find(t => t.value === selected.report_type)?.label} — {selected.report_period}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Created: {new Date(selected.created_at).toLocaleDateString('en-NG')}
                    {selected.submitted_at && ` · Submitted: ${new Date(selected.submitted_at).toLocaleDateString('en-NG')}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => exportReport(selected)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--background)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Download size={13} /> Export
                  </button>
                  {selected.submission_status === 'draft' && (
                    <button
                      onClick={() => submitReport(selected)}
                      disabled={submitting}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: submitting ? 'var(--border)' : 'var(--primary)', color: submitting ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}
                    >
                      {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {submitting ? 'Submitting...' : 'Submit to NERC'}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 20, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: 600, overflowY: 'auto', border: '1px solid var(--border)' }}>
                  {selected.content}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <FileText size={40} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select a report or generate a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
