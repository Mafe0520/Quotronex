export const metadata = { title: 'Privacy Policy – Quotronex' }

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-300">
      <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-10">Effective date: August 24, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-base font-semibold text-white mb-2">1. Who controls your data</h2>
          <p>Quotronex is operated by Quotronex LLC, New Jersey, United States. Contact: <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a>.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">2. Data we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong className="text-gray-200">Account data:</strong> name, email address, business name.</li>
            <li><strong className="text-gray-200">Business data:</strong> quotes, jobs, clients, invoices, price book items, time entries, and team members you create inside the app.</li>
            <li><strong className="text-gray-200">Payment data:</strong> subscription status and plan. Full card details are processed by Stripe — we never store card numbers.</li>
            <li><strong className="text-gray-200">Usage data:</strong> pages visited, feature interactions, and error logs collected to improve the service.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">3. How we use your data</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>To provide, maintain, and improve the Quotronex service.</li>
            <li>To process payments and manage your subscription.</li>
            <li>To send transactional emails (account confirmation, billing receipts, password reset).</li>
            <li>To respond to support requests.</li>
            <li>To detect and prevent fraud or abuse.</li>
          </ul>
          <p className="mt-3">We do not sell your data to third parties.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">4. Subprocessors</h2>
          <p className="mb-3">We share data with the following service providers only to the extent necessary to operate the platform:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong className="text-gray-200">Supabase</strong> (AWS us-east-1) — database and authentication.</li>
            <li><strong className="text-gray-200">Vercel</strong> (AWS / edge network) — hosting and deployment.</li>
            <li><strong className="text-gray-200">Stripe</strong> (United States) — payment processing.</li>
            <li><strong className="text-gray-200">Anthropic / OpenAI</strong> (United States) — AI-assisted features (price suggestions, quote generation). Prompts may include business data you submit; they are not used to train models under our agreements.</li>
          </ul>
          <p className="mt-3">All subprocessors are located in or transfer data to the United States.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">5. Data retention</h2>
          <p>We retain your data for as long as your account is active. When you delete your account, your personal data is deleted within 30 days, except where we are required by law to retain it longer.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">6. Your rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a>. You can also delete your account directly from Settings → Account → Delete account.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">7. Cookies</h2>
          <p>We use only essential cookies required for authentication (session tokens managed by Supabase). We do not use advertising or tracking cookies.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">8. Children</h2>
          <p>Quotronex is not intended for users under 18. We do not knowingly collect data from minors.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">9. Changes to this policy</h2>
          <p>We may update this policy and will notify you by email or in-app notice at least 14 days before material changes take effect.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">10. Contact</h2>
          <p>Privacy questions: <a href="mailto:hello@quotronex.com" className="text-green-400 underline">hello@quotronex.com</a>.</p>
        </div>
      </section>
    </main>
  )
}
