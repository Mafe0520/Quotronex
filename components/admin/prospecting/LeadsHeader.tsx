'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { ImportModal } from './ImportModal'

export function LeadsHeader({ count }: { count: number }) {
  const [showImport, setShowImport] = useState(false)

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black [font-family:var(--font-display)] text-white">
            Prospecting Leads
          </h1>
          <p className="mt-1 text-sm text-[#888]">
            {count} lead{count !== 1 ? 's' : ''} · herramienta interna
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/8 hover:text-white transition-colors">
            <Download size={14} /> Import
          </button>
          <Link href="/admin/prospecting/leads/new"
            className="rounded-lg bg-[#3ecf8e]/15 border border-[#3ecf8e]/30 px-4 py-2 text-sm font-semibold text-[#3ecf8e] hover:bg-[#3ecf8e]/25 transition-colors">
            + New Lead
          </Link>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </>
  )
}
