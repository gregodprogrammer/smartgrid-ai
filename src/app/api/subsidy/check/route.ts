import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { records } = await req.json()

    const prompt = `You are a Nigerian electricity subsidy auditor reviewing subsidy claims from a distribution company (AEDC).

Subsidy records:
${records.map((r: any) => `- ${r.zone_name} | ${r.period_month} | ${r.subsidy_type} | ₦${(r.amount_naira/1_000_000).toFixed(1)}M | ${r.beneficiary_count} beneficiaries | ${r.reconciliation_status} | ${r.notes || ''}`).join('\n')}

Cross-check these records and identify:
1. Any records that appear inconsistent with typical consumption patterns
2. Potential over-claims based on beneficiary counts
3. Records requiring immediate audit
4. Records that are clear and can be approved

Provide a concise audit report under 200 words.`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey || anonKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Nigerian electricity sector subsidy auditor with expertise in MYTO, NUEE, and lifeline tariff programmes.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (aiRes.ok) {
      const data = await aiRes.json()
      const insight = data.choices?.[0]?.message?.content || data.response || ''
      return NextResponse.json({ insight })
    }

    return NextResponse.json({ insight: '' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
