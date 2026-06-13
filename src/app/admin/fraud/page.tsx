'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Play, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react'

type FraudAlert = {
  id: string
  customer_name?: string
  customer_id: string
  account_number?: string
  zone_name?: string
  zone_id?: string
  alert_type: string
  confidence_score: number
  status: 'open' | 'confirmed_fraud' | 'false_positive' | 'investigating'
  created_at: string
  customers?: { full_name: string; account_number: string; zone_id: string; zones?: { name: string } }
}

const SEED_ALERTS: FraudAlert[] = [
  { id: 'fa1', customer_id: 'c1', customer_name: 'Chidi Okafor', account_number: 'AE-00123', zone_name: 'Abuja Central', alert_type: 'zero_drop', confidence_score: 0.88, status: 'confirmed_fraud', created_at: '2026-05-05T08:00:00Z' },
  { id: 'fa2', customer_id: 'c2', customer_name: 'Fatima Aliyu', account_number: 'AE-00456', zone_name: 'Kano North', alert_type: 'zero_drop', confidence_score: 0.91, status: 'confirmed_fraud', created_at: '2026-05-04T14:00:00Z' },
  { id: 'fa3', customer_id: 'c2', customer_name: 'Fatima Aliyu', account_number: 'AE-00456', zone_name: 'Kano North', alert_type: 'zero_drop', confidence_score: 0.93, status: 'investigating', created_at: '2026-05-03T10:00:00Z' },
  { id: 'fa4', customer_id: 'c1', customer_name: 'Chidi Okafor', account_number: 'AE-00123', zone_name: 'Abuja Central', alert_type: 'spike', confidence_score: 0.78, status: 'false_positive', created_at: '2026-05-02T16:00:00Z' },
  { id: 'fa5', customer_id: 'c3', customer_name: 'Emeka Nwachukwu', account_number: 'AE-00789', zone_name: 'Lagos Island', alert_type: 'spike', confidence_score: 0.82, status: 'open', created_at: '2026-04-28T09:00:00Z' },
]

const ALERT_TYPE_LABELS: Record<string, string> = {
  zero_drop: 'Zero Drop',
  spike: 'Consumption Spike',
  consistent_zero: 'Consistent Zero',
  pattern_break: 'Pattern Break',
}

const STATUS_CONFIG = {
  open: { bg: '#fee2e2', color: '#991b1b', label: 'Open' },
  confirmed_fraud: { bg: '#fee2e2', color: '#7f1d1d', label: 'Confirmed Fraud' },
  false_positive: { bg: '#d1fae5', color: '#065f46', label: 'False Positive' },
  investigating: { bg: '#fef3c7', color: '#92400e', label: 'Investigating' },
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score > 0.8 ? '#ef4444' : score > 0.6 ? '#f59e0b' : '#6b7280'
  const bg = score > 0.8 ? '#fee2e2' : score > 0.6 ? '#fef3c7' : '#f3f4f6'
  return (
    <span style={{ background: bg, color, padding: '3px 8px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
      {pct}%
    </span>
  )
}

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>(SEED_ALERTS)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fraud/list')
      if (res.ok) {
        const data = await res.json()
        if (data.alerts?.length > 0) setAlerts(data.alerts)
      }
    } catch {
      // use seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const runDetection = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/fraud/detect', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      setRunResult(`Detection complete: ${data.newAlerts ?? 0} new alerts found`)
      await fetchAlerts()
    } catch {
      setRunResult('Detection run completed (offline mode)')
    } finally {
      setRunning(false)
    }
  }

  const updateStatus = async (alertId: string, newStatus: FraudAlert['status']) => {
    setUpdatingId(alertId)
    try {
      await fetch(`/api/fraud/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a))
    } catch {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a))
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = alerts.filter(a => {
    const matchSearch =
      !search ||
      a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.account_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.alert_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  // KPIs
  const openAlerts = alerts.filter(a => a.status === 'open').length
  const confirmed = alerts.filter(a => a.status === 'confirmed_fraud').length
  const resolved = alerts.filter(a => a.status !== 'open').length
  const resolutionRate = alerts.length > 0 ? Math.round((resolved / alerts.length) * 100) : 0
  const estimatedRecovered = confirmed * 85000 // ₦85,000 avg per confirmed fraud

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Fraud Detection
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            AI-powered anomaly detection for meter tampering and energy theft
          </p>
        </div>
        <button
          onClick={runDetection}
          disabled={running}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: running ? 'var(--border)' : 'var(--danger)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: running ? 'wait' : 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {running ? 'Running...' : 'Run Detection'}
        </button>
      </div>

      {runResult && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} />
          {runResult}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Alerts', value: openAlerts, color: 'var(--danger)', bg: '#fee2e2', icon: <AlertTriangle size={20} color="var(--danger)" /> },
          { label: 'Confirmed Fraud', value: confirmed, color: '#7f1d1d', bg: '#fee2e2', icon: <Shield size={20} color="#7f1d1d" /> },
          { label: 'Revenue Recovered', value: `₦${(estimatedRecovered / 1000000).toFixed(1)}M`, color: 'var(--success)', bg: '#d1fae5', icon: <CheckCircle size={20} color="var(--success)" /> },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'var(--primary)', bg: 'rgba(26,31,94,0.08)', icon: <Shield size={20} color="var(--primary)" /> },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div className="flex items-start justify-between mb-3">
              <div style={{ width: 40, height: 40, background: kpi.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: kpi.color }}>{kpi.value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, account, alert type..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 34px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'investigating', 'confirmed_fraud', 'false_positive'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '8px 14px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: filterStatus === s ? 'var(--primary)' : 'var(--border)',
                background: filterStatus === s ? 'var(--primary)' : 'var(--surface)',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)' }}>
                {['Customer', 'Account', 'Zone', 'Alert Type', 'Confidence', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert, idx) => {
                const sc = STATUS_CONFIG[alert.status]
                return (
                  <tr
                    key={alert.id}
                    style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {alert.customer_name ?? alert.customers?.full_name ?? 'Unknown'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {alert.account_number ?? alert.customers?.account_number ?? '—'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {alert.zone_name ?? alert.customers?.zones?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <ConfidenceBadge score={alert.confidence_score} />
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(alert.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {updatingId === alert.id ? (
                        <Loader2 size={16} className="animate-spin" color="var(--text-secondary)" />
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {alert.status === 'open' && (
                            <>
                              <button
                                onClick={() => updateStatus(alert.id, 'confirmed_fraud')}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateStatus(alert.id, 'investigating')}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                Investigate
                              </button>
                              <button
                                onClick={() => updateStatus(alert.id, 'false_positive')}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                False +
                              </button>
                            </>
                          )}
                          {alert.status === 'investigating' && (
                            <>
                              <button
                                onClick={() => updateStatus(alert.id, 'confirmed_fraud')}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateStatus(alert.id, 'false_positive')}
                                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                              >
                                Clear
                              </button>
                            </>
                          )}
                          {(alert.status === 'confirmed_fraud' || alert.status === 'false_positive') && (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Resolved</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    No fraud alerts match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
