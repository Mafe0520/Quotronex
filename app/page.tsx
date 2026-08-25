'use client';

// QUOTLY — Landing page bilingüe (EN / ES)
// Copy trazado a FICHA-AVATAR.md · Tokens de FICHA-ARTE.md
// Big Idea: contractors pierden trabajos porque la cotización llega tarde.
// Mecanismo: Voice Price Book — describe el trabajo, la IA genera la cotización con tus precios.

import {
  Clock,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { HeroMockup } from '@/components/landing/HeroMockup';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLang } from './lang-context';
import { Hero } from '@/components/landing/Hero';
import { Problema } from '@/components/landing/Problema';
import { Agitacion } from '@/components/landing/Agitacion';
import { Solucion } from '@/components/landing/Solucion';
import { AppPorDentro } from '@/components/landing/AppPorDentro';
import { Oferta } from '@/components/landing/Oferta';
import { Garantia } from '@/components/landing/Garantia';
import { Faq } from '@/components/landing/Faq';
import { CtaFinal } from '@/components/landing/CtaFinal';
import { FooterLegal } from '@/components/landing/FooterLegal';
import { StickyCtaMobile } from '@/components/landing/ui';
import { Comparacion } from '@/components/landing/Comparacion';
import { Testimonios } from '@/components/landing/Testimonios';
import { RoiCalculator } from '@/components/landing/RoiCalculator';
import { TimelineFlow, type TimelineStep } from '@/components/landing/TimelineFlow';
import { FileText, Send, PenLine, CreditCard } from 'lucide-react';

// ── COPY BILINGÜE ────────────────────────────────────────────────────────────
// Todo el copy trazado a FICHA-AVATAR.md. Español: variante latina neutra (tuteo).

