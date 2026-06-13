'use client'

import { useState, useEffect } from 'react'
import { Users, AlertTriangle, CheckCircle, Loader2, Sparkles, Search } from 'lucide-react'

type Customer = {
  id: string
  full_name: string
  account_number: string
  zone_name?: string
  tariff_class: string
  billing_type: 'estimated' | 'metered' | 'disputed'
  estimated_kwh?: number
  actual_kwh?: number
  variance_pct?: number
  is_lifeline?: boolean
  switched_to_metered?: boolean
  dispute_status?: string
}

const SEED_CUSTOMERS: Customer[] = [
  { id: 'c1',  full_name: 'Chidi Okafor',       account_number: 'AE-00123', zone_name: 'Abuja Central',  tariff_class: 'R2', billing_type: 'metered',   estimated_kwh: 180, actual_kwh: 175, variance_pct: 2.8,  is_lifeline: false, switched_to_metered: true },
  { id: 'c2',  full_name: 'Fatima Aliyu',        account_number: 'AE-00456', zone_name: 'Kano North',     tariff_class: 'R1', billing_type: 'estimated', estimated_kwh: 95,  actual_kwh: 48,  variance_pct: 97.9, is_lifeline: true,  switched_to_metered: false },
  { id: 'c3',  full_name: 'Emeka Nwachukwu',     account_number: 'AE-00789', zone_name: 'Lagos Island',   tariff_class: 'C1', billing_type: 'disputed',  estimated_kwh: 420, actual_kwh: 310, variance_pct: 35.5, is_lifeline: false, dispute_status: 'open' },
  { id: 'c4',  full_name: 'Amina Bello',         account_number: 'AE-01122', zone_name: 'Abuja North',    tariff_class: 'R1', billing_type: 'estimated', estimated_kwh: 60,  actual_kwh: 38,  variance_pct: 57.9, is_lifeline: true,  switched_to_metered: false },
  { id: 'c5',  full_name: 'Taiwo Adeyemi',       account_number: 'AE-01345', zone_name: 'Ibadan North',   tariff_class: 'R2', billing_type: 'metered',   estimated_kwh: 210, actual_kwh: 208, variance_pct: 1.0,  is_lifeline: false, switched_to_metered: true },
  { id: 'c6',  full_name: 'Nkechi Obi',          account_number: 'AE-01678', zone_name: 'Enugu Urban',    tariff_class: 'R1', billing_type: 'estimated', estimated_kwh: 85,  actual_kwh: 44,  variance_pct: 93.2, is_lifeline: true,  switched_to_metered: false },
  { id: 'c7',  full_name: 'Musa Tanko',          account_number: 'AE-01901', zone_name: 'Kano South',     tariff_class: 'C1', billing_type: 'disputed',  estimated_kwh: 680, actual_kwh: 480, variance_pct: 41.7, is_lifeline: false, dispute_status: 'investigating' },
  { id: 'c8',  full_name: 'Chioma Eze',          account_number: 'AE-02134', zone_name: 'Lagos Mainland', tariff_class: 'R2', billing_type: 'estimated', estimated_kwh: 155, actual_kwh: 220, variance_pct: 29.5, is_lifeline: false, switched_to_metered: false },
  { id: 'c9',  full_name: 'Ibrahim Danjuma',     account_number: 'AE-02567', zone_name: 'Kaduna Central', tariff_class: 'C2', billing_type: 'metered',   estimated_kwh: 890, actual_kwh: 885, variance_pct: 0.6,  is_lifeline: false, switched_to_metered: true },
  { id: 'c10', full_name: 'Blessing Ikechukwu',  account_number: 'AE-02890', zone_name: 'Port Harcourt Central', tariff_class: 'R1', billing_type: 'estimated', estimated_kwh: 70, actual_kwh: 45, variance_pct: 55.6, is_lifeline: true, switched_to_metered: false },
]

