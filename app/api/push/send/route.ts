import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, body, url, user_ids } = await req.json()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/functions/v1/push-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ title, body, url, user_ids }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
