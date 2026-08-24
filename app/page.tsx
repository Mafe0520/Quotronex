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
      subtitle:    "Describe the job. Quotronex builds the quote using your own prices — ready to send.",
      secondary:   'See how it works',
      socialProof: '14-day free trial · No charge until day 15 · Cancel anytime',
    },
    problema: {
      titulo: 'Does this sound familiar?',
      preguntas: [
        { textoMarked: 'A client calls for a price and you say [b]"I\'ll send something later"[/b] — and lose the job.' },
        { textoMarked: 'Your quotes look [b]less professional than your work[/b] — and clients notice.'              },
        { textoMarked: 'You lose jobs because [b]someone else quoted faster[/b] — not because they work better.'     },
        { textoMarked: 'Jobber or Housecall Pro costs [b]more every month[/b] for features you barely use.'          },
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
        { label: 'Your quote, ready before you walk away', nombrePantalla: 'Voice Quote' },
        { label: 'All your jobs, in one place',            nombrePantalla: 'Jobs'        },
        { label: 'Assign work to your crew',               nombrePantalla: 'Crew'        },
        { label: 'One tap to invoice',                     nombrePantalla: 'Invoice'     },
      ],
    },
    oferta: {
      titulo: 'One fixed price. [acento]No surprises. Ever.[/acento]',
      badge:  'BEST VALUE',
      stack: {
        lineas: [
          { resultado: 'Voice Price Book — unlimited quotes (12 months)', valor: '$228' },
          { resultado: 'Bilingual English + Spanish, built in',           valor: '$49'  },
          { resultado: 'Job tracking + crew assignment',                  valor: '$49'  },
        ],
        totalTachado: '$326',
        nota: 'Today: $32/mo (billed $384/year)',
      },
      anual: {
        nombre:          'Annual',
        precioMes:       '$32',
        totalAnual:      'Billed $384/year',
        ahorro:          '2 months free',
        descomposicionDia: 'less than $1.10/day',
        ctaLabel:        'Start my free 14-day trial',
        features: [
          'Voice Price Book — unlimited quotes',
          'English + Spanish, built in',
          'Send, sign, and invoice — all in one app',
          'Assign jobs to up to 5 crew members',
          'Fixed price. No add-ons. No surprises.',
        ],
      },
      mensual: {
        nombre:   'Monthly',
        precioMes: '$39',
        ctaLabel: 'Start monthly trial',
        features: [
          'Voice Price Book — unlimited quotes',
          'English + Spanish, built in',
          'Send, sign, and invoice — all in one app',
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
          card: { titulo: 'Client gets it instantly', detalle: 'One tap sends the quote by email, SMS, or link. The client sees it before you start the drive home.', meta: '✓ Read receipts built in', },
        },
        {
          id: 'signed', label: 'Signed', badge: 'Approved',
          card: { titulo: 'Digital signature in seconds', detalle: 'Client taps Approve on their phone. No printing, no scanning, no waiting days for a callback.', meta: '📱 Works on any phone, no app needed', },
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
      nombre:    'The 30-Day Money-Back Guarantee',
      condicion: "Try Quotronex free for 14 days. If you pay and it doesn't work for you in the first [b]30 days[/b], email us and we refund every cent — no questions asked.",
      pisoLegal: 'Processed securely by Stripe',
    },
    faq: {
      kicker: 'FAQ',
      titulo: "What you're probably wondering",
      items: [
        {
          pregunta:       'How is this different from Jobber or Housecall Pro?',
          respuestaMarked: 'Quotronex is built for 1–15 person shops that need to quote fast. [b]One fixed price, no add-ons, no price increases[/b] — ever. Jobber and Housecall Pro are built for larger companies and charge more every time you grow.',
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
          pregunta:       'What happens after the 14-day trial?',
          respuestaMarked: "You choose a plan and enter your card. If you don't, your account pauses — [b]no charge, no penalty[/b].",
        },
        {
          pregunta:       'Can I cancel anytime?',
          respuestaMarked: 'Yes. Monthly plans cancel before the next billing cycle. Annual plans come with our [b]30-day money-back guarantee[/b].',
        },
      ],
    },
    ctaFinal: {
      h2:            'Stop losing jobs to [acento]faster quotes[/acento]',
      futurePacing:  "In two weeks, every client gets a professional quote in 30 seconds. In a month, you've won jobs you used to lose.",
      recap:         '14-day free trial · No charge until day 15 · Cancel anytime',
      ps:            'P.S. — [b]The Voice Price Book uses your real rates, not generic estimates.[/b] Set it up once. Quote faster than anyone else — every time.',
    },
    footer: {
      enlaces: [
        { label: 'Privacy Policy',   href: '/privacy'      },
        { label: 'Terms of Service', href: '/terms'        },
        { label: 'Refund Policy',    href: '/refunds'      },
        { label: 'AI Disclosure',    href: '/ai-disclosure' },
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
      subtitle:    'Describe el trabajo. Quotronex genera la cotización con tus precios — lista para enviar.',
      secondary:   'Ver cómo funciona',
      socialProof: 'Prueba gratis 14 días · No se cobra hasta el día 15 · Cancela cuando quieras',
    },
    problema: {
      titulo: '¿Te suena familiar?',
      preguntas: [
        { textoMarked: 'Un cliente pide precio y dices [b]"te mando algo después"[/b] — y pierdes el trabajo.'          },
        { textoMarked: 'Tus cotizaciones se ven [b]menos profesionales que tu trabajo[/b] — y los clientes lo notan.'   },
        { textoMarked: 'Pierdes trabajos porque [b]alguien más cotizó más rápido[/b] — no porque trabaje mejor.'        },
        { textoMarked: 'Jobber o Housecall Pro cuesta [b]más cada mes[/b] por funciones que casi no usas.'              },
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
        { titulo: 'Envía. Firma.',            detalle: 'El cliente recibe una cotización profesional en segundos. Un toque para firmar.' },
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
        { label: 'Tu cotización, lista antes de que te vayas', nombrePantalla: 'Cotización'  },
        { label: 'Todos tus trabajos, en un solo lugar',       nombrePantalla: 'Trabajos'    },
        { label: 'Asigna trabajo a tu equipo',                 nombrePantalla: 'Equipo'      },
        { label: 'Una sola pantalla para facturar',            nombrePantalla: 'Factura'     },
      ],
    },
    oferta: {
      titulo: 'Un precio fijo. [acento]Sin sorpresas. Nunca.[/acento]',
      badge:  'MEJOR VALOR',
      stack: {
        lineas: [
          { resultado: 'Voice Price Book — cotizaciones ilimitadas (12 meses)', valor: '$228' },
          { resultado: 'Inglés + español incluidos',                            valor: '$49'  },
          { resultado: 'Seguimiento de trabajos + asignación de equipo',        valor: '$49'  },
        ],
        totalTachado: '$326',
        nota: 'Hoy: $32/mes (cobrado $384/año)',
      },
      anual: {
        nombre:          'Anual',
        precioMes:       '$32',
        totalAnual:      'Cobrado $384/año',
        ahorro:          '2 meses gratis',
        descomposicionDia: 'menos de $1.10/día',
        ctaLabel:        'Empezar prueba gratis 14 días',
        features: [
          'Voice Price Book — cotizaciones ilimitadas',
          'Inglés + español incluidos',
          'Envía, firma y factura — todo en una app',
          'Asigna trabajos a hasta 5 empleados',
          'Precio fijo. Sin extras. Sin sorpresas.',
        ],
      },
      mensual: {
        nombre:    'Mensual',
        precioMes: '$39',
        ctaLabel:  'Empezar prueba mensual',
        features: [
          'Voice Price Book — cotizaciones ilimitadas',
          'Inglés + español incluidos',
          'Envía, firma y factura — todo en una app',
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
          card: { titulo: 'El cliente lo recibe al instante', detalle: 'Un toque envía la cotización por correo, SMS o enlace. El cliente la ve antes de que salgas.', meta: '✓ Confirmación de lectura incluida', },
        },
        {
          id: 'firmado', label: 'Firmado', badge: 'Aprobado',
          card: { titulo: 'Firma digital en segundos', detalle: 'El cliente toca Aceptar desde su celular. Sin imprimir, sin escáner, sin esperar días por respuesta.', meta: '📱 Funciona en cualquier celular, sin instalar nada', },
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
      nombre:    'Garantía de 7 días',
      condicion: "Si pagas y no funciona para ti en los primeros [b]7 días[/b], escríbenos y te devolvemos cada centavo — sin preguntas.",
      pisoLegal: 'Procesado de forma segura por Stripe',
    },
    faq: {
      kicker: 'PREGUNTAS',
      titulo: 'Lo que probablemente te estás preguntando',
      items: [
        {
          pregunta:       '¿En qué se diferencia de Jobber o Housecall Pro?',
          respuestaMarked: 'Quotronex está hecho para negocios de 1–15 personas que necesitan cotizar rápido. [b]Un precio fijo, sin extras, sin aumentos[/b] — nunca. Jobber y Housecall Pro son para empresas más grandes y cobran más cada vez que creces.',
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
          pregunta:       '¿Qué pasa después de los 14 días de prueba?',
          respuestaMarked: 'Eliges un plan e ingresas tu tarjeta. Si no lo haces, tu cuenta se pausa — [b]sin cobro, sin penalización[/b].',
        },
        {
          pregunta:       '¿Puedo cancelar cuando quiera?',
          respuestaMarked: 'Sí. Los planes mensuales se cancelan antes del próximo ciclo. Los planes anuales incluyen nuestra [b]garantía de 7 días[/b].',
        },
      ],
    },
    ctaFinal: {
      h2:           'Deja de perder trabajos por [acento]cotizaciones lentas[/acento]',
      futurePacing: 'En dos semanas, cada cliente recibe una cotización profesional en 30 segundos. En un mes, ya ganaste trabajos que antes perdías.',
      recap:        'Prueba gratis 14 días · No se cobra hasta el día 15 · Cancela cuando quieras',
      ps:           'P.D. — [b]El Voice Price Book usa tus tarifas reales, no estimados genéricos.[/b] Configúralo una vez. Cotiza más rápido que cualquiera — siempre.',
    },
    footer: {
      enlaces: [
        { label: 'Política de privacidad', href: '/privacy'       },
        { label: 'Términos de uso',         href: '/terms'         },
        { label: 'Política de reembolso',   href: '/refunds'       },
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
        visual={<HeroMockup />}
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
        soporteEmail="hello@quotly.app"
        enlaces={[...c.footer.enlaces]}
      />

    </div>
  );
}
