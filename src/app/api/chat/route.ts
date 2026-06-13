import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!
const secretKey = process.env.INSFORGE_SECRET_KEY!
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!

const SYSTEM_PROMPT = `You are SmartGrid Assistant — the official AI helper for SmartGrid AI, built by Keotera for Nigeria's electricity management.

You help electricity customers with:
- Current outage status for any zone (use the LIVE ZONE DATA provided below)
- Estimated restoration times
- Understanding electricity bills and tariff classes (R1, R2, C1, C2, D1)
- Reporting power issues
- Energy saving tips for Nigeria's climate
- How to read a meter

Personality: warm, empathetic, and practical. Power outages in Nigeria are genuinely disruptive — take that seriously.

Language rules:
- If the user writes in standard English → respond in English.
- If the user writes in Nigerian Pidgin English → respond in Pidgin. Example: "No worry, light go come back soon for your area. E be feeder fault — dem dey work am now."
- You may mix both in the same reply when it helps (e.g. a technical term in English followed by a Pidgin clarification).

Never invent restoration times. If unknown, say so honestly and refer to AEDC hotline: 09-8704700 or abujaelectricity.com

Keep responses concise and actionable.`

async function fetchLiveZoneContext(): Promise<string> {
  try {
    const db = getDb()

    const { data: allZones } = await db.database
      .from('zones')
      .select('name, state, status, updated_at')
      .order('status')

    if (!allZones || allZones.length === 0) return ''

    const active = allZones.filter((z: any) => z.status === 'active')
    const outage = allZones.filter((z: any) => z.status === 'outage')
    const maintenance = allZones.filter((z: any) => z.status === 'maintenance')

    const lines: string[] = [
      `\n\n--- LIVE GRID STATUS (${new Date().toLocaleString('en-NG')}) ---`,
      `Network summary: ${active.length} zones active, ${outage.length} zones with outages, ${maintenance.length} zones under maintenance.`,
    ]

    if (outage.length > 0) {
      lines.push('\nZones currently experiencing OUTAGES:')
      for (const z of outage) {
        lines.push(`  • ${z.name} (${z.state}) — OUTAGE since ${new Date(z.updated_at).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' })}`)
      }
    }

    if (maintenance.length > 0) {
      lines.push('\nZones under MAINTENANCE:')
      for (const z of maintenance) {
        lines.push(`  • ${z.name} (${z.state}) — MAINTENANCE`)
      }
    }

    if (active.length > 0) {
      lines.push(`\nZones with ACTIVE power supply: ${active.map((z: any) => z.name).join(', ')}.`)
    }

    lines.push('--- END OF LIVE DATA ---')
    return lines.join('\n')
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, zoneContext } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const liveZoneData = await fetchLiveZoneContext()
    const systemContent = SYSTEM_PROMPT +
      (zoneContext ? `\n\nUser's zone context: ${zoneContext}` : '') +
      liveZoneData

    let assistantResponse = ''
    let aiSuccess = false

    try {
      const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey || anonKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: message },
          ],
        }),
      })

      if (aiRes.ok) {
        const aiData = await aiRes.json()
        assistantResponse =
          aiData.choices?.[0]?.message?.content ||
          aiData.message?.content ||
          aiData.response ||
          ''
        if (assistantResponse) aiSuccess = true
      }
    } catch {
      // Fall through to fallback
    }

    if (!aiSuccess || !assistantResponse) {
      assistantResponse = generateFallbackResponse(message, liveZoneData)
    }

    try {
      const db = getDb()
      const sid = sessionId || `session-${Date.now()}`
      await db.database.from('chat_messages').insert([
        { session_id: sid, role: 'user', content: message },
        { session_id: sid, role: 'assistant', content: assistantResponse },
      ])
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ response: assistantResponse, sessionId })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message', response: 'Sorry, I encountered a technical issue. Please try again.' },
      { status: 500 }
    )
  }
}

function generateFallbackResponse(message: string, liveData: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('outage') || lower.includes('power') || lower.includes('light') || lower.includes('current')) {
    if (liveData.includes('OUTAGES:')) {
      const outageSection = liveData.split('OUTAGES:')[1]?.split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim()).join(', ') || ''
      return `Based on our live grid data, the following zones are currently experiencing outages: ${outageSection}. Our field engineers are working to restore supply as quickly as possible. For updates, call AEDC on 09-8704700.`
    }
    return 'Based on our live monitoring, all zones appear to be operating normally at this time. If you are experiencing a power cut, please report it to AEDC on 09-8704700 or visit abujaelectricity.com.'
  }

  if (lower.includes('maintenance')) {
    if (liveData.includes('MAINTENANCE:')) {
      const maintSection = liveData.split('MAINTENANCE:')[1]?.split('\n').filter(l => l.trim().startsWith('•')).map(l => l.trim()).join(', ') || ''
      return `The following zones are currently undergoing planned maintenance: ${maintSection}. Scheduled maintenance usually takes 4-8 hours. We apologise for any inconvenience.`
    }
    return 'There are no zones currently under maintenance. All scheduled maintenance activities have been completed.'
  }

  if (lower.includes('bill') || lower.includes('payment') || lower.includes('meter')) {
    return 'For billing and meter queries, please check your dashboard for your latest readings. Nigeria uses these tariff classes: R1 (residential low), R2 (residential standard), C1 (commercial small), C2 (commercial medium), D1 (industrial). For billing disputes, contact your AEDC district office.'
  }

  if (lower.includes('restoration') || lower.includes('when') || lower.includes('restore') || lower.includes('come back')) {
    return 'Restoration times depend on the fault type: feeder faults typically 2-6 hours, transformer issues 6-24 hours, vandalism 24-72 hours. Check the live map on our homepage for real-time zone status and estimated restoration times.'
  }

  if (lower.includes('tariff') || lower.includes('class')) {
    return 'Nigeria electricity tariff classes: R1 (residential, low usage), R2 (residential, standard), C1 (commercial, small), C2 (commercial, medium), D1 (industrial). Your tariff class determines your rate per kWh consumed. Check your account or contact AEDC to verify your tariff class.'
  }

  return `Thank you for your message. I have access to live grid data across ${liveData.includes('active') ? 'all Nigeria zones' : 'the network'}. ${liveData.includes('OUTAGES') ? 'There are currently some active outages — check the live map for details.' : 'The grid is currently operating normally.'} For urgent issues, call AEDC on 09-8704700.`
}
