import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { zones, month } = await req.json()

    const worstZone = zones?.[0]
    if (!worstZone) return NextResponse.json({ insight: 'No data available for analysis.' })

    const prompt = `You are a Nigerian electricity distribution expert preparing an ATC&C loss report for NERC.

Analyse the following worst-performing feeders for ${month} and provide a concise plain-English explanation with recommended interventions:

${zones.map((z: any) => `• ${z.feeder_name} (${z.zone_name}): ATC&C ${z.atcc_loss_pct}% — Technical: ${z.technical_loss_pct}%, Commercial: ${z.commercial_loss_pct}%, Collection: ${z.collection_loss_pct}%`).join('\n')}

The NERC target is 30%. Provide:
1. Root cause analysis for each zone above target
2. Specific intervention recommendations (infrastructure, metering, commercial)
3. Expected timeline for improvement
4. Language suitable for NERC regulatory submission

Keep the response under 300 words, professional and actionable.`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey || anonKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Nigerian electricity distribution sector expert specialising in ATC&C loss analysis and NERC regulatory compliance.' },
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
  } catch {
    return NextResponse.json({ insight: '' }, { status: 500 })
  }
}
