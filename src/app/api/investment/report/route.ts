import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { recommendations } = await req.json()

    const prompt = `Generate an executive investment brief for World Bank / AFD evaluators for a Nigerian electricity distribution company (AEDC) using the Keotera SmartGrid AI platform.

Investment recommendations (AI-generated from fraud and ATC&C data):
${recommendations.map((r: any, i: number) => `${i+1}. ${r.title} (${r.priority.toUpperCase()})
   Zone: ${r.zone_name} | Cost: ₦${(r.estimated_cost_naira/1_000_000).toFixed(0)}M
   Expected loss reduction: ${r.expected_loss_reduction_pct}% | ROI: ${r.roi_months} months
   Justification: ${r.description}`).join('\n\n')}

Format as a professional investment brief including:
1. Executive Summary
2. Problem Statement (ATC&C losses in Nigeria context)
3. Proposed Interventions (tabular format)
4. Financial Analysis (NPV, IRR, payback period estimates)
5. Development Impact Metrics (SDG alignment, customers served, jobs created)
6. Implementation Timeline
7. Risk Assessment
8. Conclusion and Recommendation

Use language appropriate for World Bank/AFD development finance evaluators. Reference Nigeria's SE4ALL commitments and NERC regulatory framework. Keep to ~600 words.`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey || anonKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a development finance expert writing investment briefs for World Bank and AFD evaluators on Nigerian energy sector projects.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (aiRes.ok) {
      const data = await aiRes.json()
      const report = data.choices?.[0]?.message?.content || data.response || ''
      return NextResponse.json({ report })
    }

    return NextResponse.json({ report: '' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
