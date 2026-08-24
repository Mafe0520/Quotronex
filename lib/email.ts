import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Quotronex <hello@quotronex.com>'

function quoteEmailHtml({
  businessName,
  clientName,
  quoteNumber,
  totalFormatted,
  quoteUrl,
}: {
  businessName: string
  clientName: string
  quoteNumber: string
  totalFormatted: string
  quoteUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotización de ${businessName}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#f3f4f6;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr><td style="background:#111827;padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="width:20px;height:20px;background:#34d399;border-radius:4px;"></div>
                  <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:.5px;">${businessName}</span>
                </div>
                <p style="margin:16px 0 0;color:#ffffff;font-size:22px;font-weight:900;">Nueva cotización</p>
                <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">#${quoteNumber}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hola <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            ${businessName} te ha enviado una cotización por un total de
            <strong style="color:#111827;">${totalFormatted}</strong>.
            Revísala y acéptala digitalmente cuando estés listo.
          </p>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${quoteUrl}"
                 style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Ver cotización →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Si el botón no funciona, copia este enlace en tu navegador:<br>
            <a href="${quoteUrl}" style="color:#059669;word-break:break-all;">${quoteUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 36px;text-align:center;">
          <p style="margin:0;color:#d1d5db;font-size:11px;">Generado con Quotronex · quotronex.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function invoiceEmailHtml({
  businessName,
  clientName,
  invoiceNumber,
  totalFormatted,
  invoiceUrl,
  dueDate,
}: {
  businessName: string
  clientName: string
  invoiceNumber: string
  totalFormatted: string
  invoiceUrl: string
  dueDate?: string | null
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura de ${businessName}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#f3f4f6;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr><td style="background:#111827;padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="width:20px;height:20px;background:#60a5fa;border-radius:4px;"></div>
                  <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:.5px;">${businessName}</span>
                </div>
                <p style="margin:16px 0 0;color:#ffffff;font-size:22px;font-weight:900;">Factura pendiente</p>
                <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">#${invoiceNumber}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hola <strong>${clientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            ${businessName} te ha enviado una factura por
            <strong style="color:#111827;">${totalFormatted}</strong>${dueDate ? ` con vencimiento el <strong style="color:#111827;">${dueDate}</strong>` : ''}.
          </p>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${invoiceUrl}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Ver factura →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Si el botón no funciona, copia este enlace en tu navegador:<br>
            <a href="${invoiceUrl}" style="color:#2563eb;word-break:break-all;">${invoiceUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 36px;text-align:center;">
          <p style="margin:0;color:#d1d5db;font-size:11px;">Generado con Quotronex · quotronex.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendQuoteEmail({
  to,
  businessName,
  clientName,
  quoteId,
  totalCents,
}: {
  to: string
  businessName: string
  clientName: string
  quoteId: string
  totalCents: number
}) {
  const quoteNumber = quoteId.slice(0, 8).toUpperCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quotronex.com'
  const quoteUrl = `${origin}/q/${quoteId}`
  const totalFormatted = `$${(totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Cotización #${quoteNumber} de ${businessName} — ${totalFormatted}`,
    html: quoteEmailHtml({ businessName, clientName, quoteNumber, totalFormatted, quoteUrl }),
  })
}

export async function sendTeamInviteEmail({
  to, name, businessName, role, inviteUrl,
}: {
  to: string; name: string; businessName: string; role: string; inviteUrl: string
}) {
  const roleLabel: Record<string, string> = {
    admin: 'Admin', office_manager: 'Office Manager',
    estimator: 'Estimador', field_worker: 'Técnico / Field Worker',
  }
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Te invitaron a unirte a ${businessName} en Quotronex`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f9fafb;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
<div style="background:#111827;padding:28px 32px">
<p style="color:#fff;font-size:18px;font-weight:800;margin:0">${businessName}</p>
<p style="color:#6b7280;font-size:13px;margin:4px 0 0">te invita a Quotronex</p>
</div>
<div style="padding:28px 32px">
<p style="color:#111827;font-size:15px">Hola${name ? ` ${name}` : ''},</p>
<p style="color:#374151;font-size:14px">Has sido invitado a unirte a <strong>${businessName}</strong> como <strong>${roleLabel[role] ?? role}</strong> en Quotronex.</p>
<a href="${inviteUrl}" style="display:inline-block;margin:16px 0;background:#059669;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">Aceptar invitación</a>
<p style="color:#9ca3af;font-size:12px">Este enlace expira en 7 días. Si no esperabas esta invitación, ignora este correo.</p>
</div></div></body></html>`,
  })
}

export async function sendInvoiceEmail({
  to,
  businessName,
  clientName,
  invoiceId,
  totalCents,
  dueDate,
}: {
  to: string
  businessName: string
  clientName: string
  invoiceId: string
  totalCents: number
  dueDate?: string | null
}) {
  const invoiceNumber = invoiceId.slice(0, 8).toUpperCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quotronex.com'
  const invoiceUrl = `${origin}/i/${invoiceId}`
  const totalFormatted = `$${(totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Factura #${invoiceNumber} de ${businessName} — ${totalFormatted}`,
    html: invoiceEmailHtml({ businessName, clientName, invoiceNumber, totalFormatted, invoiceUrl, dueDate: dueDateFormatted }),
  })
}

export async function sendPaymentReceiptEmail({
  to,
  ownerName,
  planName,
  amountFormatted,
  periodEnd,
}: {
  to: string
  ownerName: string
  planName: string
  amountFormatted: string
  periodEnd: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Recibo de pago — ${amountFormatted} · Quotronex`,
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recibo de pago</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#f3f4f6;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
        <tr><td style="background:#111827;padding:32px 36px;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;background:#34d399;border-radius:4px;"></div>
            <span style="color:#ffffff;font-size:15px;font-weight:700;">Quotronex</span>
          </div>
          <p style="margin:16px 0 0;color:#ffffff;font-size:22px;font-weight:900;">Pago recibido ✓</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hola <strong>${ownerName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            Tu pago de <strong style="color:#111827;">${amountFormatted}</strong> para el plan <strong style="color:#111827;">${planName}</strong>
            fue procesado correctamente. Tu próxima factura vence el <strong style="color:#111827;">${periodEnd}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://quotronex.com'}/app/settings"
                 style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Ir a mi cuenta →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Gracias por ser parte de Quotronex.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 36px;text-align:center;">
          <p style="margin:0;color:#d1d5db;font-size:11px;">Quotronex · quotronex.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
