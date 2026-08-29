export const metadata = { title: 'Terms of Service – Quotronex' }

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-300">
      <h1 className="text-2xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-10">Effective date: August 24, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-base font-semibold text-white mb-2">1. Who we are</h2>
          <p>Quotronex is a software-as-a-service platform operated by Maria Fernanda Pareja, an individual based in New Jersey, United States (&ldquo;Quotronex,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account or using the service you agree to these Terms.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">2. The service</h2>
          <p>Quotronex provides independent contractors with tools to create quotes, manage jobs and clients, track time, invoice customers, and coordinate crew. Features available to you depend on your subscription plan.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">3. Accounts</h2>
          <p>You must be at least 18 years old and provide accurate information when registering. You are responsible for all activity under your account. Notify us immediately at <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a> if you suspect unauthorized access.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">4. Subscriptions and billing</h2>
          <p>Quotronex offers monthly and annual subscription plans. All plans include a 7-day free trial — no credit card is required to start. After the trial, your chosen plan is billed automatically via Stripe. You can cancel at any time from your account settings; access continues until the end of the current billing period. We do not offer refunds for partial periods. Annual plans may be refunded within 7 days of purchase if the service has not been substantially used — contact us at <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a>.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">5. Acceptable use</h2>
          <p>You agree not to: (a) use the service for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the platform; (c) resell, sublicense, or redistribute the service; (d) upload content that infringes third-party rights or contains malware.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">6. Your data</h2>
          <p>You own the data you input into Quotronex. We store it on your behalf using Supabase (hosted on AWS) and do not sell it to third parties. See our <a href="/legal/privacy" className="text-green-400 underline">Privacy Policy</a> for full details.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">7. AI features</h2>
          <p>Some features use AI to assist with price suggestions and quote generation. AI output is provided as a convenience and may not always be accurate. You are responsible for reviewing and approving any AI-generated content before sending it to clients.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">8. Availability and changes</h2>
          <p>We aim for high availability but do not guarantee uninterrupted service. We may modify, suspend, or discontinue features with reasonable notice. We may update these Terms at any time — continued use after notice constitutes acceptance.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">9. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, Quotronex is not liable for indirect, incidental, or consequential damages arising from use of the service. Our total liability for any claim is limited to the amount you paid us in the 3 months preceding the claim.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">10. Governing law</h2>
          <p>These Terms are governed by the laws of the State of New Jersey, United States, without regard to conflict-of-law principles.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">11. Contact</h2>
          <p>Questions? Email us at <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a>.</p>
        </div>
      </section>
    </main>
  )
}
