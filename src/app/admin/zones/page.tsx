'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Edit2, X, Save, CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react'

type Zone = {
  id: string
  name: string
  state: string
  region?: string
  status: 'active' | 'outage' | 'maintenance'
  cause?: string
  severity?: string
  estimated_restoration?: string
  affected_customers?: number
  notes?: string
  updated_at?: string
}

const STATUS_CONFIG = {
  active: { bg: '#d1fae5', color: '#065f46', label: 'Active', icon: CheckCircle },
  outage: { bg: '#fee2e2', color: '#991b1b', label: 'Outage', icon: AlertTriangle },
  maintenance: { bg: '#fef3c7', color: '#92400e', label: 'Maintenance', icon: Clock },
}

const SEED_ZONES: Zone[] = [
  { id: 'a1000000-0000-0000-0000-000000000001', name: 'Abuja Central', state: 'FCT', status: 'active', affected_customers: 42000 },
  { id: 'a1000000-0000-0000-0000-000000000002', name: 'Abuja North', state: 'FCT', status: 'outage', cause: 'Feeder fault — transformer overload', severity: 'high', affected_customers: 18500 },
  { id: 'a1000000-0000-0000-0000-000000000003', name: 'Lagos Island', state: 'Lagos', status: 'active', affected_customers: 65000 },
  { id: 'z4', name: 'Kano North', state: 'Kano', status: 'active', affected_customers: 31200 },
  { id: 'z5', name: 'Port Harcourt', state: 'Rivers', status: 'maintenance', cause: 'Scheduled maintenance', affected_customers: 22000 },
  { id: 'z6', name: 'Ibadan Metro', state: 'Oyo', status: 'active', affected_customers: 38400 },
  { id: 'z7', name: 'Enugu Central', state: 'Enugu', status: 'active', affected_customers: 19800 },
  { id: 'z8', name: 'Benin City', state: 'Edo', status: 'outage', cause: 'Vandalism — transmission line', severity: 'critical', affected_customers: 14200 },
  { id: 'z9', name: 'Kaduna South', state: 'Kaduna', status: 'active', affected_customers: 26500 },
  { id: 'z10', name: 'Maiduguri', state: 'Borno', status: 'active', affected_customers: 12100 },
]

function StatusBadge({ status }: { status: Zone['status'] }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

function EditModal({ zone, onClose, onSave }: { zone: Zone; onClose: () => void; onSave: (updated: Zone) => void }) {
  const [form, setForm] = useState({
    status: zone.status,
    cause: zone.cause ?? '',
    severity: zone.severity ?? 'low',
    estimated_restoration: zone.estimated_restoration
      ? new Date(zone.estimated_restoration).toISOString().slice(0, 16)
      : '',
    notes: zone.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/zones/${zone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        onSave({ ...zone, ...form })
        onClose()
      } else {
        const body = await res.json().catch(() => ({}))
        setSaveError(body.error || `Server error (${res.status}) — please try again.`)
      }
    } catch {
      setSaveError('Network error — please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-sora font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Edit Zone</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{zone.name} · {zone.state}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{saveError}</p>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as Zone['status'] }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
            >
              <option value="active">Active</option>
              <option value="outage">Outage</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {form.status !== 'active' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Cause
                </label>
                <input
                  value={form.cause}
                  onChange={e => setForm(f => ({ ...f, cause: e.target.value }))}
                  placeholder="e.g. Feeder fault, transformer overload..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Severity
                </label>
                <select
                  value={form.severity}
                  onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Estimated Restoration
                </label>
                <input
                  type="datetime-local"
                  value={form.estimated_restoration}
                  onChange={e => setForm(f => ({ ...f, estimated_restoration: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes for this zone..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>(SEED_ZONES)
  const [loading, setLoading] = useState(true)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchZones = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zones')
      if (res.ok) {
        const data = await res.json()
        if (data.zones?.length > 0) setZones(data.zones)
      }
    } catch {
      // Use seed data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const filtered = filterStatus === 'all' ? zones : zones.filter(z => z.status === filterStatus)

  const summary = {
    total: zones.length,
    active: zones.filter(z => z.status === 'active').length,
    outage: zones.filter(z => z.status === 'outage').length,
    maintenance: zones.filter(z => z.status === 'maintenance').length,
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-sora font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Zone Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {summary.total} zones · {summary.active} active · {summary.outage} outage · {summary.maintenance} maintenance
          </p>
        </div>
        <button
          onClick={fetchZones}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            flexShrink: 0,
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'active', 'outage', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '8px 16px',
              borderRadius: 100,
              border: '1px solid',
              borderColor: filterStatus === s ? 'var(--primary)' : 'var(--border)',
              background: filterStatus === s ? 'var(--primary)' : 'var(--surface)',
              color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {s === 'all' ? `All (${summary.total})` : `${s} (${summary[s as keyof typeof summary]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)' }}>
                {['Zone Name', 'State', 'Status', 'Cause', 'Affected Customers', 'Est. Restoration', 'Actions'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((zone, idx) => (
                <tr
                  key={zone.id}
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {zone.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{zone.state}</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={zone.status} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {zone.cause ?? '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {zone.affected_customers?.toLocaleString() ?? '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {zone.estimated_restoration
                      ? new Date(zone.estimated_restoration).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setEditingZone(zone)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: 'rgba(26,31,94,0.06)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    No zones found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingZone && (
        <EditModal
          zone={editingZone}
          onClose={() => setEditingZone(null)}
          onSave={updated => {
            setZones(prev => prev.map(z => z.id === updated.id ? updated : z))
            setEditingZone(null)
          }}
        />
      )}
    </div>
  )
}
