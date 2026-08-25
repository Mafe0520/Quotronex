// lib/plans.ts
// Fuente canónica de planes y precios de Quotronex.
// Todo cálculo financiero (MRR estimado, paywall, admin) lee desde aquí.
// Precios en centavos para evitar errores de punto flotante.

export type PlanId = 'solo' | 'crew' | 'business' | 'pro_team'

export interface Plan {
  id:                      PlanId
  name:                    string
  monthlyPriceCents:       number   // precio mensual regular
  annualPriceCents:        number   // precio anual regular (10 meses, 12 recibidos)
  founderMonthlyPriceCents: number  // precio founding mensual (primeros 100)
  founderAnnualPriceCents:  number  // precio founding anual
  includedSeats:           number
  allowsExtraSeats:        boolean
  extraSeatMonthlyCents:   number   // +$5/usuario/mes
  extraSeatAnnualCents:    number   // +$50/usuario/año (2 meses gratis)
  // Stripe Price IDs (test mode — reemplazar por live IDs al activar cuenta)
  stripePriceIdMonthly:        string
  stripePriceIdAnnual:         string
  stripePriceIdFounderMonthly: string
  stripePriceIdFounderAnnual:  string
}

export const PLANS: Record<PlanId, Plan> = {
  solo: {
    id:                       'solo',
    name:                     'Solo',
    monthlyPriceCents:        2900,
    annualPriceCents:         29000,
    founderMonthlyPriceCents: 2400,
    founderAnnualPriceCents:  24000,
    includedSeats:            1,
    allowsExtraSeats:         false,  // para más usuarios → upgrade a Crew
    extraSeatMonthlyCents:    500,
    extraSeatAnnualCents:     5000,
    stripePriceIdMonthly:         'price_1U83hILBW0msgxNitZ3lQinO',
    stripePriceIdAnnual:          'price_1U83hILBW0msgxNifMZ6nRj8',
    stripePriceIdFounderMonthly:  'price_1U83hHLBW0msgxNimxg9He47',
    stripePriceIdFounderAnnual:   'price_1U83hGLBW0msgxNitaJEYlXg',
  },
  crew: {
    id:                       'crew',
    name:                     'Crew',
    monthlyPriceCents:        3900,
    annualPriceCents:         39000,
    founderMonthlyPriceCents: 3400,
    founderAnnualPriceCents:  34000,
    includedSeats:            3,
    allowsExtraSeats:         true,
    extraSeatMonthlyCents:    500,
    extraSeatAnnualCents:     5000,
    stripePriceIdMonthly:         'price_1U83hHLBW0msgxNiy5argHGB',
    stripePriceIdAnnual:          'price_1U83hHLBW0msgxNiWnNReV7q',
    stripePriceIdFounderMonthly:  'price_1U83hHLBW0msgxNiMRa2J0Op',
    stripePriceIdFounderAnnual:   'price_1U83hGLBW0msgxNiJIbh1rmx',
  },
  business: {
    id:                       'business',
    name:                     'Business',
    monthlyPriceCents:        5900,
    annualPriceCents:         59000,
    founderMonthlyPriceCents: 5400,
    founderAnnualPriceCents:  54000,
    includedSeats:            7,
    allowsExtraSeats:         true,
    extraSeatMonthlyCents:    500,
    extraSeatAnnualCents:     5000,
    stripePriceIdMonthly:         'price_1U83hKLBW0msgxNiewqt1h9P',
    stripePriceIdAnnual:          'price_1U83hKLBW0msgxNiSTCjb3jy',
    stripePriceIdFounderMonthly:  'price_1U83hJLBW0msgxNi8fCBE9Z2',
    stripePriceIdFounderAnnual:   'price_1U83hJLBW0msgxNi5ogAo8Sg',
  },
  pro_team: {
    id:                       'pro_team',
    name:                     'Pro Team',
    monthlyPriceCents:        8900,
    annualPriceCents:         89000,
    founderMonthlyPriceCents: 8400,
    founderAnnualPriceCents:  84000,
    includedSeats:            15,
    allowsExtraSeats:         true,
    extraSeatMonthlyCents:    500,
    extraSeatAnnualCents:     5000,
    stripePriceIdMonthly:         'price_1U83hILBW0msgxNiDqldpsed',
    stripePriceIdAnnual:          'price_1U83hILBW0msgxNirHUzd5rT',
    stripePriceIdFounderMonthly:  'price_1U83hHLBW0msgxNiTgAcKH3x',
    stripePriceIdFounderAnnual:   'price_1U83hGLBW0msgxNikOfueUw6',
  },
}

export const PLAN_LIST = Object.values(PLANS)

// Seats adicionales — aplica a Crew, Business y Pro Team (Solo no permite extra seats)
export const EXTRA_SEAT = {
  monthlyCents:          500,
  annualCents:          5000,
  stripePriceIdMonthly: 'price_1U83hHLBW0msgxNiImqXMteI',
  stripePriceIdAnnual:  'price_1U83hGLBW0msgxNij3raKRlv',
} as const

export const FOUNDING_MAX_BUSINESSES = 100

// Devuelve el stripe_price_id correcto según el plan, billing y si es founder
export function getStripePriceId(
  planId: PlanId,
  billing: 'monthly' | 'annual',
  isFounder: boolean,
): string {
  const plan = PLANS[planId]
  if (isFounder) {
    return billing === 'annual' ? plan.stripePriceIdFounderAnnual : plan.stripePriceIdFounderMonthly
  }
  return billing === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly
}

// MRR estimado para métricas de admin — NUNCA presentar como dinero cobrado.
export function estimatedMRR(
  planId: PlanId,
  billing: 'monthly' | 'annual',
  isFounder: boolean,
): number {
  const plan = PLANS[planId]
  if (!plan) return 0
  const monthlyCents = isFounder ? plan.founderMonthlyPriceCents : plan.monthlyPriceCents
  // Si es anual, el MRR mensual equivalente
  if (billing === 'annual') {
    const annualCents = isFounder ? plan.founderAnnualPriceCents : plan.annualPriceCents
    return Math.round(annualCents / 12)
  }
  return monthlyCents
}
