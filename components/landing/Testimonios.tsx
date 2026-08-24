'use client';

import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { SectionShell, useReveal, VIEWPORT_ONCE } from './ui';
import { useLang } from '@/app/lang-context';

const TESTIMONIALS = {
  en: [
    {
      quote: "I used to spend an hour at night writing quotes. Now I dictate in the truck and the client has it before I'm home. Won three jobs in the first week.",
      name: 'Carlos M.',
      title: 'Roofing contractor · Houston, TX',
    },
    {
      quote: "Jobber wanted $149/month and I still had to build quotes manually. Quotronex does it for me with my own prices. No comparison.",
      name: 'Miguel R.',
      title: 'General contractor · Dallas, TX',
    },
    {
      quote: "A client called on a Saturday. I sent a professional quote in 2 minutes from my phone. He signed the same day. That's never happened before.",
      name: 'José A.',
      title: 'Painting & drywall · Newark, NJ',
    },
  ],
  es: [
    {
      quote: "Antes me pasaba una hora en la noche armando cotizaciones. Ahora dicto en la camioneta y el cliente la tiene antes de que llegue a casa. Gané tres trabajos la primera semana.",
      name: 'Carlos M.',
      title: 'Contratista de techos · Houston, TX',
    },
    {
      quote: "Jobber me pedía $149 al mes y yo seguía armando cotizaciones a mano. Quotronex lo hace por mí con mis propios precios. No hay comparación.",
      name: 'Miguel R.',
      title: 'Contratista general · Dallas, TX',
    },
    {
      quote: "Un cliente llamó un sábado. Le mandé una cotización profesional en 2 minutos desde el celular. Firmó el mismo día. Nunca me había pasado antes.",
      name: 'José A.',
      title: 'Pintura y drywall · Newark, NJ',
    },
  ],
};

function Stars() {
  return (
    <div className="flex gap-0.5 mb-3">
      {[0,1,2,3,4].map(i => (
        <Star key={i} size={13} className="fill-[var(--accent)] text-[var(--accent)]" />
      ))}
    </div>
  );
}

export function Testimonios() {
  const { contenedor, item } = useReveal();
  const { lang } = useLang();
  const t = TESTIMONIALS[lang];

  return (
    <SectionShell elevacion="alt" ariaLabel={lang === 'es' ? 'Testimonios' : 'Testimonials'}>
      <motion.div variants={contenedor} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}>

        <motion.div variants={item} className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase mb-2">
            {lang === 'es' ? 'Lo que dicen los contratistas' : 'What contractors say'}
          </p>
          <h2 className="text-balance text-2xl font-black leading-tight text-[var(--text-primary)] [font-family:var(--font-display)] md:text-3xl">
            {lang === 'es'
              ? <>Más de 400 contratistas ya <span className="text-[var(--accent)]">ganan más trabajos</span></>
              : <>400+ contractors already <span className="text-[var(--accent)]">winning more jobs</span></>}
          </h2>
        </motion.div>

        <motion.div variants={item}
          className="mx-auto max-w-5xl grid gap-4 md:grid-cols-3">
          {t.map((testimonial, i) => (
            <div key={i}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 flex flex-col">
              <Stars />
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] flex-1 mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{testimonial.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{testimonial.title}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </motion.div>
    </SectionShell>
  );
}
