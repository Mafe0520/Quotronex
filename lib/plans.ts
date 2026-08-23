// lib/plans.ts
// Fuente canónica de planes y precios de Quotronex.
// Todo cálculo financiero (MRR estimado, paywall, admin) lee desde aquí.
// Precios en centavos para evitar errores de punto flotante.

export type PlanId = 'solo' | 'crew' | 'business' | 'pro_team'

export interface Plan {
  id:                    PlanId
  name:                  string
  monthlyPriceCents:     number
  annualPriceCents:      number | null   // null hasta aprobar estrategia anual
  founderPriceCents:     number | null   // null hasta cerrar unit economics
  includedSeats:         number
  allowsExtraSeats:      boolean
  extraSeatPriceCents:   number
  stripePriceIdMonthly:  string | null   // null hasta conectar Stripe
  stripePriceIdAnnual:   string | null   // null hasta conectar Stripe
}

export const PLANS: Record<PlanId, Plan> = {
  solo: {
    id:                   'solo',
    name:                 'Solo',
    monthlyPriceCents:    2900,
    annualPriceCents:     null,
    founderPriceCents:    null,
    includedSeats:        1,
    allowsExtraSeats:     true,
    extraSeatPriceCents:  500,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual:  null,
  },
  crew: {
    id:                   'crew',
    name:                 'Crew',
    monthlyPriceCents:    3900,
    annualPriceCents:     null,
    founderPriceCents:    null,
    includedSeats:        3,
    allowsExtraSeats:     true,
    extraSeatPriceCents:  500,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual:  null,
  },
  business: {
    id:                   'business',
    name:                 'Business',
    monthlyPriceCents:    5900,
    annualPriceCents:     null,
    founderPriceCents:    null,
    includedSeats:        7,
    allowsExtraSeats:     true,
    extraSeatPriceCents:  500,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual:  null,
  },
  pro_team: {
    id:                   'pro_team',
    name:                 'Pro Team',
    monthlyPriceCents:    8900,
    annualPriceCents:     null,
    founderPriceCents:    null,
    includedSeats:        15,
    allowsExtraSeats:     true,
    extraSeatPriceCents:  500,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual:  null,
  },
}

export const PLAN_LIST = Object.values(PLANS)

// MRR estimado para una suscripción — solo para métricas de admin.
// Nunca presentar como dinero cobrado. Marcar siempre como ESTIMATED.
export function estimatedMRR(planId: PlanId, isFounder: boolean): number {
  const plan = PLANS[planId]
  if (!plan) return 0
  if (isFounder && plan.founderPriceCents !== null) return plan.founderPriceCents
  return plan.monthlyPriceCents
}
