'use client';

import { useState, useActionState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Building2, Phone, Mail, MapPin, Globe,
  FileText, Check, Lock, Eye, EyeOff, LogOut, User, ShieldCheck,
  CreditCard, Bell, Pencil, X, MessageCircle, Camera, Languages, SlidersHorizontal,
} from 'lucide-react';
import { updateBusinessProfile, updateBusinessDefaults, changePassword } from '@/app/actions/business';
import { signOut } from '@/app/actions/auth';
import { TeamSection } from '@/components/app/TeamSection';
import type { MemberRole } from '@/lib/permissions';
import { useLang } from '@/app/lang-context';
import { createClient } from '@supabase/supabase-js';

const supabasePub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Business = {
  id: string; name: string;
  phone: string | null; email: string | null;
  address: string | null; website: string | null; tagline: string | null;
  logo_url: string | null;
  default_tax_pct: number | null;
  default_deposit_pct: number | null;
  default_payment_terms: string | null;
  lang: string | null;
} | null;

const spring = { type: 'spring' as const, stiffness: 380, damping: 38 };

const inputCls = 'h-12 w-full rounded-2xl border border-[color-mix(in_oklab,var(--text-tertiary)_25%,transparent)] bg-[var(--bg)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]';
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]';

/* ── Business profile sheet ─────────────────────────────────────── */
function BusinessSheet({ business, onClose }: { business: NonNullable<Business>; onClose: () => void }) {
  const [result, action, pending] = useActionState(updateBusinessProfile, null);
  const [logoUrl, setLogoUrl] = useState(business.logo_url ?? '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${business.id}/logo.${ext}`;
      await supabasePub.storage.from('logos').upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabasePub.storage.from('logos').getPublicUrl(path);
      setLogoUrl(publicUrl + '?t=' + Date.now());
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  }

  return (
    <SheetWrapper onClose={onClose} title="Perfil del negocio">
      <form action={action} className="flex flex-col gap-4">
        {/* Logo */}
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <input type="hidden" name="logo_url" value={logoUrl} />
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-[var(--surface)] overflow-hidden border border-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                : <span className="text-3xl font-black [font-family:var(--font-display)] text-[var(--accent)]">{business.name.slice(0,1).toUpperCase()}</span>
              }
            </div>
            <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
              className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow disabled:opacity-60">
              {uploadingLogo ? <span className="text-xs">…</span> : <Camera size={13} />}
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Logo del negocio (aparece en cotizaciones)</p>
        </div>

        {[
          { name: 'name',    label: 'Nombre *',          type: 'text',  Icon: Building2, val: business.name,    placeholder: 'Mi Empresa' },
          { name: 'tagline', label: 'Eslogan',            type: 'text',  Icon: FileText,  val: business.tagline, placeholder: 'Calidad garantizada' },
          { name: 'phone',   label: 'Teléfono',           type: 'tel',   Icon: Phone,     val: business.phone,   placeholder: '+1 555 000 0000' },
          { name: 'email',   label: 'Correo del negocio', type: 'email', Icon: Mail,      val: business.email,   placeholder: 'contacto@empresa.com' },
          { name: 'address', label: 'Dirección',          type: 'text',  Icon: MapPin,    val: business.address, placeholder: '123 Calle, Ciudad' },
          { name: 'website', label: 'Sitio web',          type: 'text',  Icon: Globe,     val: business.website, placeholder: 'https://empresa.com' },
        ].map(({ name, label, type, Icon, val, placeholder }) => (
          <div key={name} className="flex flex-col gap-1.5">
            <label className={labelCls}>{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input name={name} type={type} required={name === 'name'}
                defaultValue={val ?? ''} placeholder={placeholder}
                className={`${inputCls} pl-9`} />
            </div>
          </div>
        ))}

        {typeof result === 'string' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{result}</p>
        )}

        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={pending}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
          {pending ? 'Guardando…' : <><Check size={15} /> Guardar cambios</>}
        </motion.button>
      </form>
    </SheetWrapper>
  );
}

/* ── Change password sheet ──────────────────────────────────────── */
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [result, action, pending] = useActionState(changePassword, null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const done = result === null && !pending;

  return (
    <SheetWrapper onClose={onClose} title="Cambiar contraseña">
      {done && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <Check size={15} /> Contraseña actualizada correctamente
        </motion.div>
      )}
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Nueva contraseña</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input name="password" type={showPwd ? 'text' : 'password'} required minLength={8}
              placeholder="Mínimo 8 caracteres"
              className={`${inputCls} pl-9 pr-10`} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Confirmar contraseña</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input name="confirm" type={showConf ? 'text' : 'password'} required
              placeholder="Repite la contraseña"
              className={`${inputCls} pl-9 pr-10`} />
            <button type="button" onClick={() => setShowConf(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {typeof result === 'string' && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{result}</p>
        )}

        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={pending}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white [box-shadow:var(--shadow-cta)] disabled:opacity-60">
          {pending ? 'Guardando…' : <><Lock size={15} /> Actualizar contraseña</>}
        </motion.button>
      </form>
    </SheetWrapper>
  );
}

