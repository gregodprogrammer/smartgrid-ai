-- Seed Data: DER Assets (10)
INSERT INTO der_assets (id, zone_id, asset_type, name, capacity_kw, lat, lng, status, manufacturer, installation_date, last_sync) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'solar_panel',  'Abuja Central Solar Farm',          500,  9.0579,  7.4951, 'online',   'Siemens',    '2024-03-15', now() - interval '5 minutes'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'solar_panel',  'Lagos Island Solar Array',          300,  6.4541,  3.3947, 'online',   'SunPower',   '2024-06-01', now() - interval '3 minutes'),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'solar_panel',  'Kano North Solar Installation',     200, 12.0022,  8.5920, 'online',   'JA Solar',   '2024-09-10', now() - interval '7 minutes'),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'battery_bank', 'Abuja Central Battery Storage',    1000,  9.0650,  7.4900, 'online',   'Tesla',      '2024-04-20', now() - interval '2 minutes'),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'battery_bank', 'Port Harcourt Battery Bank',        500,  4.8156,  7.0498, 'online',   'CATL',       '2024-07-12', now() - interval '4 minutes'),
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'inverter',     'Enugu Urban Grid Inverter',         150,  6.4698,  7.5482, 'online',   'ABB',        '2023-11-05', now() - interval '6 minutes'),
  ('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000009', 'inverter',     'Ibadan North Inverter Station',     200,  7.3775,  3.9470, 'fault',    'Schneider',  '2023-08-22', now() - interval '30 minutes'),
  ('d1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', 'mini_grid',    'Kano South Mini-Grid',              800, 11.9500,  8.5200, 'islanded', 'PowerAfrica','2023-05-18', now() - interval '15 minutes'),
  ('d1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000010', 'mini_grid',    'Kaduna Central Mini-Grid',          600, 10.5264,  7.4381, 'online',   'GreenPower', '2024-01-30', now() - interval '8 minutes'),
  ('d1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'generator',    'Abuja North Emergency Generator',   400,  9.1200,  7.4600, 'online',   'Caterpillar','2022-12-01', now() - interval '1 minute');

-- Seed Data: DER Readings (30 — 3 per asset)
INSERT INTO der_readings (der_asset_id, zone_id, output_kw, capacity_kw, utilisation_pct, battery_soc_pct, frequency_hz, voltage, event_type, reading_timestamp, source) VALUES
  -- Solar Abuja Central (d1)
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 420, 500, 84.0, null, 50.02, 415.0, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 380, 500, 76.0, null, 50.01, 414.5, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 460, 500, 92.0, null, 50.00, 415.2, 'normal',              now() - interval '3 hours', 'live'),
  -- Solar Lagos Island (d2)
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003', 250, 300, 83.3, null, 49.95, 413.0, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003', 210, 300, 70.0, null, 49.90, 412.0, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003', 180, 300, 60.0, null, 50.05, 415.5, 'normal',              now() - interval '3 hours', 'live'),
  -- Solar Kano North (d3)
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005', 160, 200, 80.0, null, 50.03, 414.0, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005', 145, 200, 72.5, null, 50.01, 413.8, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005', 170, 200, 85.0, null, 50.00, 414.5, 'normal',              now() - interval '3 hours', 'live'),
  -- Battery Abuja Central (d4)
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001', 200,1000, 20.0, 78.5, 50.02, 415.0, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001', 350,1000, 35.0, 65.0, 50.01, 415.1, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001', 100,1000, 10.0, 82.0, 50.00, 414.9, 'normal',              now() - interval '3 hours', 'live'),
  -- Battery Port Harcourt (d5)
  ('d1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000007', 120, 500, 24.0, 61.0, 50.01, 414.2, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000007', 200, 500, 40.0, 55.0, 50.02, 414.5, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000007', 300, 500, 60.0, 48.0, 50.00, 413.8, 'normal',              now() - interval '3 hours', 'live'),
  -- Inverter Enugu (d6)
  ('d1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000008', 120, 150, 80.0, null, 50.01, 414.0, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000008', 110, 150, 73.3, null, 50.00, 413.5, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000008', 130, 150, 86.7, null, 50.02, 415.0, 'normal',              now() - interval '3 hours', 'live'),
  -- Inverter Ibadan (d7) — fault
  ('d1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000009',   0, 200,  0.0, null, 49.80, 390.0, 'frequency_deviation', now() - interval '30 minutes','live'),
  ('d1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000009', 180, 200, 90.0, null, 50.01, 414.5, 'normal',              now() - interval '4 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000009', 160, 200, 80.0, null, 50.00, 414.0, 'normal',              now() - interval '6 hours', 'live'),
  -- Mini-Grid Kano South (d8) — islanding events
  ('d1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000006', 600, 800, 75.0, null, 50.10, 416.0, 'islanding',           now() - interval '15 minutes','live'),
  ('d1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000006', 580, 800, 72.5, null, 50.08, 415.5, 'islanding',           now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000006', 700, 800, 87.5, null, 50.01, 415.0, 'reconnection',        now() - interval '1 day',   'live'),
  -- Mini-Grid Kaduna (d9)
  ('d1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000010', 480, 600, 80.0, null, 50.01, 414.8, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000010', 450, 600, 75.0, null, 50.00, 414.5, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000010', 510, 600, 85.0, null, 50.02, 415.2, 'normal',              now() - interval '3 hours', 'live'),
  -- Generator Abuja North (d10)
  ('d1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000002', 350, 400, 87.5, null, 49.98, 413.5, 'normal',              now() - interval '1 hour',  'live'),
  ('d1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000002', 320, 400, 80.0, null, 49.97, 413.0, 'normal',              now() - interval '2 hours', 'live'),
  ('d1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000002', 380, 400, 95.0, null, 49.99, 414.0, 'normal',              now() - interval '3 hours', 'live');

-- Seed Data: VPP Dispatch Log (5)
INSERT INTO vpp_dispatch (zone_id, dispatch_type, target_asset_ids, commanded_kw, actual_kw, status, operator_id, dispatched_at, completed_at, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001','ramp_up',    'd1000000-0000-0000-0000-000000000001,d1000000-0000-0000-0000-000000000004', 800, 785, 'completed', 'op-admin-001', now() - interval '3 hours', now() - interval '2 hours 50 minutes', 'Peak demand response: morning load ramp'),
  ('a1000000-0000-0000-0000-000000000007','discharge',  'd1000000-0000-0000-0000-000000000005',                                     300, 295, 'completed', 'op-admin-001', now() - interval '6 hours', now() - interval '5 hours 45 minutes', 'Battery discharge to cover grid deficit'),
  ('a1000000-0000-0000-0000-000000000002','curtail',    'd1000000-0000-0000-0000-000000000010',                                     200, null,'pending',   'op-admin-002', now() - interval '10 minutes', null,                                'Curtail generator ahead of grid restoration'),
  ('a1000000-0000-0000-0000-000000000009','charge',     'd1000000-0000-0000-0000-000000000005',                                     150, null,'failed',    'op-admin-001', now() - interval '1 day',    now() - interval '23 hours 55 minutes','Communication failure — asset offline during command'),
  ('a1000000-0000-0000-0000-000000000006','island',     'd1000000-0000-0000-0000-000000000008',                                     600, 600, 'completed', 'op-admin-003', now() - interval '2 days',   now() - interval '1 day 23 hours 50 minutes','Planned islanding for Kano South feeder maintenance');

-- Seed Data: ATC&C Records (20 — 2 months × 10 zones)
INSERT INTO atcc_records (zone_id, feeder_name, period_month, energy_input_kwh, energy_billed_kwh, energy_collected_kwh, technical_loss_pct, commercial_loss_pct, collection_loss_pct, atcc_loss_pct, target_atcc_pct) VALUES
  -- 2026-03
  ('a1000000-0000-0000-0000-000000000001','Abuja Central Feeder 1','2026-03',580000,510000,490000, 8.2,  3.4, 3.9, 15.5, 30),
  ('a1000000-0000-0000-0000-000000000002','Abuja North Feeder 1',  '2026-03',420000,290000,240000,12.5, 14.1,20.5, 47.1, 30),
  ('a1000000-0000-0000-0000-000000000003','Lagos Island Feeder 1', '2026-03',650000,590000,565000, 7.1,  2.3, 3.8, 13.2, 30),
  ('a1000000-0000-0000-0000-000000000004','Lagos Mainland Feeder 1','2026-03',720000,610000,560000, 9.3,  6.0, 7.5, 22.8, 30),
  ('a1000000-0000-0000-0000-000000000005','Kano North Feeder 1',   '2026-03',390000,320000,295000,10.5,  7.7, 7.8, 26.0, 30),
  ('a1000000-0000-0000-0000-000000000006','Kano South Feeder 1',   '2026-03',310000,210000,180000,13.2, 12.9,14.7, 40.8, 30),
  ('a1000000-0000-0000-0000-000000000007','Port Harcourt Feeder 1','2026-03',480000,430000,410000, 7.8,  2.5, 4.7, 15.0, 30),
  ('a1000000-0000-0000-0000-000000000008','Enugu Urban Feeder 1',  '2026-03',350000,300000,280000, 9.5,  5.7, 6.8, 22.0, 30),
  ('a1000000-0000-0000-0000-000000000009','Ibadan North Feeder 1', '2026-03',440000,390000,370000, 8.8,  3.6, 5.2, 17.6, 30),
  ('a1000000-0000-0000-0000-000000000010','Kaduna Central Feeder 1','2026-03',520000,460000,440000, 8.1,  3.5, 4.4, 16.0, 30),
  -- 2026-04
  ('a1000000-0000-0000-0000-000000000001','Abuja Central Feeder 1','2026-04',595000,525000,505000, 7.9,  3.2, 3.8, 14.9, 30),
  ('a1000000-0000-0000-0000-000000000002','Abuja North Feeder 1',  '2026-04',430000,295000,245000,12.1, 14.0,20.0, 46.1, 30),
  ('a1000000-0000-0000-0000-000000000003','Lagos Island Feeder 1', '2026-04',660000,600000,575000, 7.0,  2.2, 3.8, 13.0, 30),
  ('a1000000-0000-0000-0000-000000000004','Lagos Mainland Feeder 1','2026-04',730000,615000,565000, 9.1,  6.2, 7.4, 22.7, 30),
  ('a1000000-0000-0000-0000-000000000005','Kano North Feeder 1',   '2026-04',400000,330000,305000,10.2,  7.5, 7.7, 25.4, 30),
  ('a1000000-0000-0000-0000-000000000006','Kano South Feeder 1',   '2026-04',315000,215000,183000,13.0, 12.7,14.9, 40.6, 30),
  ('a1000000-0000-0000-0000-000000000007','Port Harcourt Feeder 1','2026-04',490000,440000,420000, 7.5,  2.4, 4.6, 14.5, 30),
  ('a1000000-0000-0000-0000-000000000008','Enugu Urban Feeder 1',  '2026-04',355000,305000,285000, 9.2,  5.5, 6.7, 21.4, 30),
  ('a1000000-0000-0000-0000-000000000009','Ibadan North Feeder 1', '2026-04',445000,395000,375000, 8.5,  3.5, 5.1, 17.1, 30),
  ('a1000000-0000-0000-0000-000000000010','Kaduna Central Feeder 1','2026-04',525000,465000,445000, 7.9,  3.4, 4.2, 15.5, 30);

-- Seed Data: Investment Recommendations (8)
INSERT INTO investment_recommendations (zone_id, recommendation_type, priority, title, description, estimated_cost_naira, expected_loss_reduction_pct, roi_months, data_source, status) VALUES
  ('a1000000-0000-0000-0000-000000000006','infrastructure','critical','Replace Kano South Transformer (500kVA)','Aging transformer contributing to 13%+ technical losses. Replacement with modern 500kVA unit will cut technical losses to under 5% and improve reliability.', 48000000, 8.2, 14, 'atcc_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000002','infrastructure','critical','Abuja North Feeder Reconstruction','Vandalism damage and deteriorated infrastructure driving 47% ATC&C. Full feeder reconstruction required to restore normal operations.', 120000000, 25.0, 18, 'atcc_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000002','metering','high','Deploy 2,500 AMI Meters — Abuja North','High-fraud zone with confirmed meter tampering. AMI deployment eliminates estimated billing disputes and enables remote disconnection.', 75000000, 12.5, 22, 'fraud_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000006','metering','high','Deploy 1,800 AMI Meters — Kano South','Commercial loss of 12.9% driven by unmetered connections and under-reporting. AMI metering to cover all C2-C3 customers.', 54000000, 10.8, 20, 'fraud_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000004','metering','high','Smart Meter Rollout — Lagos Mainland','Lagos Mainland running at 22.8% ATC&C. 3,000-unit AMI deployment targeting industrial and commercial customers first.', 90000000, 9.4, 24, 'atcc_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000004','infrastructure','medium','Lagos Mainland Feeder Upgrade (33kV)','Overloaded 33kV feeder causing technical losses of 9.3%. Upgrade to reduce resistive losses and improve power factor.', 65000000, 5.0, 30, 'load_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000004','anti_theft','medium','Anti-Theft Clamp Programme — Lagos Mainland','Deploy tamper-evident clamps on all service connections in high-fraud streets identified by AI analysis.', 12000000, 3.5, 10, 'fraud_analysis', 'proposed'),
  ('a1000000-0000-0000-0000-000000000009','capacity_expansion','low','Ibadan North Capacity Expansion (20MW)','Load growth projections indicate 20MW capacity shortfall by 2027. Pre-position infrastructure now to avoid emergency procurement premium.', 180000000, 0.0, 48, 'load_analysis', 'proposed');

-- Seed Data: Subsidy Records (10 — 2 months × 5 zones)
INSERT INTO subsidy_records (zone_id, period_month, subsidy_type, amount_naira, beneficiary_count, reconciliation_status, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001','2026-03','MYTO',      45000000, 12500, 'approved',  'MYTO tariff shortfall subsidy March 2026'),
  ('a1000000-0000-0000-0000-000000000002','2026-03','lifeline',   8500000,  3200, 'approved',  'Lifeline tariff support for R1 customers'),
  ('a1000000-0000-0000-0000-000000000003','2026-03','NUEE',      22000000,  6800, 'pending',   'NUEE rural electrification supplement'),
  ('a1000000-0000-0000-0000-000000000005','2026-03','state_subsidy',15000000,4500,'pending',   'Kano State government subsidy for indigent customers'),
  ('a1000000-0000-0000-0000-000000000006','2026-03','lifeline',   6200000,  2100, 'disputed',  'Beneficiary count disputed — field audit required'),
  ('a1000000-0000-0000-0000-000000000001','2026-04','MYTO',      46500000, 12700, 'pending',   'MYTO tariff shortfall subsidy April 2026'),
  ('a1000000-0000-0000-0000-000000000002','2026-04','lifeline',   8700000,  3250, 'pending',   'Lifeline tariff support April 2026'),
  ('a1000000-0000-0000-0000-000000000003','2026-04','NUEE',      22500000,  6900, 'pending',   'NUEE supplement April 2026'),
  ('a1000000-0000-0000-0000-000000000005','2026-04','state_subsidy',15500000,4600,'approved',  'Kano State subsidy April — audit cleared'),
  ('a1000000-0000-0000-0000-000000000006','2026-04','lifeline',   6400000,  2150, 'pending',   'Awaiting field reconciliation');

-- Seed Data: NERC Reports (3)
INSERT INTO nerc_reports (report_period, report_type, content, submission_status, submitted_at) VALUES
  ('2026-03','monthly_performance',
   'NERC MONTHLY PERFORMANCE REPORT — MARCH 2026
Submitted by: Keotera SmartGrid AI Platform
Distribution Company: AEDC (Abuja Electricity Distribution Company)

1. NETWORK PERFORMANCE SUMMARY
Total energy injected: 4,660,000 kWh across 10 distribution zones
Total energy billed: 3,819,000 kWh
System ATC&C Loss: 22.1% (target: 30%)
Outage incidents: 12 (4 resolved, 8 active)
Average restoration time: 4.2 hours

2. ZONE PERFORMANCE
Best performing: Abuja Central (15.5% ATC&C)
Worst performing: Abuja North (47.1% ATC&C — vandalism-related)
Above NERC threshold: Abuja North, Kano South

3. CUSTOMER METRICS
Total customers served: 125,000
Customers affected by outages: 18,500
Complaints received: 342
Complaints resolved: 298 (87%)

4. RECOMMENDATIONS
Priority intervention required at Abuja North and Kano South feeders.',
   'submitted', now() - interval '45 days'),

  ('2026-04','monthly_performance',
   'NERC MONTHLY PERFORMANCE REPORT — APRIL 2026
Submitted by: Keotera SmartGrid AI Platform
Distribution Company: AEDC

1. NETWORK PERFORMANCE SUMMARY
Total energy injected: 4,745,000 kWh across 10 distribution zones
Total energy billed: 3,885,000 kWh
System ATC&C Loss: 21.8% (target: 30%) — improvement of 0.3% vs prior month
Outage incidents: 10 (7 resolved, 3 active)
Average restoration time: 3.9 hours

2. ZONE PERFORMANCE
Best performing: Lagos Island (13.0% ATC&C)
Worst performing: Abuja North (46.1% ATC&C)
Above NERC threshold: Abuja North, Kano South

3. AI INSIGHTS
Fraud detection engine identified 8 new meter tampering cases.
Investment recommendations generated for 8 priority interventions.

4. REGULATORY COMPLIANCE
ATC&C reporting: Compliant
Outage notification: Compliant
Customer complaint log: Compliant',
   'submitted', now() - interval '15 days'),

  ('2026-05','atcc_report',
   'NERC ATC&C LOSS REPORT — MAY 2026 (DRAFT)
Prepared by: Keotera SmartGrid AI Platform

SYSTEM-WIDE ATC&C SUMMARY (DRAFT — PENDING FINAL DATA)
Reporting period: May 2026
Status: In preparation

Key metrics being compiled:
- Energy injection data: In collection
- Billing reconciliation: In progress
- Collection efficiency: Pending month-end close

This report will be submitted to NERC Abuja by 15 June 2026 per regulatory schedule.
AI-assisted narrative sections will be generated upon data finalisation.',
   'draft', null);
