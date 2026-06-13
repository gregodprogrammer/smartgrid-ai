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

function detectAnomalies(
  readings: Array<{ customer_id: string; reading_value: number; read_at: string }>,
  customers: Array<{ id: string; account_number: string; zone_id: string }>,
) {
  const alerts: Array<{ customer_id: string; alert_type: string; confidence_score: number; description: string }> = [];
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const byCustomer = new Map<string, typeof readings>();
  for (const r of readings) {
    if (!byCustomer.has(r.customer_id)) byCustomer.set(r.customer_id, []);
    byCustomer.get(r.customer_id)!.push(r);
  }

  for (const [customerId, cReadings] of byCustomer) {
    if (!customerMap.has(customerId) || cReadings.length < 2) continue;

    const sorted = [...cReadings].sort((a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime());
    const values = sorted.map((r) => r.reading_value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];

    if (latest > avg * 3 && avg > 0) {
      alerts.push({
        customer_id: customerId,
        alert_type: "unusual_consumption_spike",
        confidence_score: Math.min(0.95, 0.6 + (latest / avg - 3) * 0.1),
        description: `Consumption spike: latest ${latest.toFixed(1)} kWh vs avg ${avg.toFixed(1)} kWh (${((latest / avg) * 100).toFixed(0)}% above average).`,
      });
    }

    if (avg > 50 && latest === 0) {
      alerts.push({
        customer_id: customerId,
        alert_type: "meter_tampering_suspected",
        confidence_score: 0.82,
        description: `Zero reading after sustained avg of ${avg.toFixed(1)} kWh. Possible meter bypass.`,
      });
    }

    if (avg < 5 && values.length >= 5) {
      alerts.push({
        customer_id: customerId,
        alert_type: "consistent_under_reporting",
        confidence_score: 0.65,
        description: `Consistently low readings (avg ${avg.toFixed(2)} kWh over ${values.length} readings).`,
      });
    }
  }

  return alerts;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const [readings, customers, existingAlerts] = await Promise.all([
      dbFrom("meter_readings", "select=customer_id,reading_value,read_at&order=read_at.desc&limit=500"),
      dbFrom("customers", "select=id,account_number,zone_id"),
      dbFrom("fraud_alerts", "select=customer_id,alert_type&status=eq.open"),
    ]);

    const existingSet = new Set(
      (existingAlerts as Array<{ customer_id: string; alert_type: string }>).map(
        (a) => `${a.customer_id}:${a.alert_type}`,
      ),
    );

    const detected = detectAnomalies(
      readings as Array<{ customer_id: string; reading_value: number; read_at: string }>,
      customers as Array<{ id: string; account_number: string; zone_id: string }>,
    );

    const newAlerts = detected.filter((a) => !existingSet.has(`${a.customer_id}:${a.alert_type}`));

    if (newAlerts.length > 0) {
      await dbInsert("fraud_alerts", newAlerts.map((a) => ({
        ...a,
        status: "open",
        created_at: new Date().toISOString(),
      })));
    }

    return new Response(
      JSON.stringify({ success: true, scanned: (readings as unknown[]).length, detected: detected.length, inserted: newAlerts.length, alerts: newAlerts }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