/* ── Defaults sheet ─────────────────────────────────────────────── */
function DefaultsSheet({ business, onClose }: { business: NonNullable<Business>; onClose: () => void }) {
  const { lang, setLang } = useLang();
  const [tax, setTax] = useState(String(business.default_tax_pct ?? 0));
  const [deposit, setDeposit] = useState(String(business.default_deposit_pct ?? 0));
  const [terms, setTerms] = useState(business.default_payment_terms ?? 'Due on receipt');
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const appLang = (business.lang ?? 'en') as 'en' | 'es';
  const [selectedLang, setSelectedLang] = useState<'en' | 'es'>(lang === 'es' ? 'es' : appLang);

  function handleSave() {
    startSave(async () => {
      const { error } = await updateBusinessDefaults({
        default_tax_pct: parseFloat(tax) || 0,
        default_deposit_pct: parseFloat(deposit) || 0,
        default_payment_terms: terms,
        lang: selectedLang,
      });
      if (!error) {
        setLang(selectedLang);
        setSaved(true);
        setTimeout(onClose, 800);
      }
    });
  }

  return (
    <SheetWrapper onClose={onClose} title="Defaults y preferencias">
      <div className="flex flex-col gap-5">
        {/* Language */}
        <div>
          <label className={labelCls}>Idioma de la app</label>
          <div className="mt-2 flex gap-2">
            {(['es', 'en'] as const).map(l => (
              <button key={l} type="button" onClick={() => setSelectedLang(l)}
                className={`flex flex-1 h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${selectedLang === l ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
                {l === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}
              </button>
            ))}
          </div>
        </div>

        {/* Tax */}
        <div>
          <label className={labelCls}>Impuesto predeterminado (%)</label>
          <div className="mt-2 flex items-center rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4">
            <input type="number" min="0" max="100" step="0.01"
              value={tax} onChange={e => setTax(e.target.value)}
              className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] outline-none" />
            <span className="text-sm text-[var(--text-tertiary)]">%</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Se pre-llena al crear cada cotización</p>
        </div>

        {/* Deposit */}
        <div>
          <label className={labelCls}>Depósito predeterminado (%)</label>
          <div className="mt-2 flex items-center rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4">
            <input type="number" min="0" max="100" step="1"
              value={deposit} onChange={e => setDeposit(e.target.value)}
              className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] outline-none" />
            <span className="text-sm text-[var(--text-tertiary)]">%</span>
          </div>
        </div>

        {/* Payment terms */}
        <div>
          <label className={labelCls}>Términos de pago predeterminados</label>
          <select value={terms} onChange={e => setTerms(e.target.value)}
            className="mt-2 w-full h-12 rounded-xl border border-[color-mix(in_oklab,var(--text-tertiary)_20%,transparent)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
            <option value="Due on receipt">Al recibir</option>
            <option value="Net 15">Net 15 días</option>
            <option value="Net 30">Net 30 días</option>
            <option value="50% upfront">50% por adelantado</option>
            <option value="Custom">Personalizado</option>
          </select>
        </div>

        {saved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <Check size={15} /> Guardado correctamente
          </motion.div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} disabled={saving}
          onClick={handleSave}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white disabled:opacity-60">
          {saving ? 'Guardando…' : <><Check size={15} /> Guardar preferencias</>}
        </motion.button>
      </div>
    </SheetWrapper>
  );
}

/* ── Sheet wrapper ──────────────────────────────────────────────── */
function SheetWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
        onClick={e => e.stopPropagation()}
        className="w-full max-h-[90dvh] rounded-t-3xl bg-[var(--bg)] flex flex-col">
        {/* Handle + title */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <p className="text-lg font-black [font-family:var(--font-display)] text-[var(--text-primary)]">{title}</p>
          <button onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[var(--surface)]">
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Row ────────────────────────────────────────────────────────── */
function Row({ Icon, label, sub, iconBg, iconColor, onClick, danger = false }: {
  Icon: React.FC<{ size: number; color?: string; className?: string }>;
  label: string; sub?: string; iconBg: string; iconColor: string;
  onClick?: () => void; danger?: boolean;
}) {
  return (
    <motion.button whileTap={{ scale: 0.985 }} onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left w-full [touch-action:manipulation]">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={18} color={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>{label}</p>
        {sub && <p className="truncate text-xs text-[var(--text-tertiary)]">{sub}</p>}
      </div>
      {!danger && <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />}
    </motion.button>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export function SettingsScreen({ user, business, members = [], invites = [], callerRole = 'owner' }: {
  user: { email: string; id: string };
  business: Business;
  members?: any[];
  invites?: any[];
  callerRole?: MemberRole;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<'business' | 'password' | 'defaults' | null>(null);
  const [signingOut, startSignOut] = useTransition();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-4 border-b border-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]">
        <button onClick={() => router.push('/app')}
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface)]">
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <h1 className="text-base font-bold [font-family:var(--font-display)] text-[var(--text-primary)]">Ajustes</h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-col gap-6 px-5 pt-5 pb-16">

        {/* Business card */}
        {business && (
          <motion.button whileTap={{ scale: 0.985 }} onClick={() => setSheet('business')}
            className="flex items-center gap-4 rounded-2xl bg-[var(--surface)] p-4 text-left w-full">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] overflow-hidden">
              {business.logo_url
                ? <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
                : <span className="text-2xl font-black [font-family:var(--font-display)] text-[var(--accent)]">{business.name.slice(0, 1).toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black [font-family:var(--font-display)] text-[var(--text-primary)] truncate">{business.name}</p>
              {business.tagline && <p className="text-xs text-[var(--text-tertiary)] truncate">{business.tagline}</p>}
              {business.phone && <p className="text-xs text-[var(--text-tertiary)]">{business.phone}</p>}
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
              <Pencil size={14} color="var(--accent)" />
            </div>
          </motion.button>
        )}

        {/* Negocio section */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">Negocio</p>
          <Row Icon={Building2}        label="Perfil del negocio"      sub={business?.name ?? 'Sin configurar'}
            iconBg="bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]" iconColor="var(--accent)"
            onClick={() => setSheet('business')} />
          <Row Icon={SlidersHorizontal} label="Defaults y preferencias"  sub="Impuesto, depósito, idioma"
            iconBg="bg-violet-500/12" iconColor="#8b5cf6"
            onClick={() => setSheet('defaults')} />
        </div>

        {/* Cuenta section */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">Cuenta</p>
          <Row Icon={User}        label="Correo electrónico"   sub={user.email}
            iconBg="bg-sky-500/12" iconColor="#38bdf8" />
          <Row Icon={Lock}        label="Cambiar contraseña"   sub="Actualiza tu contraseña de acceso"
            iconBg="bg-purple-500/12" iconColor="#a855f7"
            onClick={() => setSheet('password')} />
        </div>

        {/* Team section */}
        <TeamSection members={members} invites={invites} callerRole={callerRole} />

        {/* Plan section */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">Plan</p>
          <div className="rounded-2xl bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Plan Gratuito</p>
                <p className="text-xs text-[var(--text-tertiary)]">Hasta 10 cotizaciones al mes</p>
              </div>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">Free</span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-xs font-bold text-white [box-shadow:var(--shadow-cta)]">
              <CreditCard size={13} /> Mejorar plan
            </motion.button>
          </div>
        </div>

        {/* More section */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">Más</p>
          <Row Icon={Bell}        label="Notificaciones"       sub="Push, email y alertas"
            iconBg="bg-amber-500/12" iconColor="#f59e0b" />
          <Row Icon={ShieldCheck} label="Privacidad y datos"   sub="Tus datos siempre seguros"
            iconBg="bg-green-500/12" iconColor="#22c55e" />
          <a href="/app/support">
            <Row Icon={MessageCircle} label="Soporte"          sub="Abre un ticket de ayuda"
              iconBg="bg-blue-500/12" iconColor="#3b82f6" />
          </a>
        </div>

        {/* App version */}
        <p className="text-center text-xs text-[var(--text-tertiary)]">Quotronex v0.1 · mafepa05@gmail.com</p>

        {/* Sign out */}
        <motion.button whileTap={{ scale: 0.97 }} disabled={signingOut}
          onClick={() => startSignOut(async () => { await signOut(); })}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-50">
          <LogOut size={16} />
          {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </motion.button>

      </div>

      {/* Sheets */}
      <AnimatePresence>
        {sheet === 'business' && business && (
          <BusinessSheet business={business} onClose={() => setSheet(null)} />
        )}
        {sheet === 'password' && (
          <PasswordSheet onClose={() => setSheet(null)} />
        )}
        {sheet === 'defaults' && business && (
          <DefaultsSheet business={business} onClose={() => setSheet(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
