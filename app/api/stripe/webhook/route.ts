import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })
}

const PLAN_MAP: Record<string, { planId: string; billing: string; isFounder: boolean }> = {
  // Solo (live)
  'price_1U83hILBW0msgxNitZ3lQinO': { planId: 'solo',     billing: 'monthly', isFounder: false },
  'price_1U83hILBW0msgxNifMZ6nRj8': { planId: 'solo',     billing: 'annual',  isFounder: false },
  'price_1U83hHLBW0msgxNimxg9He47': { planId: 'solo',     billing: 'monthly', isFounder: true  },
  'price_1U83hGLBW0msgxNitaJEYlXg': { planId: 'solo',     billing: 'annual',  isFounder: true  },
  // Crew (live)
  'price_1U83hHLBW0msgxNiy5argHGB': { planId: 'crew',     billing: 'monthly', isFounder: false },
  'price_1U83hHLBW0msgxNiWnNReV7q': { planId: 'crew',     billing: 'annual',  isFounder: false },
  'price_1U83hHLBW0msgxNiMRa2J0Op': { planId: 'crew',     billing: 'monthly', isFounder: true  },
  'price_1U83hGLBW0msgxNiJIbh1rmx': { planId: 'crew',     billing: 'annual',  isFounder: true  },
  // Business / Equipo (live)
  'price_1U83hKLBW0msgxNiewqt1h9P': { planId: 'business', billing: 'monthly', isFounder: false },
  'price_1U83hKLBW0msgxNiSTCjb3jy': { planId: 'business', billing: 'annual',  isFounder: false },
  'price_1U83hJLBW0msgxNi8fCBE9Z2': { planId: 'business', billing: 'monthly', isFounder: true  },
  'price_1U83hJLBW0msgxNi5ogAo8Sg': { planId: 'business', billing: 'annual',  isFounder: true  },
  // Pro Team (live)
  'price_1U83hILBW0msgxNiDqldpsed': { planId: 'pro_team', billing: 'monthly', isFounder: false },
  'price_1U83hILBW0msgxNirHUzd5rT': { planId: 'pro_team', billing: 'annual',  isFounder: false },
  'price_1U83hHLBW0msgxNiTgAcKH3x': { planId: 'pro_team', billing: 'monthly', isFounder: true  },
  'price_1U83hGLBW0msgxNikOfueUw6': { planId: 'pro_team', billing: 'annual',  isFounder: true  },
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = db()

  switch (event.type) {
    case 'checkout.session.completed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any
      if (session.mode !== 'subscription') break

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const customerEmail = session.customer_email ?? session.customer_details?.email ?? null
      const planKey = session.metadata?.plan ?? 'monthly'
      const name = session.metadata?.name ?? ''

      // Get subscription to find price
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await getStripe().subscriptions.retrieve(subscriptionId) as any
      const priceId = sub.items.data[0]?.price.id ?? ''
      const mapped = PLAN_MAP[priceId] ?? { planId: 'crew', billing: 'monthly', isFounder: false }
      const { planId, billing, isFounder } = mapped
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null

      // Find or create business for this customer
      if (customerEmail) {
        // Look up auth user by email
        const { data: users } = await supabase.auth.admin.listUsers()
        const authUser = users?.users?.find(u => u.email === customerEmail)

        if (authUser) {
          // Find their business
          const { data: member } = await supabase
            .from('business_members')
            .select('business_id')
            .eq('user_id', authUser.id)
            .eq('role', 'owner')
            .single()

          if (member?.business_id) {
            await supabase.from('subscriptions').upsert({
              business_id: member.business_id,
              stripe_customer_id: customerId,
              stripe_sub_id: subscriptionId,
              plan_id: planId,
              billing,
              status: sub.status,
              trial_ends_at: trialEnd,
              next_billing_at: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
              is_founder: isFounder,
            }, { onConflict: 'business_id' })
          }
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      const priceId = sub.items?.data?.[0]?.price?.id ?? ''
      const mapped2 = PLAN_MAP[priceId] ?? { planId: 'crew', billing: 'monthly', isFounder: false }

      await supabase
        .from('subscriptions')
        .update({
          plan_id: mapped2.planId,
          billing: mapped2.billing,
          is_founder: mapped2.isFounder,
          status: sub.status,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
        .eq('stripe_sub_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_sub_id', sub.id)
      break
    }

    case 'invoice.paid': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      const customerEmail = inv.customer_email as string | null
      if (customerEmail && inv.billing_reason !== 'subscription_create') {
        // subscription_create receipt handled by checkout.session.completed welcome email
        const amountFormatted = `$${((inv.amount_paid ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        const periodEnd = inv.lines?.data?.[0]?.period?.end
          ? new Date(inv.lines.data[0].period.end * 1000).toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : ''
        const subId = inv.subscription as string | null
        let planName = 'Quotronex'
        if (subId) {
          const { data: sub } = await supabase.from('subscriptions').select('plan_id').eq('stripe_sub_id', subId).single()
          if (sub?.plan_id) planName = sub.plan_id.charAt(0).toUpperCase() + sub.plan_id.slice(1).replace('_', ' ')
        }
        const { sendPaymentReceiptEmail } = await import('@/lib/email')
        await sendPaymentReceiptEmail({
          to: customerEmail,
          ownerName: inv.customer_name ?? customerEmail.split('@')[0],
          planName,
          amountFormatted,
          periodEnd,
        }).catch(() => null)
      }
      break
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any
      const subId = invoice.subscription as string | null
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
