import { NextRequest, NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { assets, dispatches } = await req.json()

    const totalCapacity = assets.reduce((s: number, a: any) => s + a.capacity_kw, 0)
    const currentOutput = assets.reduce((s: number, a: any) => s + (a.output_kw || 0), 0)
    const faultAssets = assets.filter((a: any) => a.status === 'fault')
    const islandedAssets = assets.filter((a: any) => a.status === 'islanded')

    const prompt = `You are a VPP (Virtual Power Plant) dispatch operator for a Nigerian electricity distribution company.

CURRENT GRID STATE:
- Total DER capacity: ${totalCapacity} kW
- Current output: ${currentOutput} kW (${((currentOutput/totalCapacity)*100).toFixed(1)}% utilisation)
- Grid frequency: 49.98 Hz (nominal: 50.00 Hz)
- Fault assets: ${faultAssets.map((a: any) => a.name).join(', ') || 'None'}
- Islanded assets: ${islandedAssets.map((a: any) => a.name).join(', ') || 'None'}

ASSETS:
${assets.map((a: any) => `- ${a.name}: ${a.output_kw}/${a.capacity_kw} kW (${a.status})`).join('\n')}

RECENT DISPATCHES:
${dispatches.map((d: any) => `- ${d.dispatch_type} ${d.commanded_kw} kW → ${d.status}`).join('\n')}

Provide optimal dispatch recommendations for the next 30 minutes. Include:
1. Priority actions (fault recovery, frequency stabilisation)
2. Battery charge/discharge recommendations based on SoC
3. Renewable energy maximisation
4. Reserve capacity maintenance

Keep response under 250 words, structured and actionable.`

    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey || anonKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a VPP dispatch operator expert for Nigerian electricity distribution networks.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (aiRes.ok) {
      const data = await aiRes.json()
      const suggestion = data.choices?.[0]?.message?.content || data.response || ''
      return NextResponse.json({ suggestion })
    }

    return NextResponse.json({ suggestion: '' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
