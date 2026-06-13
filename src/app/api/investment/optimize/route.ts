import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { budget_naira, recommendations } = await req.json()

    const prompt = `You are a capital allocation expert for Nigerian electricity distribution investment.

Available budget: ₦${(budget_naira/1_000_000).toFixed(0)}M

Available investments (sorted by priority):
${recommendations.map((r: any, i: number) => `${i+1}. ${r.title} — ₦${(r.estimated_cost_naira/1_000_000).toFixed(0)}M — ${r.priority.toUpperCase()} — ${r.expected_loss_reduction_pct}% loss reduction — ${r.roi_months} month ROI`).join('\n')}

Select the optimal combination of investments that:
1. Fits within the budget
2. Maximises total loss reduction percentage points
3. Prioritises critical and high-priority items
4. Considers ROI period

Respond in this exact format:
SELECTED INVESTMENTS:
[list]

TOTAL COST: ₦X M
UNALLOCATED: ₦X M
COMBINED LOSS REDUCTION: X.X percentage points
AVERAGE ROI: X months

RATIONALE: [2-3 sentences]`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey || anonKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a capital allocation optimizer for Nigerian electricity distribution investment projects.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (aiRes.ok) {
      const data = await aiRes.json()
      const result = data.choices?.[0]?.message?.content || data.response || ''
      return NextResponse.json({ result })
    }

    return NextResponse.json({ result: '' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
