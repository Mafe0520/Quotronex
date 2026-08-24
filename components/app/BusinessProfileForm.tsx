'use client'

import { useActionState } from 'react'
import { motion } from 'motion/react'
import { Building2, Phone, Mail, MapPin, Globe, FileText, Check } from 'lucide-react'
import { updateBusinessProfile } from '@/app/actions/business'

type Business = {
  id: string; name: string
  phone: string | null; email: string | null
  address: string | null; website: string | null; tagline: string | null
}

const field = 'h-12 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent)_15%,transparent)]'

export function BusinessProfileForm({ business }: { business: Business }) {
  const [result, action, pending] = useActionState(updateBusinessProfile, null)
  const saved = result === null && !pending

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Nombre del negocio <span className="text-red-500">*</span></label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="name" type="text" required defaultValue={business.name} placeholder="Mi Empresa" className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Eslogan</label>
        <div className="relative">
          <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="tagline" type="text" defaultValue={business.tagline ?? ''} placeholder="Calidad garantizada" className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Teléfono</label>
        <div className="relative">
          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="phone" type="tel" defaultValue={business.phone ?? ''} placeholder="+1 555 000 0000" className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Correo del negocio</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="email" type="email" defaultValue={business.email ?? ''} placeholder="contacto@minegocio.com" className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Dirección</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="address" type="text" defaultValue={business.address ?? ''} placeholder="123 Main St, Ciudad, Estado" className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Sitio web</label>
        <div className="relative">
          <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input name="website" type="text" defaultValue={business.website ?? ''} placeholder="https://minegocio.com" className={field} />
        </div>
      </div>

      {typeof result === 'string' && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{result}</p>
      )}

      <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={pending}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-base font-semibold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
        {pending ? 'Guardando…' : <><Check size={16} /> Guardar perfil</>}
      </motion.button>
    </form>
  )
}
