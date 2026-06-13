-- Partnership Tables: Products 1 & 2 for SmartGrid AI

-- DER Assets (Distributed Energy Resources)
CREATE TABLE IF NOT EXISTS der_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id),
  asset_type text NOT NULL,
  name text NOT NULL,
  capacity_kw float NOT NULL,
  lat float NOT NULL,
  lng float NOT NULL,
  status text NOT NULL DEFAULT 'online',
  manufacturer text,
  installation_date date,
  last_sync timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DER Readings (performance data)
CREATE TABLE IF NOT EXISTS der_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  der_asset_id uuid REFERENCES der_assets(id),
  zone_id uuid REFERENCES zones(id),
  output_kw float NOT NULL,
  capacity_kw float NOT NULL,
  utilisation_pct float NOT NULL,
  battery_soc_pct float,
  frequency_hz float,
  voltage float,
  event_type text,
  reading_timestamp timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'simulated'
);

-- VPP Dispatch Log
CREATE TABLE IF NOT EXISTS vpp_dispatch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id),
  dispatch_type text NOT NULL,
  target_asset_ids text NOT NULL,
  commanded_kw float NOT NULL,
  actual_kw float,
  status text NOT NULL DEFAULT 'pending',
  operator_id text NOT NULL,
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text
);

-- ATC&C Loss Attribution Records
CREATE TABLE IF NOT EXISTS atcc_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id),
  feeder_name text NOT NULL,
  period_month text NOT NULL,
  energy_input_kwh float NOT NULL,
  energy_billed_kwh float NOT NULL,
  energy_collected_kwh float NOT NULL,
  technical_loss_pct float NOT NULL,
  commercial_loss_pct float NOT NULL,
  collection_loss_pct float NOT NULL,
  atcc_loss_pct float NOT NULL,
  target_atcc_pct float NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subsidy Records
CREATE TABLE IF NOT EXISTS subsidy_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id),
  period_month text NOT NULL,
  subsidy_type text NOT NULL,
  amount_naira float NOT NULL,
  beneficiary_count integer NOT NULL,
  reconciliation_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- NERC Compliance Reports
CREATE TABLE IF NOT EXISTS nerc_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period text NOT NULL,
  report_type text NOT NULL,
  content text NOT NULL,
  submission_status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Investment Recommendations
CREATE TABLE IF NOT EXISTS investment_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id),
  recommendation_type text NOT NULL,
  priority text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  estimated_cost_naira float NOT NULL,
  expected_loss_reduction_pct float NOT NULL,
  roi_months integer NOT NULL,
  data_source text NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now()
);
