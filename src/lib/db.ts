import { createClient } from '@insforge/sdk'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export function getDb() {
  return createClient({ baseUrl, anonKey })
}

export type Zone = {
  id: string
  name: string
  state: string
  region: string
  status: 'active' | 'outage' | 'maintenance'
  cause?: string
  severity?: string
  estimated_restoration?: string
  affected_customers?: number
  coordinates?: { lat: number; lng: number }
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  name: string
  account_number: string
  email: string
  phone?: string
  zone_id: string
  tariff_class: string
  meter_number?: string
  address?: string
  created_at: string
}

export type Outage = {
  id: string
  zone_id: string
  cause: string
  severity: string
  status: string
  started_at: string
  resolved_at?: string
  affected_customers?: number
  notes?: string
}

export type FraudAlert = {
  id: string
  customer_id: string
  zone_id: string
  alert_type: string
  confidence_score: number
  status: 'open' | 'confirmed' | 'false_positive' | 'investigating'
  description?: string
  created_at: string
}

export type MeterReading = {
  id: string
  customer_id: string
  reading_kwh: number
  reading_date: string
  is_flagged: boolean
  anomaly_score?: number
}

export type Asset = {
  id: string
  name: string
  asset_type: string
  zone_id: string
  status: string
  coordinates?: { lat: number; lng: number }
  capacity_kw?: number
}

export type Report = {
  id: string
  title: string
  report_type: string
  zone_id?: string
  period_start?: string
  period_end?: string
  content: string
  created_at: string
}

export type ImportJob = {
  id: string
  table_name: string
  filename: string
  status: string
  rows_imported: number
  rows_failed: number
  errors?: string[]
  created_at: string
}

export type LoadReading = {
  id: string
  asset_id: string
  zone_id: string
  load_kw: number
  energy_injected_kwh?: number
  energy_consumed_kwh?: number
  loss_percent?: number
  reading_timestamp: string
}
