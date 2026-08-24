import { requireAdmin } from '@/lib/admin/require-admin'
import { NewLeadForm } from '@/components/admin/prospecting/NewLeadForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'New Lead — Quotronex Admin' }
export const dynamic = 'force-dynamic'

export default async function NewLeadPage() {
  await requireAdmin()

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/prospecting/leads"
        className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white/80 transition-colors mb-6">
        <ArrowLeft size={14} /> All leads
      </Link>
      <h1 className="text-2xl font-black text-white mb-1">New Lead</h1>
      <p className="text-sm text-[#555] mb-8">Ingesta manual · herramienta interna</p>
      <NewLeadForm />
    </div>
  )
}