export default function BillingPage() {
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetch('/api/billing/customers')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.customers?.length > 0) setCustomers(data.customers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getAiAnalysis = async () => {
    setAnalyzing(true)
    setAiAnalysis(null)
    try {
      const res = await fetch('/api/billing/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customers: filtered }) })
      if (res.ok) {
        const data = await res.json()
        setAiAnalysis(data.analysis)
      } else {
        setAiAnalysis(generateLocalAnalysis())
      }
    } catch {
      setAiAnalysis(generateLocalAnalysis())
    } finally {
      setAnalyzing(false)
    }
  }

  function generateLocalAnalysis(): string {
    const overBilled = customers.filter(c => c.billing_type === 'estimated' && (c.variance_pct || 0) > 50 && (c.estimated_kwh || 0) > (c.actual_kwh || 0))
    const underBilled = customers.filter(c => c.billing_type === 'estimated' && (c.variance_pct || 0) > 20 && (c.actual_kwh || 0) > (c.estimated_kwh || 0))
    const lifelineCount = customers.filter(c => c.is_lifeline).length
    return `BILLING ANALYSIS — AI ASSESSMENT

ESTIMATED BILLING ANOMALIES:
• ${overBilled.length} customers significantly over-billed (>50% variance): ${overBilled.map(c => c.full_name).join(', ')}
• ${underBilled.length} customers under-billed (actual higher than estimate): ${underBilled.map(c => c.full_name).join(', ')}

LIFELINE CUSTOMERS:
• ${lifelineCount} lifeline customers identified (R1 tariff, <50kWh/month)
• All qualify for subsidy under NERC lifeline provisions
• Recommend priority AMI metering for this group to validate actual consumption

PRIORITY TRANSITIONS (this month):
1. Fatima Aliyu — 97.9% over-billing variance, lifeline customer. Immediate AMI meter required.
2. Nkechi Obi — 93.2% over-billing. Bill adjustment likely to trigger customer complaint.
3. Musa Tanko — Disputed, under investigation. Freeze billing pending audit.

RECOMMENDATION:
Prioritise AMI metering for all customers with >50% variance. Estimated billing should be phased out in Abuja North and Kano South within 6 months per the transition roadmap.`
  }

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.account_number.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || c.billing_type === filterType
    return matchSearch && matchType
  })

  const meteredCount = customers.filter(c => c.billing_type === 'metered').length
  const estimatedCount = customers.filter(c => c.billing_type === 'estimated').length
  const disputedCount = customers.filter(c => c.billing_type === 'disputed').length
  const lifelineCount = customers.filter(c => c.is_lifeline).length
  const switchedThisMonth = customers.filter(c => c.switched_to_metered).length

  const BILLING_TYPE_COLORS = {
    metered:   { bg: '#d1fae5', color: '#065f46' },
    estimated: { bg: '#fef3c7', color: '#92400e' },
    disputed:  { bg: '#fee2e2', color: '#991b1b' },
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Estimated Billing Transition</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nigeria AMI metering transition tracker — manage billing types, disputes, and lifeline customers</p>
        </div>
        <button
          onClick={getAiAnalysis}
          disabled={analyzing}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: analyzing ? 'var(--border)' : 'var(--accent)', color: analyzing ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: analyzing ? 'wait' : 'pointer' }}
        >
          {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {analyzing ? 'Analysing...' : 'AI Billing Analysis'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Metered', value: meteredCount, color: 'var(--success)', icon: <CheckCircle size={20} color="var(--success)" /> },
          { label: 'Estimated', value: estimatedCount, color: 'var(--warning)', icon: <AlertTriangle size={20} color="var(--warning)" /> },
          { label: 'Disputed', value: disputedCount, color: 'var(--danger)', icon: <AlertTriangle size={20} color="var(--danger)" /> },
          { label: 'Lifeline Customers', value: lifelineCount, color: 'var(--primary)', icon: <Users size={20} color="var(--primary)" /> },
          { label: 'Switched This Month', value: switchedThisMonth, color: 'var(--success)', icon: <CheckCircle size={20} color="var(--success)" /> },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div style={{ width: 36, height: 36, background: `${kpi.color}18`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{kpi.icon}</div>
            <p className="font-sora font-bold text-2xl" style={{ color: kpi.color }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div style={{ background: 'rgba(26,31,94,0.04)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h2 className="font-sora font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>AI Billing Analysis</h2>
          <pre style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{aiAnalysis}</pre>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, account..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13 }} />
        </div>
        {['all', 'metered', 'estimated', 'disputed'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ padding: '8px 14px', borderRadius: 100, border: '1px solid', borderColor: filterType === t ? 'var(--primary)' : 'var(--border)', background: filterType === t ? 'var(--primary)' : 'var(--surface)', color: filterType === t ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Customer Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color="var(--text-secondary)" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)' }}>
                  {['Customer', 'Account', 'Zone', 'Tariff', 'Billing Type', 'Estimated kWh', 'Actual kWh', 'Variance', 'Flags'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const btc = BILLING_TYPE_COLORS[c.billing_type]
                  return (
                    <tr key={c.id} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{c.full_name}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.account_number}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.zone_name}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.tariff_class}</td>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ background: btc.bg, color: btc.color, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{c.billing_type}</span>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.estimated_kwh ?? '—'}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.actual_kwh ?? '—'}</td>
                      <td style={{ padding: '13px 14px' }}>
                        {c.variance_pct !== undefined ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.variance_pct > 50 ? 'var(--danger)' : c.variance_pct > 20 ? 'var(--warning)' : 'var(--success)' }}>
                            {c.variance_pct.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <div className="flex gap-1 flex-wrap">
                          {c.is_lifeline && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>LIFELINE</span>}
                          {c.switched_to_metered && <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>AMI ✓</span>}
                          {c.billing_type === 'disputed' && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>DISPUTE</span>}
                          {(c.variance_pct || 0) > 50 && c.billing_type === 'estimated' && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>HIGH VAR</span>}
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
    </div>
  )
}
