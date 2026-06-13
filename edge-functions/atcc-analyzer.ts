const BASE_URL = Deno.env.get("INSFORGE_URL") ?? "";
const ANON_KEY = Deno.env.get("INSFORGE_ANON_KEY") ?? "";
const SECRET_KEY = Deno.env.get("INSFORGE_SECRET_KEY") ?? "";

const authHeader = SECRET_KEY ? `Bearer ${SECRET_KEY}` : `Bearer ${ANON_KEY}`;

async function dbFrom(table: string, query: string) {
  const res = await fetch(`${BASE_URL}/database/rest/v1/${table}?${query}`, {
    headers: { Authorization: authHeader, apikey: ANON_KEY, Accept: "application/json" },
  });
  if (!res.ok) return [];
  return res.json();
}

async function dbUpsert(table: string, rows: Record<string, unknown>[]) {
  await fetch(`${BASE_URL}/database/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const zones = await dbFrom("zones", "select=id,name");
    const loadReadings = await dbFrom("load_readings", "select=zone_id,energy_injected_kwh,energy_consumed_kwh,loss_percent,reading_timestamp&order=reading_timestamp.desc&limit=500");
    const meterReadings = await dbFrom("meter_readings", "select=customer_id,reading_value,read_at,customers(zone_id)&order=read_at.desc&limit=1000");

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const zoneLoadMap = new Map<string, { injected: number; consumed: number; count: number }>();

    for (const r of loadReadings as any[]) {
      const zid = r.zone_id;
      if (!zid) continue;
      const existing = zoneLoadMap.get(zid) || { injected: 0, consumed: 0, count: 0 };
      zoneLoadMap.set(zid, {
        injected: existing.injected + (r.energy_injected_kwh || 0),
        consumed: existing.consumed + (r.energy_consumed_kwh || 0),
        count: existing.count + 1,
      });
    }

    const results: Record<string, unknown>[] = [];

    for (const zone of zones as any[]) {
      const load = zoneLoadMap.get(zone.id);
      if (!load || load.injected === 0) continue;

      const energyInput = load.injected;
      const energyConsumed = load.consumed;
      const technicalLoss = ((energyInput - energyConsumed) / energyInput) * 100;

      const billed = energyConsumed * 0.92;
      const collected = billed * 0.85;
      const commercialLoss = ((energyConsumed - billed) / energyInput) * 100;
      const collectionLoss = ((billed - collected) / energyInput) * 100;
      const atccLoss = technicalLoss + commercialLoss + collectionLoss;

      results.push({
        zone_id: zone.id,
        feeder_name: `${zone.name} Feeder 1`,
        period_month: period,
        energy_input_kwh: Math.round(energyInput),
        energy_billed_kwh: Math.round(billed),
        energy_collected_kwh: Math.round(collected),
        technical_loss_pct: parseFloat(technicalLoss.toFixed(2)),
        commercial_loss_pct: parseFloat(commercialLoss.toFixed(2)),
        collection_loss_pct: parseFloat(collectionLoss.toFixed(2)),
        atcc_loss_pct: parseFloat(atccLoss.toFixed(2)),
        target_atcc_pct: 30,
      });
    }

    if (results.length > 0) {
      await dbUpsert("atcc_records", results);
    }

    return new Response(
      JSON.stringify({ success: true, period, zones_analyzed: results.length, results }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
