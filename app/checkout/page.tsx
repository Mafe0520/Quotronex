import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { PLANS, getStripePriceId, type PlanId } from '@/lib/plans'

export const metadata = { title: 'Checkout — Quotronex', robots: { index: false } }

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string; email?: string; name?: string; founder?: string; lang?: string }>
}) {
  const { plan = 'crew', billing = 'monthly', email = '', name = '', founder = '', lang = 'en' } = await searchParams

  const planId = (Object.keys(PLANS).includes(plan) ? plan : 'crew') as PlanId
  const billingMode = billing === 'annual' ? 'annual' : 'monthly'
  const isFounder = founder === '1'

  const priceId = getStripePriceId(planId, billingMode, isFounder)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quotronex.com'
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { plan: planId, billing: billingMode, is_founder: isFounder ? '1' : '0', name },
    },
    customer_email: email || undefined,
    metadata: { plan: planId, billing: billingMode, is_founder: isFounder ? '1' : '0', name },
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/paywall`,
    allow_promotion_codes: true,
    locale: lang === 'es' ? 'es' : 'en',
  })

  if (!session.url) redirect('/paywall')
  redirect(session.url)
}
