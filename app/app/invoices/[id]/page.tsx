import { notFound } from 'next/navigation'
import { getInvoice } from '@/app/actions/invoices'
import { InvoiceDetail } from '@/components/app/invoices/InvoiceDetail'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()
  return <InvoiceDetail invoice={invoice} />
}
