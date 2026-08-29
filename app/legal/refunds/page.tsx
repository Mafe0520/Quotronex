export const metadata = { title: 'Refund Policy – Quotronex' }

export default function RefundsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-300">
      <h1 className="text-2xl font-bold text-white mb-2">Refund Policy</h1>
      <p className="text-gray-500 mb-10">Effective date: August 24, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-base font-semibold text-white mb-2">Free trial</h2>
          <p>All plans include a 7-day free trial. No credit card is required to start. You will not be charged until the trial ends.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">Monthly plans</h2>
          <p>Monthly subscriptions are billed in advance. Cancellations take effect at the end of the current billing period — you keep access until then. We do not offer partial-period refunds for monthly plans.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">Annual plans</h2>
          <p>Annual subscriptions may be refunded within 7 days of the charge if the service has not been substantially used. After 7 days, annual plans are non-refundable but you retain access for the full year.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">How to cancel or request a refund</h2>
          <p>To cancel your subscription, go to <strong className="text-white">Settings → Billing → Cancel plan</strong> inside the app. To request a refund (if eligible), email <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a> within the window above with the subject line &ldquo;Refund request&rdquo; and we will process it within 5 business days.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">Contact</h2>
          <p>Questions? <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a></p>
        </div>
      </section>
    </main>
  )
}
