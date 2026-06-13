import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { customers } = await req.json()

    const prompt = `You are a Nigerian electricity billing expert reviewing customer billing data for AEDC.

Customer billing data:
${customers.map((c: any) => `- ${c.full_name} (${c.account_number}): ${c.billing_type} | Estimated: ${c.estimated_kwh || '?'} kWh | Actual: ${c.actual_kwh || '?'} kWh | Variance: ${c.variance_pct?.toFixed(1) || '?'}% | Lifeline: ${c.is_lifeline ? 'Yes' : 'No'}`).join('\n')}

Provide:
1. List of customers significantly over-billed (variance > 50%, estimated > actual)
2. List of customers under-billed (actual > estimated)
3. Lifeline customer status and subsidy eligibility
4. Priority AMI metering recommendations
5. Customers at risk of billing dispute

Keep response concise and actionable (under 200 words).`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey || anonKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Nigerian electricity billing analyst specialising in AMI metering transition and estimated billing disputes.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (aiRes.ok) {
      const data = await aiRes.json()
      const analysis = data.choices?.[0]?.message?.content || data.response || ''
      return NextResponse.json({ analysis })
    }

    return NextResponse.json({ analysis: '' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