const COPY = {
  en: {
    cta: 'Start free',
    ctaHref: '/onboarding',
    stickyPre: 'See plans & pricing',
    loginLabel: 'Log in',
    nav: [
      { label: 'How it works', href: '#solucion' },
      { label: 'Pricing',      href: '#oferta'   },
      { label: 'FAQ',          href: '#faq'       },
    ],
    hero: {
      h1:          '[acento]Quote in 30 seconds.[/acento] Land the job.',
      subtitle:    "Your prices. Your voice. A professional quote in 30 seconds — before they call the next guy.",
      secondary:   'See how it works',
      socialProof: '14-day free trial · Card required · $0 today · Cancel anytime',
    },
    problema: {
      titulo: 'Does this sound familiar?',
      preguntas: [
        { textoMarked: 'A client calls for a price and you say [b]"I\'ll send something later"[/b] — and lose the job.' },
        { textoMarked: 'Your quotes look [b]less professional than your work[/b] — and clients notice.'              },
        { textoMarked: 'You lose jobs because [b]someone else quoted faster[/b] — not because they work better.'     },
        { textoMarked: 'Big field-service platforms cost [b]more every month[/b] for features you barely use.'          },
      ],
    },
    agitacion: {
      frases: [
        'Every slow quote is a job you handed to the next guy on the list.',
        'At [acento]1–3 lost jobs a month[/acento], that\'s $6,000–$36,000 a year walking out the door.',
        'A fancier app won\'t fix it. [b]Speed and your own prices will.[/b]',
      ],
      contraste: {
        labelHoy:     'Today',
        hoy:          'Quoting by hand takes 30 minutes, looks amateur, and costs you jobs.',
        labelFuturo:  'In 6 months if nothing changes',
        futuro:       'Same jobs lost — plus $1,800+ paid to software that didn\'t help.',
      },
    },
    solucion: {
      kicker:       'THE MECHANISM',
      titulo:       'Your quote sent [acento]before they call someone else[/acento]',
      bigIdea:      "You're not losing jobs because you work badly — you lose them because [b]your quote arrives last[/b]. The Voice Price Book changes that.",
      pasos: [
        { titulo: 'Speak the job',       detalle: 'Describe the work in your own words — English or Spanish.'                            },
        { titulo: 'AI applies your prices', detalle: 'The Voice Price Book builds the quote using your real rates, not guesses.'         },
        { titulo: 'Send. Get signed.',   detalle: 'Client receives a professional quote in seconds. One tap to sign.'                   },
      ],
      antesDespues: {
        labelAntes:   'Before',
        antes:        'Quoting by hand, losing jobs to faster competitors.',
        labelDespues: 'After',
        despues:      'Professional quote in 30 seconds. Job confirmed.',
      },
    },
    appPorDentro: {
      kicker: 'INSIDE THE APP',
      titulo: 'Everything you need, [acento]nothing you don\'t[/acento]',
      frames: [
        { label: 'Your quote, ready before you walk away', src: '/screenshots/screen-quote-en.svg',   alt: 'Quote screen'   },
        { label: 'All your jobs, in one place',            src: '/screenshots/screen-jobs-en.svg',    alt: 'Jobs screen'    },
        { label: 'Assign work to your crew',               src: '/screenshots/screen-crew-en.svg',    alt: 'Crew screen'    },
        { label: 'One tap to invoice',                     src: '/screenshots/screen-invoice-en.svg', alt: 'Invoice screen' },
      ],
    },
    oferta: {
      kicker: 'PRICING',
      titulo: 'Half the price of the big guys. [acento]Twice the speed.[/acento]',
      badge:  'BEST VALUE',
      stack: {
        lineas: [
          { resultado: 'Voice Price Book — unlimited quotes (12 months)', valor: '$228' },
          { resultado: 'Bilingual English + Spanish, built in',           valor: '$49'  },
          { resultado: 'Job tracking + crew assignment',                  valor: '$49'  },
        ],
        totalTachado: '$326',
        nota: 'Today: $32/mo (billed $390/year)',
      },
      anual: {
        nombre:          'Starter',
        precioMes:       '$32',
        totalAnual:      'Billed $390/year',
        ahorro:          '2 months free',
        descomposicionDia: 'less than $1.10/day',
        ctaLabel:        'Start my free 14-day trial',
        features: [
          'Voice Price Book — unlimited quotes',
          'English + Spanish, built in',
          'Send, approve, and invoice — all in one app',
          'Assign jobs to up to 5 crew members',
          'Fixed price. No add-ons. No surprises.',
        ],
      },
      mensual: {
        nombre:   'Starter',
        precioMes: '$39',
        ctaLabel: 'Start monthly trial',
        features: [
          'Voice Price Book — unlimited quotes',
          'English + Spanish, built in',
          'Send, approve, and invoice — all in one app',
          'Assign jobs to up to 5 crew members',
          'Cancel anytime.',
        ],
      },
    },
    comparacion: {
      kicker:   'WHY CONTRACTORS SWITCH',
      titulo:   'Why contractors switch to Quotronex',
      subtitulo: 'Stop losing your nights quoting on paper and chasing late payments.',
      antiguo: {
        titulo: 'THE OLD WAY (LOSING MONEY)',
        items: [
          'Quoting at 9:00 PM at the kitchen table after 10 hours of physical work',
          'Guessing prices or copying old notes and losing your profit margin',
          'Workers calling the office to ask what they need to do next',
          'Writing invoices from scratch weeks after finishing the job',
        ],
      },
      nuevo: {
        titulo: 'THE QUOTRONEX WAY',
        items: [
          'Dictate the estimate by voice before you leave the client\'s house',
          'Rates connected automatically to your real price catalog',
          'Your crew sees only their assigned jobs, notes, and photos on mobile',
          '1-click flow: Estimate → Job → Invoice with secure digital payment',
        ],
      },
    },
    timeline: {
      kicker: 'HOW A JOB WORKS',
      titulo: 'From estimate to [acento]paid — in minutes[/acento]',
      subtitulo: 'One connected flow. No switching apps, no chasing clients.',
      steps: [
        {
          id: 'estimate', label: 'Estimate', badge: 'Created',
          card: { titulo: 'Quote ready in 30 seconds', detalle: 'You describe the job by voice. Quotronex builds a professional quote with your real rates.', meta: '⏱ Avg. 28 seconds from dictation to PDF', },
        },
        {
          id: 'sent', label: 'Sent', badge: 'Delivered',
          card: { titulo: 'Client gets it instantly', detalle: 'One tap sends the quote by email or link. The client sees it before you start the drive home.', meta: '✓ Read receipts built in', },
        },
        {
          id: 'approved', label: 'Approved', badge: 'Approved',
          card: { titulo: 'Client approves in seconds', detalle: 'Client taps Approve on their phone. No printing, no scanning, no waiting days for a callback.', meta: '📱 Works on any phone, no app needed', },
        },
        {
          id: 'paid', label: 'Paid', badge: 'Deposited',
          card: { titulo: 'Payment hits your account', detalle: 'Invoice converts automatically from the signed estimate. Client pays online. Money moves to your bank.', meta: '💳 No chasing. No paper checks.', },
        },
      ],
    },
    roi: {
      titulo:    'Calculate your time and money recovered each month',
      subtitulo: 'Discover how much slow, manual quoting is really costing you.',
      labelEstimados: 'Estimates you send per month:',
      labelValor:     'Average job value ($):',
      labelHoras:     'Hours recovered per month',
      labelFactura:   'Estimated extra revenue',
      descHoras:      'Time saved by quoting in seconds instead of hours',
      descFactura:    'Extra billing from winning 15% more jobs by quoting faster',
    },
    garantia: {
      nombre:    '14-Day Free Trial',
      condicion: "Try Quotronex free for [b]14 days[/b]. Card required · $0 today. Cancel before day 15 and you won't be charged anything.",
      pisoLegal: 'Processed securely by Stripe',
    },
    faq: {
      kicker: 'FAQ',
      titulo: "What you're probably wondering",
      items: [
        {
          pregunta:       'How is this different from other field-service apps?',
          respuestaMarked: 'Quotronex is built for 1–15 person shops that need to quote fast. [b]One fixed price, no add-ons, no price increases[/b] — ever. Most field-service platforms are built for larger companies and charge more every time you grow.',
        },
        {
          pregunta:       'Does it really use my own prices?',
          respuestaMarked: 'Yes. You set up your Price Book once — your labor rates, your materials, your markup. Every quote the AI builds uses [b]your numbers, not generic estimates[/b].',
        },
        {
          pregunta:       'Does it work in Spanish?',
          respuestaMarked: 'The whole app works in English and Spanish. [b]Switch any time[/b] — no separate account, no extra setup.',
        },
        {
          pregunta:       'Do I need a credit card for the trial?',
          respuestaMarked: 'Yes. A card is required to start — but [b]you are charged $0 today[/b]. The trial is 14 days. Cancel before day 15 and nothing is billed.',
        },
        {
          pregunta:       'What happens after the 14-day trial?',
          respuestaMarked: "Your card is billed automatically on day 15. Cancel any time before that and [b]no charge[/b].",
        },
        {
          pregunta:       'Can I cancel anytime?',
          respuestaMarked: 'Yes. Monthly plans cancel before the next billing cycle. Annual plans cancel before the next renewal date — [b]no penalty[/b].',
        },
        {
          pregunta:       'Does the AI set my prices?',
          respuestaMarked: 'No. You set your prices in the Price Book. The AI uses [b]your numbers[/b] to build quotes — it never guesses or uses market rates.',
        },
      ],
    },
    ctaFinal: {
      h2:            'Stop losing jobs to [acento]faster quotes[/acento]',
      futurePacing:  "In two weeks, every client gets a professional quote in 30 seconds. In a month, you've won jobs you used to lose.",
      recap:         '14-day free trial · Card required · $0 today · Cancel anytime',
      ps:            'P.S. — [b]The Voice Price Book uses your real rates, not generic estimates.[/b] Set it up once. Quote faster than anyone else — every time.',
    },
    footer: {
      enlaces: [
        { label: 'Privacy Policy',   href: '/legal/privacy'  },
        { label: 'Terms of Service', href: '/legal/terms'    },
        { label: 'Refund Policy',    href: '/legal/refunds'  },
      ],
    },
  },

  es: {
    cta: 'Empezar gratis',
    ctaHref: '/onboarding',
    stickyPre: 'Ver planes y precios',
    loginLabel: 'Entrar',
    nav: [
      { label: 'Cómo funciona', href: '#solucion' },
      { label: 'Precios',       href: '#oferta'   },
      { label: 'Preguntas',     href: '#faq'       },
    ],
    hero: {
      h1:          '[acento]Cotiza en 30 segundos.[/acento] Gana el trabajo.',
      subtitle:    'Tus precios. Tu voz. Una cotización profesional en 30 segundos — antes de que llamen al siguiente.',
      secondary:   'Ver cómo funciona',
      socialProof: 'Prueba gratis 14 días · Tarjeta requerida · $0 hoy · Cancela cuando quieras',
    },
    problema: {
      titulo: '¿Te suena familiar?',
      preguntas: [
        { textoMarked: 'Un cliente pide precio y dices [b]"te mando algo después"[/b] — y pierdes el trabajo.'          },
        { textoMarked: 'Tus cotizaciones se ven [b]menos profesionales que tu trabajo[/b] — y los clientes lo notan.'   },
        { textoMarked: 'Pierdes trabajos porque [b]alguien más cotizó más rápido[/b] — no porque trabaje mejor.'        },
        { textoMarked: 'Las plataformas grandes cuestan [b]más cada mes[/b] por funciones que casi no usas.'              },
      ],
    },
    agitacion: {
      frases: [
        'Cada cotización lenta es un trabajo que le regalas al siguiente de la lista.',
        'Con [acento]1–3 trabajos perdidos al mes[/acento], son $6,000–$36,000 al año que se van.',
        'Una app más complicada no lo va a arreglar. [b]La velocidad y tus propios precios sí.[/b]',
      ],
      contraste: {
        labelHoy:     'Hoy',
        hoy:          'Cotizar a mano tarda 30 minutos, se ve amateur y te cuesta trabajos.',
        labelFuturo:  'En 6 meses si no cambias nada',
        futuro:       'Los mismos trabajos perdidos — más $1,800+ pagados a software que no ayudó.',
      },
    },
    solucion: {
      kicker:  'EL MECANISMO',
      titulo:  'Tu cotización enviada [acento]antes de que llamen a otro[/acento]',
      bigIdea: 'No pierdes trabajos por trabajar mal — los pierdes porque [b]tu cotización llega última[/b]. El Voice Price Book cambia eso.',
      pasos: [
        { titulo: 'Describe el trabajo',     detalle: 'Cuenta lo que vas a hacer con tus propias palabras — en inglés o español.'       },
        { titulo: 'La IA aplica tus precios', detalle: 'El Voice Price Book arma la cotización con tus tarifas reales, no estimados.'   },
        { titulo: 'Envía. El cliente aprueba.', detalle: 'El cliente recibe una cotización profesional en segundos. Un toque para aprobar.' },
      ],
      antesDespues: {
        labelAntes:   'Antes',
        antes:        'Cotizando a mano, perdiendo trabajos frente a competidores más rápidos.',
        labelDespues: 'Después',
        despues:      'Cotización profesional en 30 segundos. Trabajo confirmado.',
      },
    },
    appPorDentro: {
      kicker: 'DENTRO DE LA APP',
      titulo: 'Todo lo que necesitas, [acento]nada que no vas a usar[/acento]',
      frames: [
        { label: 'Tu cotización, lista antes de que te vayas', src: '/screenshots/screen-quote.svg',   alt: 'Pantalla de cotización'  },
        { label: 'Todos tus trabajos, en un solo lugar',       src: '/screenshots/screen-jobs.svg',    alt: 'Pantalla de trabajos'    },
        { label: 'Asigna trabajo a tu equipo',                 src: '/screenshots/screen-crew.svg',    alt: 'Pantalla de equipo'      },
        { label: 'Una sola pantalla para facturar',            src: '/screenshots/screen-invoice.svg', alt: 'Pantalla de factura'     },
      ],
    },
    oferta: {
      kicker: 'LA OFERTA',
      titulo: 'La mitad del precio de las grandes. [acento]El doble de velocidad.[/acento]',
      badge:  'MEJOR VALOR',
      stack: {
        lineas: [
          { resultado: 'Voice Price Book — cotizaciones ilimitadas (12 meses)', valor: '$228' },
          { resultado: 'Inglés + español incluidos',                            valor: '$49'  },
          { resultado: 'Seguimiento de trabajos + asignación de equipo',        valor: '$49'  },
        ],
        totalTachado: '$326',
        nota: 'Hoy: $32/mes (cobrado $390/año)',
      },
      anual: {
        nombre:          'Starter',
        precioMes:       '$32',
        totalAnual:      'Cobrado $390/año',
        ahorro:          '2 meses gratis',
        descomposicionDia: 'menos de $1.10/día',
        ctaLabel:        'Empezar prueba gratis 14 días',
        features: [
          'Voice Price Book — cotizaciones ilimitadas',
          'Inglés + español incluidos',
          'Envía, aprueba y factura — todo en una app',
          'Asigna trabajos a hasta 5 empleados',
          'Precio fijo. Sin extras. Sin sorpresas.',
        ],
      },
      mensual: {
        nombre:    'Starter',
        precioMes: '$39',
        ctaLabel:  'Empezar prueba mensual',
        features: [
          'Voice Price Book — cotizaciones ilimitadas',
          'Inglés + español incluidos',
          'Envía, aprueba y factura — todo en una app',
          'Asigna trabajos a hasta 5 empleados',
          'Cancela cuando quieras.',
        ],
      },
    },
    comparacion: {
      kicker:   'POR QUÉ CAMBIAN',
      titulo:   '¿Por qué los contratistas se cambian a Quotronex?',
      subtitulo: 'Deja de perder tus noches cotizando en papel y persiguiendo pagos atrasados.',
      antiguo: {
        titulo: 'EL MÉTODO ANTIGUO (PÉRDIDA DE DINERO)',
        items: [
          'Cotizando a las 9:00 PM en la mesa tras 10 horas de trabajo físico',
          'Adivinando precios o copiando notas viejas perdiendo margen de ganancia',
          'Los trabajadores llamando a la oficina para preguntar qué hay que hacer',
          'Escribiendo facturas desde cero semanas después de terminar la obra',
        ],
      },
      nuevo: {
        titulo: 'EL MÉTODO QUOTRONEX',
        items: [
          'Dicta el estimado por voz antes de salir de la casa del cliente',
          'Tarifas conectadas automáticamente a tu catálogo real de precios',
          'El equipo en campo ve solo sus trabajos asignados, notas y fotos en el móvil',
          'Flujo en 1 clic: Estimado → Job → Factura con cobro digital seguro',
        ],
      },
    },
    timeline: {
      kicker: 'CÓMO FUNCIONA UN TRABAJO',
      titulo: 'Del estimado a que [acento]te paguen — en minutos[/acento]',
      subtitulo: 'Un flujo conectado. Sin cambiar de apps, sin perseguir clientes.',
      steps: [
        {
          id: 'estimado', label: 'Estimado', badge: 'Creado',
          card: { titulo: 'Cotización lista en 30 segundos', detalle: 'Describes el trabajo por voz. Quotronex arma una cotización profesional con tus tarifas reales.', meta: '⏱ Promedio 28 segundos del dictado al PDF', },
        },
        {
          id: 'enviado', label: 'Enviado', badge: 'Entregado',
          card: { titulo: 'El cliente lo recibe al instante', detalle: 'Un toque envía la cotización por correo o enlace. El cliente la ve antes de que salgas.', meta: '✓ Confirmación de lectura incluida', },
        },
        {
          id: 'aprobado', label: 'Aprobado', badge: 'Aprobado',
          card: { titulo: 'El cliente aprueba en segundos', detalle: 'El cliente toca Aceptar desde su celular. Sin imprimir, sin escáner, sin esperar días por respuesta.', meta: '📱 Funciona en cualquier celular, sin instalar nada', },
        },
        {
          id: 'pagado', label: 'Pagado', badge: 'Depositado',
          card: { titulo: 'El pago llega a tu cuenta', detalle: 'La factura se convierte automáticamente del estimado firmado. El cliente paga en línea. El dinero llega a tu banco.', meta: '💳 Sin perseguir. Sin cheques en papel.', },
        },
      ],
    },
    roi: {
      titulo:    'Calcula tu tiempo y dinero recuperado al mes',
      subtitulo: 'Descubre cuánto te está costando cotizar tarde y de forma manual.',
      labelEstimados: 'Estimados que haces al mes:',
      labelValor:     'Valor promedio por trabajo ($):',
      labelHoras:     'Horas recuperadas al mes',
      labelFactura:   'Facturación extra estimada',
      descHoras:      'Tiempo ahorrado al cotizar en segundos en vez de horas',
      descFactura:    'Facturación extra al ganar 15% más trabajos cotizando más rápido',
    },
    garantia: {
      nombre:    'Prueba gratis 14 días',
      condicion: "Prueba Quotronex gratis por [b]14 días[/b]. Tarjeta requerida · $0 hoy. Cancela antes del día 15 y no se te cobra nada.",
      pisoLegal: 'Procesado de forma segura por Stripe',
    },
    faq: {
      kicker: 'PREGUNTAS',
      titulo: 'Lo que probablemente te estás preguntando',
      items: [
        {
          pregunta:       '¿En qué se diferencia de otras apps de campo?',
          respuestaMarked: 'Quotronex está hecho para negocios de 1–15 personas que necesitan cotizar rápido. [b]Un precio fijo, sin extras, sin aumentos[/b] — nunca. La mayoría de las plataformas grandes están hechas para empresas más grandes y cobran más cada vez que creces.',
        },
        {
          pregunta:       '¿De verdad usa mis propios precios?',
          respuestaMarked: 'Sí. Configuras tu Price Book una vez — tus tarifas de mano de obra, tus materiales, tu margen. Cada cotización que genera la IA usa [b]tus números, no estimados genéricos[/b].',
        },
        {
          pregunta:       '¿Funciona en español?',
          respuestaMarked: 'Toda la app funciona en inglés y español. [b]Cambia cuando quieras[/b] — sin cuenta separada, sin configuración extra.',
        },
        {
          pregunta:       '¿Necesito tarjeta para la prueba?',
          respuestaMarked: 'Sí. Se requiere tarjeta para empezar — pero [b]hoy se cobra $0[/b]. La prueba es de 14 días. Cancela antes del día 15 y no se te cobra nada.',
        },
        {
          pregunta:       '¿Qué pasa después de los 14 días de prueba?',
          respuestaMarked: 'Tu tarjeta se cobra automáticamente el día 15. Cancela antes de esa fecha y [b]no hay cobro[/b].',
        },
        {
          pregunta:       '¿Puedo cancelar cuando quiera?',
          respuestaMarked: 'Sí. Los planes mensuales se cancelan antes del próximo ciclo. Los planes anuales se cancelan antes de la próxima renovación — [b]sin penalización[/b].',
        },
        {
          pregunta:       '¿La IA pone mis precios?',
          respuestaMarked: 'No. Tú configuras tus precios en el Price Book. La IA usa [b]tus números[/b] para armar las cotizaciones — nunca adivina ni usa precios del mercado.',
        },
      ],
    },
    ctaFinal: {
      h2:           'Deja de perder trabajos por [acento]cotizaciones lentas[/acento]',
      futurePacing: 'En dos semanas, cada cliente recibe una cotización profesional en 30 segundos. En un mes, ya ganaste trabajos que antes perdías.',
      recap:        'Prueba gratis 14 días · Tarjeta requerida · $0 hoy · Cancela cuando quieras',
      ps:           'P.D. — [b]El Voice Price Book usa tus tarifas reales, no estimados genéricos.[/b] Configúralo una vez. Cotiza más rápido que cualquiera — siempre.',
    },
    footer: {
      enlaces: [
        { label: 'Política de privacidad', href: '/legal/privacy'  },
        { label: 'Términos de uso',         href: '/legal/terms'   },
        { label: 'Política de reembolso',   href: '/legal/refunds' },
        { label: 'Aviso de IA',             href: '/ai-disclosure' },
      ],
    },
  },
} as const;

