/**
 * Sends a push notification to specific users via the Supabase Edge Function.
 * Call this from Server Actions or API Routes — never from the browser.
 * Fire-and-forget: use .catch(() => {}) so it never blocks the main response.
 */
export function notifyUsers({
  title,
  body,
  url,
  user_ids,
}: {
  title: string
  body: string
  url?: string
  user_ids?: string[]
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  fetch(`${supabaseUrl}/functions/v1/push-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ title, body, url: url ?? '/app', user_ids }),
  }).catch(() => {})
}
