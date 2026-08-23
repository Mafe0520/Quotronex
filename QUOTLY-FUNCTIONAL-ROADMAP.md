# QUOTLY — FUNCTIONAL ROADMAP
*Generado: 2026-08-22 | v2 actualizado: 2026-08-22 | Estado del repo: UI shells sin backend*

---

## DECISIÓN DE PLATAFORMA (oficial — no re-discutir)

**Quotly es una Web App responsiva + PWA. No habrá apps nativas en la primera etapa.**

| Aspecto | Decisión |
|---|---|
| Plataforma | Responsive Web App + PWA installable |
| Código | Una sola base (Next.js) — mismo backend, misma DB, mismos roles |
| Native iOS/Android | Después de validar el SaaS — arquitectura preparada para reutilizar backend/APIs/auth/permisos/business logic |
| Diseño | Cada feature nueva se diseña y prueba desde el inicio en mobile (375px), tablet (768px) y desktop (1280px+) |
| Seguridad | El tamaño de pantalla NO define acceso. Los roles/permisos definen qué ve cada persona |
| Desktop primero | ❌ — ambos son first-class, construidos en paralelo |

### Experiencias por rol y dispositivo

| Rol | Pantalla principal | Dispositivo típico |
|---|---|---|
| Owner / Admin | Dashboard financiero, profitability, QB review, equipo, Price Book, Settings | Desktop + Mobile |
| Office Manager | Pending tasks, estimates, invoices, customers | Desktop + Mobile |
| Estimator / Sales | Customers, estimates, voice quote, jobs | Mobile-first |
| Field Worker / Crew | Today, Assigned Jobs, Clock In/Out, Photos, Notes, Change Orders | Mobile-only |

---

## PRICING (oficial — no re-discutir sin evidencia)

### Planes normales
| Plan | Precio | Usuarios incluidos |
|---|---|---|
| Solo | $29/mes | 1 |
| Crew | $39/mes | hasta 3 |
| Business | $59/mes | hasta 7 |
| Pro Team | $89/mes | hasta 15 |
| Usuario adicional | +$5/mes | cualquier plan |

**Regla de features:** todas las funciones están disponibles en todos los planes. Los planes cambian por cantidad de usuarios, no por acceso a features.

### Founding Contractors (primeros 100)
- Precio bloqueado mientras la suscripción esté activa (≈$5/mes de descuento por plan)
- Ejemplo orientativo: Solo $24 · Crew $34 · Business $54 · Pro $84
- Precios definitivos sujetos a unit economics — no fijar hasta revisar con FICHA-MERCADO.md
- Beneficios: founder pricing locked + early access + assisted setup + priority support + feature input + beta access + badge opcional "Founding Contractor"
- Mensaje: *"Founding members help shape what we build next."* — no prometer que toda feature solicitada se construirá
- Demo outreach: invitar a Join the first 100 Founding Contractors

---

## TABLA 1 — FEATURE MAP COMPLETO

> **Leyenda estado actual:** ✅ UI completa | 🔶 UI parcial | ❌ No existe
> **Complejidad:** L=Low M=Medium H=High XH=Extra-high
> **Riesgo:** L=Low M=Medium H=High