// ── AUTH ERROR REDIRECT ───────────────────────────────────────────────────────
function AuthErrorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const errorCode = searchParams.get('error_code') ?? searchParams.get('error');
    if (errorCode) {
      const desc = searchParams.get('error_description') ?? 'El enlace expiró o ya fue usado.';
      router.replace(`/login?error=${encodeURIComponent(desc.replace(/\+/g, ' '))}`);
    }
  }, [searchParams, router]);
  return null;
}

// ── PÁGINA ───────────────────────────────────────────────────────────────────

export default function LandingQuotronex() {
  const { lang } = useLang();
  const c = COPY[lang];

  const icons = [Clock, FileText, TrendingDown, DollarSign];

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      <Suspense><AuthErrorRedirect /></Suspense>

      {/* 1. HERO */}
      <Hero
        appName="Quotronex"
        navLinks={[...c.nav]}
        loginHref="/login"
        loginLabel={c.loginLabel}
        h1Marked={c.hero.h1}
        subtitleMarked={c.hero.subtitle}
        ctaLabel={c.cta}
        ctaHref={c.ctaHref}
        secondaryCtaLabel={c.hero.secondary}
        secondaryCtaHref="#solucion"
        socialProof={<span>{c.hero.socialProof}</span>}
        visual={<HeroMockup lang={lang} />}
      />

      <StickyCtaMobile
        labelComercial={c.cta}
        href={c.ctaHref}
        labelPre={c.stickyPre}
      />

      {/* 2. PROBLEMA */}
      <Problema
        titulo={c.problema.titulo}
        preguntas={c.problema.preguntas.map((p, i) => ({
          icon: icons[i]!,
          textoMarked: p.textoMarked,
        }))}
      />

      {/* 2b. TESTIMONIOS */}
      <Testimonios />

      {/* 3. AGITACIÓN */}
      <Agitacion
        frases={[...c.agitacion.frases]}
        contraste={c.agitacion.contraste}
      />

      {/* 4. COMPARACIÓN */}
      <Comparacion
        kicker={c.comparacion.kicker}
        titulo={c.comparacion.titulo}
        subtitulo={c.comparacion.subtitulo}
        columnaAntiguo={{ titulo: c.comparacion.antiguo.titulo, items: [...c.comparacion.antiguo.items] }}
        columnaQuotronex={{ titulo: c.comparacion.nuevo.titulo, items: [...c.comparacion.nuevo.items] }}
      />

      {/* 5. SOLUCIÓN */}
      <Solucion
        id="solucion"
        kicker={c.solucion.kicker}
        tituloMarked={c.solucion.titulo}
        mecanismo="Voice Price Book"
        bigIdeaMarked={c.solucion.bigIdea}
        pasos={[...c.solucion.pasos]}
        antesDespues={c.solucion.antesDespues}
      />

      {/* 5. APP POR DENTRO */}
      <AppPorDentro
        kicker={c.appPorDentro.kicker}
        tituloMarked={c.appPorDentro.titulo}
        frames={[...c.appPorDentro.frames]}
        ctaLabel={c.cta}
        ctaHref={c.ctaHref}
      />

      {/* 6. TIMELINE FLOW */}
      <TimelineFlow
        kicker={c.timeline.kicker}
        titulo={c.timeline.titulo}
        subtitulo={c.timeline.subtitulo}
        steps={c.timeline.steps.map(s => ({
          id:    s.id,
          label: s.label,
          badge: s.badge,
          card:  s.card,
        })) as TimelineStep[]}
      />

      {/* 7. ROI CALCULATOR */}
      <RoiCalculator
        titulo={c.roi.titulo}
        subtitulo={c.roi.subtitulo}
        labelEstimados={c.roi.labelEstimados}
        labelValor={c.roi.labelValor}
        labelHoras={c.roi.labelHoras}
        labelFactura={c.roi.labelFactura}
        descHoras={c.roi.descHoras}
        descFactura={c.roi.descFactura}
      />

      {/* 7. OFERTA */}
      <Oferta
        kicker={c.oferta.kicker}
        tituloMarked={c.oferta.titulo}
        trialDias={14}
        stack={{ ...c.oferta.stack, lineas: [...c.oferta.stack.lineas] }}
        anual={{
          ...c.oferta.anual,
          features: [...c.oferta.anual.features],
          badge: c.oferta.badge,
          ctaHref: c.ctaHref,
        }}
        mensual={{
          ...c.oferta.mensual,
          features: [...c.oferta.mensual.features],
          ctaHref: c.ctaHref,
        }}
      />

      {/* 7. GARANTÍA */}
      <Garantia
        nombre={c.garantia.nombre}
        condicionMarked={c.garantia.condicion}
        pisoLegal={c.garantia.pisoLegal}
      />

      {/* 8. FAQ */}
      <Faq
        id="faq"
        kicker={c.faq.kicker}
        titulo={c.faq.titulo}
        items={[...c.faq.items]}
      />

      {/* 9. CTA FINAL */}
      <CtaFinal
        h2Marked={c.ctaFinal.h2}
        futurePacingMarked={c.ctaFinal.futurePacing}
        ctaLabel={c.cta}
        ctaHref={c.ctaHref}
        recap={c.ctaFinal.recap}
        psMarked={c.ctaFinal.ps}
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="Quotronex"
        soporteEmail="hello@quotronex.com"
        enlaces={[...c.footer.enlaces]}
      />

    </div>
  );
}
