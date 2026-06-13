import { redirect } from 'next/navigation'
import { getCurrentViewer } from '@/lib/auth-state'
import { getDb } from '@/lib/db'
import Link from 'next/link'
import { Zap, AlertTriangle, CheckCircle, Clock, Activity, User, LogOut } from 'lucide-react'
import Chatbot from '@/components/chatbot'

export const dynamic = 'force-dynamic'

const DEMO_CUSTOMER_ID = 'c1000000-0000-0000-0000-000000000001'
const DEMO_ZONE_ID = 'a1000000-0000-0000-0000-000000000001'

async function fetchDashboardData() {
  const db = getDb()

  const [customerRes, zoneRes, outagesRes, readingsRes] = await Promise.allSettled([
    db.database.from('customers').select('id, full_name, account_number, email, zone_id, tariff_class').eq('id', DEMO_CUSTOMER_ID).single(),
    db.database.from('zones').select('id, name, state, status, updated_at').eq('id', DEMO_ZONE_ID).single(),
    db.database.from('outages').select('id, cause, severity, started_at, resolved_at, affected_customers, notes').eq('zone_id', DEMO_ZONE_ID).order('started_at', { ascending: false }).limit(5),
    db.database.from('meter_readings').select('id, reading_value, reading_date, is_flagged, anomaly_score').eq('customer_id', DEMO_CUSTOMER_ID).order('reading_date', { ascending: false }).limit(6),
  ])

  const customer = customerRes.status === 'fulfilled' ? customerRes.value.data : null
  const zone = zoneRes.status === 'fulfilled' ? zoneRes.value.data : null
  const outages = outagesRes.status === 'fulfilled' ? (outagesRes.value.data ?? []) : []
  const readings = readingsRes.status === 'fulfilled' ? (readingsRes.value.data ?? []) : []

  return {
    customer: customer ?? {
      id: DEMO_CUSTOMER_ID,
      full_name: 'Chidi Okafor',
      account_number: 'AE-00123',
      email: 'chidi@example.com',
      zone_id: DEMO_ZONE_ID,
      tariff_class: 'R2',
    },
    zone: zone ?? { id: DEMO_ZONE_ID, name: 'Abuja Central', state: 'FCT', status: 'active' },
    outages: outages.length > 0 ? outages : [
      { id: 'o1', cause: 'Feeder 4 fault — overhead line trip', severity: 'medium', started_at: '2026-05-04T08:00:00Z', resolved_at: '2026-05-04T11:30:00Z', affected_customers: 3200, notes: null },
      { id: 'o2', cause: 'Transformer overload', severity: 'high', started_at: '2026-05-02T14:00:00Z', resolved_at: '2026-05-02T18:45:00Z', affected_customers: 8500, notes: null },
    ],
    readings: readings.length > 0 ? readings : [
      { id: 'r1', reading_value: 123.6, reading_date: '2026-05-01', is_flagged: false, anomaly_score: 0.05 },
      { id: 'r2', reading_value: 121.5, reading_date: '2026-04-15', is_flagged: false, anomaly_score: 0.05 },
      { id: 'r3', reading_value: 385.0, reading_date: '2026-03-31', is_flagged: true, anomaly_score: 0.78 },
      { id: 'r4', reading_value: 124.3, reading_date: '2026-03-15', is_flagged: false, anomaly_score: 0.05 },
      { id: 'r5', reading_value: 0.0, reading_date: '2025-12-30', is_flagged: true, anomaly_score: 0.88 },
      { id: 'r6', reading_value: 125.8, reading_date: '2025-12-15', is_flagged: false, anomaly_score: 0.06 },
    ],
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
    outage: { bg: '#fee2e2', color: '#991b1b', label: 'Outage' },
    maintenance: { bg: '#fef3c7', color: '#92400e', label: 'Maintenance' },
    resolved: { bg: '#d1fae5', color: '#065f46', label: 'Resolved' },
  }
  const s = config[status] || { bg: '#f3f4f6', color: '#374151', label: status }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    low: { bg: '#d1fae5', color: '#065f46' },
    medium: { bg: '#fef3c7', color: '#92400e' },
    high: { bg: '#fee2e2', color: '#991b1b' },
    critical: { bg: '#fce7f3', color: '#9d174d' },
  }
  const s = config[severity] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
      {severity?.toUpperCase()}
    </span>
  )
}

