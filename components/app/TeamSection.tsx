'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Plus, X, ChevronDown, Trash2, Mail, Clock, Check } from 'lucide-react'
import { inviteTeamMember, removeMember, updateMemberRole, revokeInvite } from '@/app/actions/team'
import { ROLE_LABELS, ASSIGNABLE_ROLES, type MemberRole } from '@/lib/permissions'

type Member = {
  id: string
  user_id: string | null
  role: MemberRole
  name: string | null
  email: string | null
  accepted_at: string | null
}

type Invite = {
  id: string
  email: string
  name: string | null
  role: MemberRole
  expires_at: string
  accepted_at: string | null
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 38 }
const ROLE_COLORS: Record<MemberRole, string> = {
  owner:          'bg-purple-50 text-purple-700',
  admin:          'bg-blue-50 text-blue-700',
  office_manager: 'bg-cyan-50 text-cyan-700',
  estimator:      'bg-amber-50 text-amber-700',
  field_worker:   'bg-gray-100 text-gray-600',
}

export function TeamSection({
  members: initialMembers,
  invites: initialInvites,
  callerRole,
}: {
  members: Member[]
  invites: Invite[]
  callerRole: MemberRole
}) {
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail, setInvEmail] = useState('')
  const [invName, setInvName] = useState('')
  const [invRole, setInvRole] = useState<MemberRole>('field_worker')
  const [invError, setInvError] = useState<string | null>(null)
  const [invSent, setInvSent] = useState(false)
  const [inviting, startInvite] = useTransition()
  const [removing, startRemove] = useTransition()
  const [updating, startUpdate] = useTransition()

  const canManage = callerRole === 'owner' || callerRole === 'admin'

  function handleInvite() {
    if (!invEmail.trim()) return
    setInvError(null)
    startInvite(async () => {
      const res = await inviteTeamMember({ email: invEmail.trim(), name: invName.trim(), role: invRole })
      if (res.error) { setInvError(res.error); return }
      setInvites(prev => {
        const filtered = prev.filter(i => i.email !== invEmail.trim().toLowerCase())
        return [...filtered, {
          id: crypto.randomUUID(),
          email: invEmail.trim().toLowerCase(),
          name: invName.trim() || null,
          role: invRole,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        }]
      })
      setInvSent(true)
      setTimeout(() => { setInvSent(false); setShowInvite(false); setInvEmail(''); setInvName('') }, 2000)
    })
  }

  function handleRemove(id: string) {
    startRemove(async () => {
      await removeMember(id)
      setMembers(m => m.filter(x => x.id !== id))
    })
  }

  function handleRoleChange(id: string, role: MemberRole) {
    startUpdate(async () => {
      await updateMemberRole(id, role)
      setMembers(m => m.map(x => x.id === id ? { ...x, role } : x))
    })
  }

  function handleRevokeInvite(id: string) {
    startRemove(async () => {
      await revokeInvite(id)
      setInvites(i => i.filter(x => x.id !== id))
    })
  }

  const pendingInvites = invites.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} color="var(--text-tertiary)" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Equipo</p>
        </div>
        {canManage && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white">
            <Plus size={12} /> Invitar
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
        {members.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <span className="text-sm font-bold text-[var(--accent)]">
                {(m.name ?? m.email ?? '?').slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.name ?? m.email ?? 'Miembro'}</p>
              {m.email && m.name && <p className="text-xs text-[var(--text-tertiary)] truncate">{m.email}</p>}
            </div>
            {canManage && m.role !== 'owner' ? (
              <div className="relative">
                <select
                  disabled={updating}
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value as MemberRole)}
                  className={`appearance-none rounded-full px-3 py-1 pr-6 text-xs font-semibold cursor-pointer ${ROLE_COLORS[m.role]} border-0 outline-none`}
                >
                  {ASSIGNABLE_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
              </div>
            ) : (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[m.role]}`}>
                {ROLE_LABELS[m.role]}
              </span>
            )}
            {canManage && m.role !== 'owner' && (
              <button onClick={() => handleRemove(m.id)} disabled={removing}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Invitaciones pendientes</p>
          <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
            {pendingInvites.map((inv, i) => (
              <div key={inv.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[color-mix(in_oklab,var(--text-tertiary)_8%,transparent)]' : ''}`}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Clock size={15} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{inv.name ?? inv.email}</p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{inv.email} · {ROLE_LABELS[inv.role]}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">Pendiente</span>
                {canManage && (
                  <button onClick={() => handleRevokeInvite(inv.id)} disabled={removing}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite sheet */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="w-full rounded-t-3xl bg-[var(--bg)] p-5 flex flex-col gap-4">
              <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)]" />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[var(--text-primary)]">Invitar miembro</p>
                <button onClick={() => setShowInvite(false)}><X size={20} color="var(--text-tertiary)" /></button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Correo electrónico *</label>
                  <div className="flex items-center rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 gap-2">
                    <Mail size={14} color="var(--text-tertiary)" />
                    <input autoFocus type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Nombre (opcional)</label>
                  <input type="text" value={invName} onChange={e => setInvName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-tertiary)]">Rol</label>
                  <div className="flex flex-wrap gap-2">
                    {ASSIGNABLE_ROLES.map(r => (
                      <button key={r} onClick={() => setInvRole(r)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${invRole === r ? `${ROLE_COLORS[r]} border-current` : 'border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] text-[var(--text-secondary)]'}`}>
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {invError && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{invError}</p>}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={handleInvite}
                disabled={inviting || !invEmail.trim()}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60">
                {invSent ? <><Check size={16} /> Invitación enviada</> : inviting ? 'Enviando…' : 'Enviar invitación'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
