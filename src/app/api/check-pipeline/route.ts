import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = req.nextUrl.searchParams.get('company')
  if (!company) return NextResponse.json({ error: 'company param required' }, { status: 400 })

  const url = process.env.PIPELINE_API_URL
  const secret = process.env.PIPELINE_API_SECRET

  if (!url || !secret) {
    // Pipeline not configured — treat as no match
    return NextResponse.json({ match: null })
  }

  const res = await fetch(`${url}/api/opportunities?company=${encodeURIComponent(company)}`, {
    headers: { 'x-api-key': secret },
  })

  if (!res.ok) return NextResponse.json({ match: null })

  const rows: Array<{ id: string; companyName: string; stage: string }> = await res.json()
  if (rows.length === 0) return NextResponse.json({ match: null })

  const { id, companyName, stage } = rows[0]
  return NextResponse.json({ match: { id, companyName, stage } })
}
