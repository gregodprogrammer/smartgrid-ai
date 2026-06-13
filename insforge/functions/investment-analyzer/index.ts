const BASE_URL = Deno.env.get("INSFORGE_URL") ?? "";
const ANON_KEY = Deno.env.get("INSFORGE_ANON_KEY") ?? "";
const SECRET_KEY = Deno.env.get("INSFORGE_SECRET_KEY") ?? "";
const AI_KEY = SECRET_KEY || ANON_KEY;

const authHeader = `Bearer ${AI_KEY}`;

async function dbFrom(table: string, query: string) {
  const res = await fetch(`${BASE_URL}/database/rest/v1/${table}?${query}`, {
    headers: { Authorization: authHeader, apikey: ANON_KEY, Accept: "application/json" },
  });
  if (!res.ok) return [];
  return res.json();
}

async function dbInsert(table: string, rows: Record<string, unknown>[]) {
  await fetch(`${BASE_URL}/database/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
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
    const [fraudAlerts, atccRecords, zones] = await Promise.all([
      dbFrom("fraud_alerts", "select=zone_id,alert_type,confidence_score,status&status=eq.open"),
      dbFrom("atcc_records", "select=zone_id,atcc_loss_pct,commercial_loss_pct,technical_loss_pct&order=atcc_loss_pct.desc&limit=20"),
      dbFrom("zones", "select=id,name"),
    ]);

    const zoneMap = new Map((zones as any[]).map((z: any) => [z.id, z.name]));

    const fraudByZone = new Map<string, number>();
    for (const f of fraudAlerts as any[]) {
      if (f.zone_id) fraudByZone.set(f.zone_id, (fraudByZone.get(f.zone_id) || 0) + 1);
    }

    const atccByZone = new Map<string, any>();
    for (const r of atccRecords as any[]) {
      if (!atccByZone.has(r.zone_id)) atccByZone.set(r.zone_id, r);
    }

    const recommendations: Record<string, unknown>[] = [];

    for (const [zoneId, atcc] of atccByZone.entries()) {
      const zoneName = zoneMap.get(zoneId) || 'Unknown';
      const fraudCount = fraudByZone.get(zoneId) || 0;

      if (atcc.atcc_loss_pct > 30) {
        recommendations.push({
          zone_id: zoneId,
          recommendation_type: 'infrastructure',
          priority: atcc.atcc_loss_pct > 40 ? 'critical' : 'high',
          title: `${zoneName} Infrastructure Rehabilitation`,
          description: `Zone ATC&C loss of ${atcc.atcc_loss_pct.toFixed(1)}% is ${(atcc.atcc_loss_pct - 30).toFixed(1)}pp above NERC target. Technical losses of ${atcc.technical_loss_pct.toFixed(1)}% indicate aging infrastructure requiring rehabilitation.`,
          estimated_cost_naira: atcc.atcc_loss_pct > 40 ? 120_000_000 : 65_000_000,
          expected_loss_reduction_pct: atcc.atcc_loss_pct > 40 ? 20.0 : 10.0,
          roi_months: atcc.atcc_loss_pct > 40 ? 18 : 24,
          data_source: 'atcc_analysis',
          status: 'proposed',
        });
      }

      if (fraudCount >= 2 || atcc.commercial_loss_pct > 8) {
        recommendations.push({
          zone_id: zoneId,
          recommendation_type: 'metering',
          priority: fraudCount >= 3 ? 'critical' : 'high',
          title: `AMI Meter Deployment — ${zoneName}`,
          description: `${fraudCount} open fraud alerts and ${atcc.commercial_loss_pct.toFixed(1)}% commercial losses. AMI metering will eliminate estimated billing and enable remote monitoring.`,
          estimated_cost_naira: fraudCount >= 3 ? 75_000_000 : 45_000_000,
          expected_loss_reduction_pct: atcc.commercial_loss_pct * 0.8,
          roi_months: 20,
          data_source: fraudCount >= 2 ? 'fraud_analysis' : 'atcc_analysis',
          status: 'proposed',
        });
      }
    }

    if (recommendations.length > 0) {
      await dbInsert("investment_recommendations", recommendations);
    }

    return new Response(
      JSON.stringify({ success: true, recommendations_generated: recommendations.length, recommendations }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
