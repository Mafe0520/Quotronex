'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X, Users } from 'lucide-react';
import { assignUserToJob, unassignUserFromJob } from '@/app/actions/job-assignments';

type Member = { id: string; user_id: string; name: string | null; email: string | null; role: string };
type Assignment = { id: string; user_id: string; member: { name: string | null; email: string | null; role: string } | null };

function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? '?';
  return src.slice(0, 2).toUpperCase();
}

export function JobAssignments({ jobId, initialAssignments, allMembers }: {
  jobId: string;
  initialAssignments: Assignment[];
  allMembers: Member[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showPicker, setShowPicker] = useState(false);
  const [assigning, startAssign] = useTransition();
  const [removing, startRemove] = useTransition();

  const assignedUserIds = new Set(assignments.map(a => a.user_id));
  const available = allMembers.filter(m => !assignedUserIds.has(m.user_id));

  function handleAssign(member: Member) {
    startAssign(async () => {
      const res = await assignUserToJob(jobId, member.user_id);
      if (res.error) return;
      setAssignments(prev => [...prev, {
        id: crypto.randomUUID(),
        user_id: member.user_id,
        member: { name: member.name, email: member.email, role: member.role },
      }]);
      setShowPicker(false);
    });
  }

  function handleRemove(assignmentId: string) {
    startRemove(async () => {
      await unassignUserFromJob(assignmentId, jobId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} color="var(--text-tertiary)" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Equipo asignado</p>
        </div>
        {available.length > 0 && (
          <button onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
            <UserPlus size={12} /> Asignar
          </button>
        )}
      </div>

      {/* Assigned members */}
      <div className="flex flex-wrap gap-2">
        {assignments.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5">
            <div className="flex size-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[9px] font-bold text-[var(--accent)]">
              {initials(a.member?.name ?? null, a.member?.email ?? null)}
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {a.member?.name ?? a.member?.email ?? 'Miembro'}
            </span>
            <button onClick={() => handleRemove(a.id)} disabled={removing}
              className="flex size-4 items-center justify-center rounded-full hover:bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] disabled:opacity-40">
              <X size={10} color="var(--text-tertiary)" />
            </button>
          </div>
        ))}
        {assignments.length === 0 && !showPicker && (
          <p className="text-xs text-[var(--text-tertiary)]">Nadie asignado aún.</p>
        )}
      </div>

      {/* Member picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-1 rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)] bg-[var(--surface)] p-2">
            {available.map(m => (
              <button key={m.id} onClick={() => handleAssign(m)} disabled={assigning}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] disabled:opacity-50">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[10px] font-bold text-[var(--accent)]">
                  {initials(m.name, m.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{m.name ?? m.email}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] capitalize">{m.role.replace('_', ' ')}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