export default async function DashboardPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.isAuthenticated) redirect('/auth/sign-in')

  const { customer, zone, outages, readings } = await fetchDashboardData()

  const statusIcon = zone.status === 'active'
    ? <CheckCircle size={20} color="var(--success)" />
    : zone.status === 'outage'
    ? <AlertTriangle size={20} color="var(--danger)" />
    : <Clock size={20} color="var(--warning)" />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <nav style={{ background: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="#fff" fill="#fff" />
              </div>
              <Link href="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#fff', fontSize: 16, textDecoration: 'none' }}>SmartGrid AI</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} color="#fff" />
                </div>
                <span className="text-white text-sm font-medium hidden sm:block">{customer.full_name}</span>
              </div>
              <Link href="/auth/sign-out" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
            Welcome back, {customer.full_name.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Account: <strong>{customer.account_number}</strong> · Tariff: <strong>{customer.tariff_class}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zone Status</p>
                <p className="font-bold text-xl" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>{zone.name}</p>
              </div>
              {statusIcon}
            </div>
            <StatusBadge status={zone.status} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{zone.state}</p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Reading</p>
                <p className="font-bold text-xl" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
                  {readings[0]?.reading_value?.toFixed(1) ?? '—'} <span style={{ fontSize: 14, fontWeight: 400 }}>kWh</span>
                </p>
              </div>
              <Activity size={20} color="var(--primary)" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {readings[0]?.reading_date ? new Date(readings[0].reading_date).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : 'No readings'}
            </p>
            {readings[0]?.is_flagged && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle size={12} color="var(--warning)" />
                <span style={{ fontSize: 11, color: 'var(--warning)' }}>Anomaly detected</span>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outages Recorded</p>
                <p className="font-bold text-xl" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>{outages.length}</p>
              </div>
              <AlertTriangle size={20} color="var(--warning)" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>In {zone.name} zone</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
                Outage History — {zone.name}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Last 5 incidents</p>
            </div>
            <div>
              {outages.slice(0, 5).map((outage: any, idx: number) => (
                <div key={outage.id} style={{ padding: '14px 20px', borderBottom: idx < outages.slice(0, 5).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{outage.cause || 'Unknown cause'}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {outage.severity && <SeverityBadge severity={outage.severity} />}
                      <StatusBadge status={outage.resolved_at ? 'resolved' : 'outage'} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {new Date(outage.started_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {outage.resolved_at && ` → Resolved ${new Date(outage.resolved_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                    {outage.affected_customers && ` · ${outage.affected_customers.toLocaleString()} affected`}
                  </p>
                </div>
              ))}
              {outages.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14 }}>No outages recorded</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>Meter Readings</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Account: {customer.account_number}</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--background)' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reading (kWh)</th>
                    <th style={{ padding: '10px 20px', textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r: any, idx: number) => (
                    <tr key={r.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)' }}>
                        {new Date(r.reading_date).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {Number(r.reading_value).toFixed(1)}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        {r.is_flagged ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>⚠ Flagged</span>
                        ) : (
                          <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>SmartGrid Assistant</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ask about your zone status, billing, or report an issue</p>
          </div>
          <Chatbot zoneContext={`${zone.name} zone, ${zone.state}. Customer: ${customer.full_name} (${customer.tariff_class} tariff). Zone status: ${zone.status}`} embedded />
        </div>
      </div>
    </div>
  )
}