| # | Feature | Existe? | Estado actual | Fase | DB changes | Ext. dep. | Complejidad | Riesgo | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Describe job (text)** | 🔶 | Onboarding step 3 simulado | MVP | quotes | OpenAI | M | M | Conectar a API real |
| 2 | **Describe job (voice)** | 🔶 | UI presente, sin Web Speech API | MVP | — | OpenAI Whisper | M | M | `navigator.mediaDevices` |
| 3 | **AI generates estimate from Price Book** | ❌ | 0% | MVP | quotes, line_items | OpenAI | H | H | Core del producto — BFF route |
| 4 | **Price Book (services/unit/price)** | 🔶 | Onboarding step 2 sin persistir | MVP | price_book_items | — | M | L | Datos se descartan al recargar |
| 5 | **Price Book — labor/materials/tax** | ❌ | 0% | Phase 1 | price_book_items | — | M | L | Ampliar schema |
| 6 | **Price Book — optional items** | ❌ | 0% | Phase 1 | price_book_items | — | L | L | Flag en misma tabla |
| 7 | **Price Book — Quick Favorites** | ❌ | 0% | Phase 2 | price_book_items | — | L | L | `is_favorite` + sort |
| 8 | **Edit estimate (line items, qty, discount)** | ❌ | 0% | MVP | line_items | — | H | M | Tabla editable + recalc |
| 9 | **PDF Preview antes de enviar** | ❌ | 0% | MVP | — | — | M | L | Server-side (ver decisiones arquitectura) |
| 10 | **Send by Email** | ❌ | 0% | MVP | estimate_events | Resend | M | M | Template + secure link |
| 11 | **Send by SMS** | ❌ | 0% | MVP | estimate_events | Twilio | M | M | Solo secure link por SMS |
| 12 | **Download PDF** | ❌ | 0% | MVP | — | — | M | L | Mismo PDF del preview |
| 13 | **Copy Secure Link** | ❌ | 0% | MVP | secure_tokens | — | L | L | UUID + expiry |
| 14 | **Estimate status (Draft→Paid)** | 🔶 | Mock en AppShell | MVP | quotes.status | — | M | L | State machine |
| 15 | **Decline + reason** | ❌ | 0% | Phase 1 | estimate_events | — | L | L | Página pública cliente |
| 16 | **Request changes (client)** | ❌ | 0% | Phase 1 | quote_revisions | — | M | M | Nueva revisión sin perder anterior |
| 17 | **Version history / autosave** | ❌ | 0% | Phase 1 | quote_revisions | — | H | M | Snapshot en cada cambio |
| 18 | **Recovered drafts** | ❌ | 0% | Phase 1 | — | — | M | M | localStorage + sync (PWA) |
| 19 | **Change log (quién cambió qué)** | ❌ | 0% | Phase 2 | audit_log | — | M | L | Insert-only |
| 20 | **Draft conflict warning** | ❌ | 0% | Phase 2 | — | Supabase Realtime | H | H | Lock optimista en MVP |
| 21 | **Duplicate & modify estimate** | ❌ | 0% | Phase 1 | — | — | L | L | Deep copy |
| 22 | **Multiple quotes per project** | ❌ | 0% | Phase 1 | projects | — | M | L | 1→N |
| 23 | **Good / Better / Best** | ❌ | 0% | Phase 2 | quote_tiers | — | M | M | 3 variantes vinculadas |
| 24 | **Optional add-ons (client selects)** | ❌ | 0% | Phase 2 | quote_addons | — | M | M | Recalcular en client page |
| 25 | **Estimate expiration** | ❌ | 0% | Phase 1 | quotes.expires_at | — | L | L | Check on-read |
| 26 | **Optional signature** | ❌ | 0% | Phase 1 | quote_signatures | — | M | M | Canvas + PDF stamp |
| 27 | **Optional deposit** | ❌ | 0% | Phase 1 | deposits | Stripe Connect | H | H | Requiere Stripe Connect |
| 28 | **Quote Rescue (unsent drafts)** | ❌ | 0% | Phase 2 | — | — | M | L | Query + push notif |
| 29 | **Follow-up Assistant** | ❌ | 0% | Phase 2 | follow_ups | Resend/Twilio | M | M | Sugerido, no automático |
| 30 | **AI learns from contractor history** | ❌ | 0% | Phase 2 | — | OpenAI | H | M | RAG sobre historial propio |
| 31 | **"What should I charge?"** | ❌ | 0% | Phase 2 | — | OpenAI | M | M | Solo datos propios del contractor |
| 32 | **Flexible markup (labor/materials/cat.)** | ❌ | 0% | Phase 1 | price_book_items | — | M | L | Campos adicionales |
| 33 | **Client view vs internal view** | ❌ | 0% | Phase 1 | — | — | M | M | Dual render mode |
| 34 | **Saved message templates** | ❌ | 0% | Phase 1 | message_templates | — | L | L | CRUD simple |
| 35 | **Customer / Project Identity** | 🔶 | Mock en AppShell | MVP | customers, projects | — | M | L | |
| 36 | **Private notes (job)** | ❌ | 0% | Phase 1 | notes | — | L | L | `is_private=true` |
| 37 | **Smart Search** | ❌ | 0% | Phase 2 | — | Supabase FTS | M | L | PG full-text |
| 38 | **Universal search / command bar** | ❌ | 0% | Phase 2 | — | — | H | L | Composición sobre #37 |
| 39 | **Same customer, new job** | ❌ | 0% | Phase 1 | — | — | L | L | Reutilizar customer_id |
| 40 | **Customer contact preference** | ❌ | 0% | Phase 1 | customers | — | L | L | 2 campos |
| 41 | **Customer tags (private)** | ❌ | 0% | Phase 2 | customer_tags | — | L | L | |
| 42 | **Archive without delete** | ❌ | 0% | Phase 1 | soft delete | — | L | L | `archived_at` en todas las tablas |
| 43 | **One-click resend** | ❌ | 0% | Phase 1 | — | Resend/Twilio | L | L | Reutiliza send flow |
| 44 | **Compare versions** | ❌ | 0% | Phase 2 | — | — | M | L | Diff de revisions |
| 45 | **Estimate sanity check** | ❌ | 0% | Phase 1 | — | — | M | L | Client-side pre-send |
| 46 | **Test PDF (send to myself)** | ❌ | 0% | Phase 1 | — | Resend | L | L | Destinatario = owner |
| 47 | **Branding check** | ❌ | 0% | Phase 1 | — | — | L | L | UI check logo/phone/email |
| 48 | **Done-for-you setup (file upload)** | ❌ | 0% | Phase 1 | — | Storage + OpenAI | H | M | Upload + AI parse → Price Book |
| 49 | **Import old estimates** | ❌ | 0% | Phase 1 | — | Storage + OpenAI | H | M | Similar a #48 |
| 50 | **Convert Estimate → Job** | ❌ | 0% | MVP | jobs | — | M | L | |
| 51 | **Job Assignment (to employee/crew)** | ❌ | 0% | Phase 1 | job_assignments | — | M | L | |
| 52 | **Crew View (today's jobs)** | ❌ | 0% | Phase 1 | — | — | M | L | Mobile-only layout |
| 53 | **Role-specific home screen** | ❌ | 0% | Phase 1 | — | — | M | M | Condicionado por rol en sesión |
| 54 | **Job Photos (before/during/after)** | ❌ | 0% | Phase 1 | job_photos | Supabase Storage | M | L | |
| 55 | **Voice notes (job site)** | ❌ | 0% | Phase 2 | job_notes | OpenAI Whisper | M | M | Transcripción + detección additional work |
| 56 | **Change Orders** | ❌ | 0% | Phase 1 | change_orders | — | H | M | Draft → send → accept → add to total |
| 57 | **Team handoff note** | ❌ | 0% | Phase 1 | job_notes | — | L | L | Visible al crew |
| 58 | **Internal flags** | ❌ | 0% | Phase 1 | jobs.flag | — | L | L | Enum column |
| 59 | **Activity Log** | ❌ | 0% | Phase 2 | audit_log | — | M | L | Reutiliza #19 |
| 60 | **Team Time & Labor (clock in/out)** | ❌ | 0% | Phase 2 | time_entries | — | H | M | Mobile-first |
| 61 | **Weekly Timesheets + approval** | ❌ | 0% | Phase 2 | timesheets | — | H | M | Depende de #60 |
| 62 | **Payroll Export (CSV)** | ❌ | 0% | Later | — | — | M | L | → Gusto/ADP prep |
| 63 | **Estimated vs Actual Labor** | ❌ | 0% | Phase 2 | — | — | M | L | Derived de time_entries + quote |
| 64 | **Expenses (add expense + receipt)** | ❌ | 0% | Phase 1 | expenses | Supabase Storage | M | M | |
| 65 | **Receipt photo (AI extract)** | ❌ | 0% | Phase 2 | — | OpenAI Vision | M | M | Depende de #64 |
| 66 | **Duplicate expense warning** | ❌ | 0% | Phase 2 | — | — | M | L | Hash/fingerprint |
| 67 | **Job Profitability** | ❌ | 0% | Phase 2 | — | — | M | L | Derived |
| 68 | **Margin Warning** | ❌ | 0% | Phase 2 | — | OpenAI | L | L | Depende de #67 |
| 69 | **Job Close Checklist** | ❌ | 0% | Phase 1 | — | — | L | L | Gate pre-completar |
| 70 | **Job Completion Summary (to client)** | ❌ | 0% | Phase 2 | — | Resend | M | L | |
| 71 | **Warranty / Service Note** | ❌ | 0% | Phase 2 | warranties | — | L | L | |
| 72 | **Repeat Job Templates** | ❌ | 0% | Phase 2 | job_templates | — | M | L | |
| 73 | **Continue where you left off** | 🔶 | Mock en AppShell | Phase 1 | — | — | L | L | Query last 5 modified |
| 74 | **Duplicate customer warning** | ❌ | 0% | Phase 1 | — | — | L | L | Check email/phone |
| 75 | **Convert Estimate → Invoice** | ❌ | 0% | MVP | invoices | — | M | L | Copy + tipo |
| 76 | **Invoice Preview / Send** | ❌ | 0% | MVP | invoice_events | Resend/Twilio | M | M | Reutiliza send flow |
| 77 | **Invoice Status (Draft→Paid→Overdue)** | ❌ | 0% | MVP | invoices.status | — | M | L | Cron para Overdue |
| 78 | **Deposits / Partial Payments** | ❌ | 0% | Phase 1 | payments | Stripe | H | H | |
| 79 | **Progress Invoices** | ❌ | 0% | Phase 2 | invoice_milestones | Stripe | H | M | |
| 80 | **Balance Due (everywhere)** | ❌ | 0% | Phase 1 | — | — | M | L | Derived |
| 81 | **Automatic Payment Receipt** | ❌ | 0% | Phase 1 | — | Resend | L | L | Stripe webhook |
| 82 | **Payment Mismatch Warning** | ❌ | 0% | Phase 1 | — | — | L | L | Client-side pre-confirm |
| 83 | **Stripe Online Payments** | ❌ | 0% | Phase 1 | stripe_accounts | Stripe Connect | XH | H | Cada contractor = Stripe sub-account |
| 84 | **Zelle / Cash App instructions** | ❌ | 0% | Phase 1 | businesses | — | L | L | Guardar tag, mostrar instrucciones |
| 85 | **Cash / Check / External (record only)** | ❌ | 0% | MVP | payments | — | L | L | Sin integración |
| 86 | **Payment Methods per Invoice** | ❌ | 0% | Phase 2 | invoice_payment_methods | — | M | L | Override de globales |
| 87 | **Payment Reminders** | ❌ | 0% | Phase 2 | reminders | Resend/Twilio | M | M | Sugerido, no automático |
| 88 | **Outstanding Dashboard** | 🔶 | Stats mock | Phase 1 | — | — | M | L | Queries reales |
| 89 | **Clickable Metrics (drill-down)** | 🔶 | Mock | Phase 2 | — | — | M | L | |
| 90 | **Client Activity Timeline** | ❌ | 0% | Phase 2 | estimate_events | — | M | L | Feed de eventos |
| 91 | **Document History chain** | ❌ | 0% | Phase 1 | — | — | M | L | FK chain + UI |
| 92 | **Job Package (download all)** | ❌ | 0% | Later | — | — | H | M | ZIP vía Supabase Storage |
| 93 | **Bulk Actions** | ❌ | 0% | Later | — | — | M | L | |
| 94 | **QuickBooks Manual Sync** | ❌ | 0% | Phase 2 | qb_batches, qb_items | QuickBooks API | XH | H | Manual Review → Owner Approval → Sync |
| 95 | **QuickBooks Sync Audit** | ❌ | 0% | Phase 2 | qb_batches | — | H | M | Depende de #94 |
| 96 | **Owner Snapshot Dashboard** | 🔶 | Mock AppShell | Phase 1 | — | — | M | L | Queries reales |
| 97 | **Operations Inbox / Needs Attention** | ❌ | 0% | Phase 2 | — | — | H | M | Cross-tabla |
| 98 | **Undo / Restore** | ❌ | 0% | Phase 1 | — | — | M | M | Soft delete + time window |
| 99 | **Team Management (roles/invite)** | ❌ | 0% | Phase 1 | team_members, roles | — | H | M | |
| 100 | **Phone-first login (SMS OTP + PIN)** | ❌ | 0% | Phase 1 | — | Supabase Auth + Twilio | H | M | |
| 101 | **Access Preview ("Preview as Carlos")** | ❌ | 0% | Phase 2 | — | — | M | L | Sesión impersonada |
| 102 | **Temporary subcontractor access** | ❌ | 0% | Phase 2 | invites.expires_at | — | M | L | |
| 103 | **Crew Price Protection** | ❌ | 0% | Phase 1 | — | — | L | L | RLS: field workers no ven cost |
| 104 | **Owner Approval flow** | ❌ | 0% | Phase 2 | approvals | — | M | M | Threshold configurable |
| 105 | **In-app Support Chat** | ❌ | 0% | Phase 1 | — | Chatwoot free | M | L | Evaluar antes de construir custom |
| 106 | **Support context auto-attach** | ❌ | 0% | Phase 1 | support_sessions | — | M | L | Depende de #105 |
| 107 | **Feature Request Tracking (admin)** | ❌ | 0% | Phase 2 | feature_requests | — | L | L | Agrupación + conteo |
| 108 | **Founding Contractors Program** | ❌ | 0% | Phase 1 | businesses.is_founding | — | L | L | Flag + badge + pricing lock |
| 109 | **Bilingual UX (EN/ES)** | ✅ | Landing completa | MVP | — | next-intl | M | L | Extender a app interna |
| 110 | **Transparent Quotly Billing** | ❌ | 0% | Phase 1 | — | Stripe Billing Portal | M | L | Cancelación simple |
| 111 | **Simple Data Export** | ❌ | 0% | Phase 2 | — | — | M | L | CSV por entidad |
| 112 | **Payment Test Mode** | ❌ | 0% | Phase 1 | — | Stripe test mode | L | L | Toggle en Settings |
| 113 | **Deposit Accounting** | ❌ | 0% | Phase 1 | payments.type | — | M | M | Deposit vs final payment |
| 114 | **Poor Connection Protection** | ❌ | 0% | Phase 1 | — | — | H | M | Service Worker + IndexedDB (PWA) |
| 115 | **AI Routing (cheap→expensive)** | ❌ | 0% | Phase 1 | — | OpenAI | M | L | Router de modelos por tarea |
| 116 | **Responsive desktop layout** | 🔶 | Landing ok, app solo mobile | MVP | — | — | M | L | Sidebar nav; diseñar en paralelo con mobile |
| 117 | **Legal pages** | ❌ | 0% | MVP | — | — | L | L | /privacy /terms /refunds /ai-disclosure |
| 118 | **Forgot password** | ❌ | 0% | MVP | — | Supabase Auth | L | L | |
| 119 | **PWA — Web App Manifest** | ❌ | 0% | MVP | — | — | L | L | manifest.json + icons + theme-color |
| 120 | **PWA — Service Worker + offline** | ❌ | 0% | Phase 1 | — | — | H | M | Cache strategy + IndexedDB para drafts |
| 121 | **PWA — Standalone mode + icons** | ❌ | 0% | MVP | — | — | L | L | Maskable icon, splash, background-color |
| 122 | **PWA — Install prompt (contextual)** | ❌ | 0% | Phase 1 | — | — | M | L | Solo después de primera victoria (ver regla abajo) |
| 123 | **PWA — iOS Add to Home Screen instructions** | ❌ | 0% | Phase 1 | — | — | L | L | Safari no soporta BeforeInstallPrompt |
| 124 | **PWA — Install state detection** | ❌ | 0% | Phase 1 | — | — | L | L | `display-mode: standalone` media query |
| 125 | **PWA — Push Notifications (opt-in)** | ❌ | 0% | Phase 2 | — | — | H | M | Quote Rescue, reminders — solo opt-in |

---

## REGLA PWA — INSTALL PROMPT

**Nunca mostrar el install prompt en la landing ni inmediatamente después del signup.**

| Rol | Trigger para mostrar el prompt |
|---|---|
| Owner / Estimator | Onboarding → primera cotización creada y enviada |
| Field Worker | Invite SMS → verificación de teléfono → primer job asignado |

**Copy aprobado:**
> *Keep Quotly one tap away*
> Add Quotly to your Home Screen for faster access.

Botones: **Add to phone** · **Maybe later**

Si elige "Maybe later": no volver a mostrar por al menos 14 días. Nunca mostrar de forma repetitiva.

---

## TABLA 2 — DECISIONES DE ARQUITECTURA QUE DEBEN TOMARSE AHORA

| Decisión | Opciones | Recomendación | Urgencia | Consecuencia de esperar |
|---|---|---|---|---|
| **Plataforma** | Native vs Web | ✅ Web + PWA — decidido | — | — |
| **Schema del Price Book** | Tabla plana vs JSONB | Tabla relacional clara | ⚠️ Ahora | Difícil migrar con datos reales |
| **Core DB schema** | Empezar o esperar | Definir ahora aunque UI sea mock | ⚠️ Ahora | Onboarding guarda datos en aire |
| **`business_id` en cada fila** | Multi-tenant D1 vs añadir después | Multi-tenant desde el día 1 | ⚠️ Ahora | Migrar después rompe RLS completo |
| **RLS desde el primer insert** | Solo RLS vs RLS + BFF | RLS en Supabase + check en BFF | ⚠️ Ahora | Una fila sin política expone datos cross-tenant |
| **Roles y permisos** | 4 roles fijos vs granular | 4 roles fijos (Owner, Office, Estimator, Field) + custom overrides | ⚠️ Ahora | Team features bloqueadas sin schema |
| **Quote versioning** | Snapshot vs diff patches | Snapshot inmutable — más simple, menos riesgo de corrupción | ⚠️ Ahora | Version history imposible sin decisión |
| **PDF generation** | Client React PDF vs server Puppeteer vs externo | Server-side (Vercel Route Handler + Puppeteer) | Antes de PDF feature | Client PDF tiene límites de CSS |
| **Stripe Connect vs Checkout** | Connect (contractor = sub-account) vs Checkout (Quotly como merchant) | **Stripe Connect Express** — dinero va al contractor, no pasa por Quotly | Antes de pagos | Checkout = Quotly como money transmitter — riesgo legal |
| **SMS provider** | Twilio vs Vonage vs Resend | Twilio — mejor soporte US numbers | Antes de send-by-text | Resend no hace SMS |
| **AI routing** | GPT-4o para todo vs router | Router: mini → classify/templates, GPT-4o → quote gen, Vision → receipts | Antes de conectar IA | Sin router, costo ×10 innecesario |
| **Idioma de la DB** | Inglés vs español | Inglés — convención ya en inglés | ⚠️ Ahora | Inconsistencia rompe types generados |
| **estimate_events table** | Eventos vs flag en quotes | Tabla separada de eventos — permite timeline, analytics, debug | Antes de send/status | Sin ella no hay "Viewed", "Declined", timeline |
| **QuickBooks sync mode** | Auto-sync vs manual | ✅ **Manual Review → Owner Approval → Sync** — decidido. No auto-sync por defecto | — | Auto-sync causaría transacciones duplicadas, montos incorrectos, facturas incompletas |
| **Business logic desacoplada del browser** | Acoplada vs desacoplada | Desacoplada — toda business logic en BFF/API routes, nunca en componentes React | ⚠️ Ahora | Si se construye nativa después, el frontend nativo no puede reutilizar lógica del browser |

---

## TABLA 3 — FEATURES POR PROVEEDOR EXTERNO

| Feature(s) | Proveedor | Plan/costo estimado | Cuándo | Notas |
|---|---|---|---|---|
| Auth (email/password, Google, SMS OTP) | **Supabase Auth** | Free (50k MAU) | MVP | |
| DB, Storage, Realtime, RLS | **Supabase** | Free → $25/mo Pro | MVP | |
| PDF + Photo Storage | **Supabase Storage** | Incluido | Con PDF feature | |
| Online Payments (card, ACH) | **Stripe Connect Express** | 2.9% + 30¢ (van al contractor) | Phase 1 | KYC requerido por Stripe |
| Quotly subscription billing | **Stripe Billing** | ~0.5% of revenue | MVP | Portal del cliente gratis |
| Email (estimates, invoices, receipts) | **Resend** | Free 3k/mes → $20/mo | MVP | Dominio verificado requerido |
| SMS (estimate, team invite) | **Twilio** | ~$0.0079/SMS US | Phase 1 | Phone number requerido |
| AI quote generation | **OpenAI GPT-4o** | ~$0.01–0.03/quote | MVP | BFF siempre — nunca cliente |
| Receipt AI extraction | **OpenAI GPT-4o Vision** | ~$0.005/imagen | Phase 2 | |
| Voice transcription | **OpenAI Whisper** | $0.006/min | MVP | |
| QuickBooks sync | **QuickBooks API (Intuit)** | Free dev, fee producción | Phase 2 | OAuth2 + sandbox obligatorio |
| Support Chat | **Chatwoot** (free self-hosted o cloud) | $0 tier inicial | Phase 1 | Evaluar antes de construir custom |
| i18n EN/ES | **next-intl** | Free | MVP | Migrar desde lang-context actual |
| PWA manifest + Service Worker | Nativo (Next.js built-in) | Free | MVP (manifest) · Phase 1 (SW) | |

---

## TABLA 4 — ALTA VALOR / BAJA COMPLEJIDAD (quick wins)

| Feature | Por qué vale | Esfuerzo |
|---|---|---|
| Legal pages | Requeridas para Stripe + lanzamiento | 2h |
| Cash/Check payment recording | Mayoría cobra en efectivo; sin Stripe | 4h |
| PWA manifest + icons | Installable con 30 líneas; costo cero | 3h |
| Archive without delete | DRY — una función sirve para todas las tablas | 4h |
| Estimate Sanity Check | Previene errores embarazosos; solo client-side | 4h |
| Test PDF (send to myself) | El contractor lo pide el día 1 | 3h |
| Duplicate customer warning | Una query antes del INSERT | 2h |
| Customer contact preference | 2 campos en la tabla customers | 2h |
| One-click Resend | Reutiliza send flow | 3h |
| Payment Mismatch Warning | Validación client-side | 3h |
| Quote Rescue (unsent drafts) | Query en home screen | 5h |
| Founding Contractor badge | Una columna boolean + badge | 3h |
| Responsive desktop layout (sidebar nav) | Same code — CSS breakpoints | 6h |

---

## TABLA 5 — FEATURES DE ALTO RIESGO

| Feature | Riesgo | Por qué | Mitigación |
|---|---|---|---|
| **Stripe Connect** | H | KYC, fondos de clientes, chargebacks, compliance fiscal | Docs Connect Express completo; sandbox mínimo 4 semanas antes de prod |
| **AI generates estimate from Price Book** | H | Si la IA inventa precios destruye la confianza — Price Book es la fuente de verdad | Price Book required; output siempre revisable; nunca auto-send |
| **Draft Conflict Warning** | H | Race conditions con Supabase Realtime | Lock optimista (last write wins + warning) hasta que la base sea estable |
| **QuickBooks API** | H | OAuth2 refresh tokens expiran; API cambia; datos contables críticos | Manual sync + audit log = fallo no catastrófico; sandbox 100% antes de prod |
| **Multi-tenant RLS** | H | Un bug expone datos de otro negocio | Audit explícito de cada política + test cross-tenant antes de go-live |
| **Business logic en el browser** | H | Imposibilita reutilizar en nativa; viola seguridad | Toda lógica en BFF/API routes — decidido como regla de arquitectura |
| **Progress Invoices + parciales** | M-H | Contabilidad incorrecta → conflictos con QB | Construir solo después de flujo simple estable meses |
| **Voice note → additional work** | M | Falsos positivos molestan; falsos negativos = trabajo perdido | Siempre como sugerencia con confirmación manual |
| **Job Package (ZIP)** | M | Vercel: límite 4.5MB en Response | Generar y servir desde Supabase Storage, no Vercel |

---

## ORDEN EXACTO DE IMPLEMENTACIÓN

### MVP — "La app vende y funciona"
*Un contractor puede cotizar, enviar y cobrar (cash/check). IA y Stripe subscription reales.*

```
1.  Supabase schema + RLS base
    Tables: businesses, users, customers, quotes, line_items, price_book_items,
            invoices, payments, estimate_events
    → business_id en CADA tabla desde el inicio
    → estimate_events desde el inicio (sin esto no hay status "Viewed")
2.  Supabase Auth — email/password + Google OAuth
3.  next-intl configurado (antes de cualquier string en la app interna)
4.  Responsive layouts base — sidebar desktop + bottom-nav mobile (paralelo desde el inicio)
5.  PWA manifest + icons + theme-color (3h, nunca deshacer)
6.  Conectar onboarding al DB (Price Book real persistido)
7.  AI BFF route /api/generate-estimate — OpenAI GPT-4o + Whisper
8.  AI routing: GPT-4o-mini para tareas simples, GPT-4o para quote gen
9.  Edit estimate UI (tabla editable + recalc)
10. PDF generation server-side
11. Send estimate — Email (Resend) + Download PDF + SMS (Twilio)
12. Estimate status machine + secure link
13. Convert Estimate → Job → Invoice
14. Invoice send (reutiliza send flow)
15. Cash/Check payment recording
16. Owner Snapshot Dashboard (queries reales)
17. Legal pages + forgot password
18. Stripe subscription + billing portal (Quotly cobra al contractor)
```

### Phase 1 — "El negocio completo básico"
*Crew, firma, depósitos con tarjeta, soporte, desktop polido, PWA completa.*

```
19. Team Management (roles, invite por SMS OTP, phone-first login)
20. Role-specific home screens (Owner, Office, Estimator, Field)
21. Crew View + Job Assignment (mobile-first)
22. Job Photos (Supabase Storage)
23. Change Orders
24. Expenses + receipt upload
25. Version history / autosave
26. Duplicate & modify + multiple quotes per project
27. Estimate expiration
28. Optional Signature
29. Stripe Connect Express (pagos online, depósito)
30. Client-facing página de estimate (secure link)
31. Decline + reason · Request Changes (páginas cliente)
32. Price Book completo (labor, markup, tax, optional items)
33. Done-for-you setup (file upload + AI parse → Price Book draft)
34. Client view vs internal view (PDF dual render)
35. Outstanding dashboard (queries reales)
36. Document History chain UI
37. Job Close Checklist
38. In-app Support (Chatwoot)
39. Founding Contractor badge + pricing lock
40. Archive without delete (todos los modelos)
41. Undo/Restore (soft delete + time window)
42. PWA Service Worker + offline/poor connection (IndexedDB + local drafts)
43. PWA Install prompt contextual (post primera victoria)
44. iOS Add to Home Screen instructions
45. Payment Test Mode
46. Crew Price Protection (RLS field workers)
47. QuickBooks prep: schema qb_batches, qb_items (sin UI todavía)
```

### Phase 2 — "Retención, equipo y datos"
*La app se vuelve hábito. El contractor ve la salud de su negocio.*

```
48. Time & Labor (clock in/out, timesheets, approval) — mobile-first
49. Job Profitability + margin warning
50. QuickBooks Manual Sync — Manual Review → Owner Approval → Sync
51. QuickBooks Sync Audit (batches inmutables)
52. AI learns from history / "What should I charge?"
53. Follow-up Assistant (sugerido, no automático)
54. Payment Reminders
55. Good / Better / Best quotes
56. Optional Add-ons (client selects)
57. Smart Search + Command Bar
58. Operations Inbox / Needs Attention
59. Voice Notes → additional work detection
60. Receipt AI extraction
61. Client Activity Timeline
62. Job Completion Summary to client
63. Warranty / Service Notes
64. Repeat Job Templates
65. Feature Request Tracking (admin)
66. Data Export (CSV)
67. Owner Approval flow (threshold configurable)
68. Access Preview ("Preview as Carlos")
69. PWA Push Notifications opt-in (Quote Rescue, reminders)
```

### Later
```
70. Progress Invoices
71. Job Package (ZIP download)
72. Payroll Export (CSV → Gusto/ADP prep)
73. Bulk Actions
74. Temp Subcontractor Access
75. iOS/Android native app (reutiliza backend/APIs/auth/permisos/business logic)
```

---

## INCONSISTENCIAS CORREGIDAS EN ESTA VERSIÓN

| Inconsistencia | Corrección |
|---|---|
| Send by SMS (#11) marcado MVP en Feature Map pero ausente del orden MVP | Añadido como paso 11 en el orden MVP |
| Desktop UI marcado Phase 1 en Feature Map (#116) | Cambiado a MVP — debe construirse en paralelo desde el inicio, no después |
| Poor Connection Protection (#114) marcado Phase 2 | Movido a Phase 1 (PWA Service Worker) — dato de campo requiere protección básica |
| PWA features (#119–125) ausentes del Feature Map | Añadidos como #119–125 con fases correctas |
| Pricing no estaba documentado | Añadido al inicio del documento |
| Founding Contractors sin detalles | Documentado con beneficios, copy y restricciones |
| QuickBooks sync mode no explicitado | Documentado como Manual Review → Owner Approval → Sync, sin auto-sync |
| "Desktop first-class UI" como feature aislada | Reencuadrado como "Responsive desktop layout" con la decisión de plataforma como contexto |
| Business logic desacoplada no estaba en decisiones de arquitectura | Añadida como decisión ⚠️ Ahora — crítica para futura app nativa |
| next-intl no tenía posición en el orden de implementación | Añadido como paso 3 del MVP (antes de cualquier string en app interna) |

---

## NOTAS — QUÉ PREPARAR AHORA SIN CONSTRUIR AÚN

| Qué preparar | Por qué ahora | Cómo |
|---|---|---|
| Schema completo en papel | Más barato cambiar antes del primer `CREATE TABLE` | Revisar con este roadmap antes de primera migración |
| `business_id` en CADA tabla | Si se añade después, RLS completo falla | Incluir desde la primera migración |
| `status` como `text` + CHECK constraint | PG enums son caros de migrar | Cambiar a enum solo cuando el set sea estable |
| `estimate_events` desde el principio | Sin ella no hay "Viewed", timeline, analytics | Crear con el schema base |
| `AI_MODEL` como env var | No hardcodear jamás | `.env.local` + `constants.ts` |
| Stripe sandbox account | Aprobación de Connect tarda semanas | Crear cuenta Stripe + activar Connect en test mode ahora |
| Estructura `/app/api/` y `/lib/` | Evitar refactoring con 20+ routes | Definir antes del primer route |
| PWA manifest.json | 3h, nunca hay que deshacer, habilita install | Crear con el primer deploy real |
| Business logic en BFF exclusivamente | Requerido para futura app nativa | Regla de arquitectura desde el primer route |

---

## NOTA SOBRE CRITERIO VISUAL (para uso con revisor-visual)

El criterio de diseño de Quotronex es **clean professional SaaS + subtle brand personality**.

Los hard shadows brutalistas (device ownable de la Dirección B) se aplican **únicamente donde están definidos en la FICHA-ARTE**: CTA primario del paywall y CTA primario de la app. No son un objetivo generalizado del revisor. El revisor no debe bajar scores por ausencia del hard shadow en elementos secundarios que no lo requieren por diseño. Si el revisor detecta "ausencia de identidad" en un CTA que no es primario, la corrección es verificar si el elemento tiene el rol de CTA primario antes de aplicar el shadow.

---

*Documento vivo — actualizar cuando cambien fases, decisiones de arquitectura o proveedores.*
