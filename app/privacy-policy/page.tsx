import Link from "next/link";
import { ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | The GP Edge",
  description:
    "Privacy Policy for The GP Edge. Learn how we collect, handle, and protect your personal and performance data in compliance with the Australian Privacy Principles (APPs).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-screen bg-transparent select-text pb-16">
      {/* Header Spacer / Top Anchor */}
      <div className="pt-14 md:pt-16 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Top Back Link */}
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-emerald-200/80 dark:border-[rgba(90,200,176,0.3)] bg-emerald-50/90 dark:bg-[#151922] text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs uppercase tracking-[0.12em] mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Legal &amp; Privacy Compliance
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Privacy Policy
          </h1>
        </div>

        {/* Main Content Container */}
        <main className="w-full max-w-4xl mx-auto bg-white dark:bg-[#151922] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 md:p-12 shadow-sm font-sans leading-relaxed text-slate-700 dark:text-slate-300 space-y-10">
          
          {/* Section 1: Who we are */}
          <section id="section-1" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              1.  Who we are
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                GP Edge is operated by The GP Edge (ABN [ABN &mdash; NOT YET OBTAINED]), registered in Queensland, Australia. In this policy, &ldquo;GP Edge&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to that entity.
              </p>
              <p>
                GP Edge is a platform for Australian general practitioners and registrars. It provides examination preparation for the Australian General Practitioner Fellowship examinations, and Billing Assist, a search tool for finding Medicare Benefits Schedule item numbers relevant to a described service. GP Edge is not affiliated with, endorsed by, or accredited by the Royal College of General Practitioners (RACGP) or Australian College of Rural Remote Medicine (ACRRM).
              </p>
              <p>
                We are committed to protecting your privacy and we comply with the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth). A copy of the APPs is available from the Office of the Australian Information Commissioner at{" "}
                <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  oaic.gov.au
                </a>.
              </p>
              <p>
                This policy applies to the GP Edge website, the GP Edge application, and any related services we provide.
              </p>
            </div>
          </section>

          {/* Section 2: What personal information we collect */}
          <section id="section-2" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              2.  What personal information we collect
            </h2>
            <div className="space-y-6 text-sm sm:text-base">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Account information</h3>
                <p className="mb-2">Your account is created and managed through Clerk, our authentication provider. Clerk holds:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                  <li>Your name</li>
                  <li>Your email address</li>
                  <li>Your password &mdash; stored and managed entirely by Clerk. GP Edge never receives, stores or has access to your password.</li>
                  <li>Authentication events, such as sign-ins and verification codes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Payment and subscription information</h3>
                <p>
                  We use Stripe to process payments. We do not collect or store your card number, expiry date or security code &mdash; these go directly to Stripe. Our database holds your subscription tier, status, billing period, and renewal or cancellation dates.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Performance and usage data</h3>
                <p className="mb-2">Generated as you use the question bank:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                  <li>Which questions you have attempted and the answers you selected</li>
                  <li>Whether your answers were correct</li>
                  <li>Test attempts, quiz configurations, and subject mastery scores</li>
                  <li>Badges, notifications and progress records</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Billing Assist</h3>
                <p>
                  When you search in Billing Assist, your search text is sent to Google&rsquo;s Gemini API so that matching MBS item numbers can be returned. This text is not stored by us &mdash; see section 8. Items you save to your favourites are stored against your account.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Cancellation feedback</h3>
                <p>
                  If you cancel a subscription, we ask why. Your selected reason, and any free-text comments you add, are stored against your account.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Support and correspondence</h3>
                <p>
                  Anything you send us &mdash; support enquiries, error reports about specific questions, feedback &mdash; along with our replies.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Technical information</h3>
                <p className="mb-3">
                  Standard web server and network data handled by Cloudflare in the course of delivering the site, including IP address and request metadata.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  We do not run analytics. GP Edge has no Google Analytics, no Plausible, no Vercel Analytics, no error-tracking service, and no third-party chat or support widget. We do not build a behavioural profile of you.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Sensitive information */}
          <section id="section-3" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              3.  Sensitive information
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                &ldquo;Sensitive information&rdquo; has the meaning given in the Privacy Act, and includes health information, racial or ethnic origin, and membership of a professional body.
              </p>
              <p>
                We do not seek to collect health information about you. GP Edge is an education product, not a health service. We are not your treating practitioner and we do not create or hold clinical records about you.
              </p>
              <p>
                The clinical scenarios in our question bank describe fictional patients. They are constructed for teaching purposes and contain no real patient information. Please do not include real patient information in any feedback, error report or correspondence you send us. If you do, we will delete it.
              </p>
              <p>
                If we ever need to collect sensitive information, we will do so only with your consent, or where required or authorised by law.
              </p>
            </div>
          </section>

          {/* Section 4: How we collect your information */}
          <section id="section-4" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              4.  How we collect your information
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>We collect information:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
                <li>Directly from you, when you create an account, subscribe, use the platform, or contact us</li>
                <li>Automatically, as you use the platform</li>
                <li>From Clerk, in relation to your identity and authentication</li>
                <li>From Stripe, in relation to your subscription &mdash; including automated webhook updates when your subscription status changes</li>
              </ul>
              <p>Wherever it is reasonable and practicable, we collect personal information only from you.</p>
            </div>
          </section>

          {/* Section 5: Anonymity and pseudonymity */}
          <section id="section-5" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              5.  Anonymity and pseudonymity
            </h2>
            <p className="text-sm sm:text-base">
              You cannot use GP Edge anonymously, because we need a persistent account to store your progress and manage your subscription.
            </p>
          </section>

          {/* Section 6: Why we use your information */}
          <section id="section-6" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              6.  Why we use your information
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>We use your personal information to:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
                <li>Create and administer your account, and authenticate you</li>
                <li>Provide the question bank and track your progress</li>
                <li>Process payments, manage your subscription, and issue receipts</li>
                <li>Respond to your support enquiries and error reports</li>
                <li>Improve the accuracy and quality of our questions</li>
                <li>Maintain security and prevent misuse &mdash; including detecting account sharing, which our Terms of Service prohibit</li>
                <li>Understand why subscribers leave, using cancellation feedback</li>
                <li>Send you service messages about your account, billing or material changes to the service</li>
                <li>Send you marketing about GP Edge, where you have not opted out (see section 10)</li>
                <li>Meet our legal obligations</li>
              </ul>
              <p className="font-semibold text-slate-900 dark:text-slate-100">We do not sell your personal information.</p>
            </div>
          </section>

          {/* Section 7: Your performance data */}
          <section id="section-7" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              7.  Your performance data
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                This section sets out commitments that go beyond what the Privacy Act requires, because we think exam performance deserves particular protection.
              </p>
              <p>
                We will never disclose an individual learner&rsquo;s performance data to a third party. Specifically, we will not disclose it to:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                <li>Your employer or practice</li>
                <li>A regional training organisation, training provider, or supervisor</li>
                <li>The RACGP or any other college or regulator</li>
                <li>Any organisation that purchases a group or institutional subscription</li>
              </ul>
              <p>
                This applies even where a third party pays for your subscription. An organisation that buys seats receives billing and seat-usage information only &mdash; who has an active account, and whether it is being used. It receives no scores, no topic breakdowns, and no individual results.
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                The only exceptions are where you expressly and specifically direct us to share your results, or where we are compelled by law.
              </p>
            </div>
          </section>

          {/* Section 8: Who we share your information with */}
          <section id="section-8" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              8.  Who we share your information with
            </h2>
            <div className="space-y-6 text-sm sm:text-base">
              <p>
                We disclose personal information to the service providers who operate GP Edge. Each is bound to use it only for the purposes we specify.
              </p>

              {/* Provider Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/4">Provider</th>
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/3">Purpose</th>
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data involved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Clerk</td>
                      <td className="py-3.5 px-4 sm:px-6">Authentication and identity</td>
                      <td className="py-3.5 px-4 sm:px-6">Name, email address, password, sign-in events</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Neon</td>
                      <td className="py-3.5 px-4 sm:px-6">Database hosting</td>
                      <td className="py-3.5 px-4 sm:px-6">Account records, subscription data, performance data</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Stripe</td>
                      <td className="py-3.5 px-4 sm:px-6">Subscription payments</td>
                      <td className="py-3.5 px-4 sm:px-6">Name, email, payment details, transaction history</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Cloudflare</td>
                      <td className="py-3.5 px-4 sm:px-6">Content delivery and network security</td>
                      <td className="py-3.5 px-4 sm:px-6">IP address, request metadata</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <p>
                  We use Google Gemini to power the search in Billing Assist. When you search, your search text is sent to Google&rsquo;s embedding API so that matching MBS item numbers can be returned. We use Google&rsquo;s paid API tier, under terms that exclude customer content from being used to train Google&rsquo;s models.
                </p>
                <p>
                  Your Billing Assist searches are not stored by us. They are processed and discarded &mdash; not written to our database, and not written to our application logs.
                </p>
                <p>
                  Google does retain them briefly for its own safety purposes. Under Google&rsquo;s terms for paid API use, prompts and responses are logged for up to 55 days solely to detect misuse of the service and to meet legal obligations, and are not used to train Google&rsquo;s models. After that period they are deleted.
                </p>
                <p>
                  If you save an MBS item to your favourites, that saved item is stored against your account.
                </p>
                <p className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-medium">
                  Please do not enter patient-identifying details into Billing Assist. Describe the consultation without names, dates of birth, addresses or anything else that could identify the patient.
                </p>
              </div>

              <div>
                <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">We may also disclose personal information:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                  <li>Where you consent</li>
                  <li>Where required or authorised by law, including to a court, tribunal or regulator</li>
                  <li>To our professional advisers, under obligations of confidentiality</li>
                  <li>To a purchaser or successor entity, if GP Edge is sold or transferred &mdash; in which case we will notify you and the purchaser will be bound by this policy or one at least as protective</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 9: Where your information is stored */}
          <section id="section-9" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              9.  Where your information is stored
            </h2>
            <div className="space-y-6 text-sm sm:text-base">
              <p>
                Your account records, subscription data and performance data are stored in Australia, in Neon&rsquo;s Sydney region.
              </p>
              <p>
                Several of the providers we rely on are overseas companies, and the following information is handled outside Australia:
              </p>

              {/* Storage Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/3">Information</th>
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/4">Provider</th>
                      <th className="py-3 px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Where it is handled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">Account, subscription and performance records</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Neon</td>
                      <td className="py-3.5 px-4 sm:px-6">Sydney, Australia</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">Name, email address, password, authentication events</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Clerk</td>
                      <td className="py-3.5 px-4 sm:px-6">United States (Northern Virginia)</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">Payment and transaction data</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Stripe</td>
                      <td className="py-3.5 px-4 sm:px-6">United States, and other jurisdictions where Stripe&rsquo;s affiliates and sub-processors operate</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">IP address and request metadata</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Cloudflare</td>
                      <td className="py-3.5 px-4 sm:px-6">Globally, including the United States. Requests are served from Asia-Pacific edge locations, but traffic logs are processed across Cloudflare&rsquo;s global network</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">Billing Assist search text (retained by Google for up to 55 days; not stored by us)</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100">Google Gemini</td>
                      <td className="py-3.5 px-4 sm:px-6">Globally, including the United States</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Before disclosing personal information overseas, we take reasonable steps to ensure the recipient does not breach the APPs, including by relying on the data processing terms each provider offers. Overseas recipients may be subject to the laws of their own jurisdiction, and we cannot guarantee the same enforcement rights would be available to you there.
              </p>
            </div>
          </section>

          {/* Section 10: Direct marketing */}
          <section id="section-10" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              10.  Direct marketing
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                We may send you information about GP Edge &mdash; new content, features, exam-relevant updates and offers.
              </p>
              <p>
                Every marketing message includes an unsubscribe link, and you can opt out at any time by using that link or emailing{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>. We comply with the Spam Act 2003 (Cth).
              </p>
              <p>
                Opting out of marketing does not stop service messages about your account, your billing, or material changes to the platform. You cannot opt out of those while you hold an account.
              </p>
              <p>
                We do not use or disclose your personal information for the direct marketing purposes of any other organisation.
              </p>
            </div>
          </section>

          {/* Section 11: Cookies and tracking */}
          <section id="section-11" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              11.  Cookies and tracking
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>We use cookies only where they are necessary to run the platform:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                <li>Authentication cookies, set by Clerk, to keep you signed in</li>
                <li>Security and performance cookies, set by Cloudflare, to protect the site and route traffic</li>
              </ul>
              <p>
                We set no analytics cookies, no advertising cookies, and no cross-site tracking of any kind. We do not use tracking pixels, and we do not share data with advertising networks.
              </p>
              <p>
                You can configure your browser to refuse cookies, but you will not be able to sign in without the authentication cookies.
              </p>
            </div>
          </section>

          {/* Section 12: Security */}
          <section id="section-12" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              12.  Security
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                We take reasonable steps to protect your personal information from misuse, interference and loss, and from unauthorised access, modification or disclosure. These include:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
                <li>Passwords are never stored by GP Edge. Authentication is handled by Clerk, a specialist provider.</li>
                <li>Encryption in transit, enforced on all database connections and web traffic.</li>
                <li>Encryption at rest, provided by Neon and Clerk.</li>
                <li>Restricted production access, held through environment credentials and the Neon console, which supports multi-factor authentication.</li>
                <li>Administrative audit logging of actions taken by administrators.</li>
                <li>Identity verification before account deletion, so a compromised session cannot destroy your data.</li>
              </ul>
              <p>
                No method of transmission or storage is completely secure, and we cannot guarantee absolute security. Keep your password confidential and do not share your account &mdash; account sharing is prohibited under our Terms of Service and materially increases the risk to your data.
              </p>
            </div>
          </section>

          {/* Section 13: Data breaches */}
          <section id="section-13" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              13.  Data breaches
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>We comply with the Notifiable Data Breaches scheme under Part IIIC of the Privacy Act.</p>
              <p>
                If we become aware of a data breach involving your personal information that is likely to result in serious harm to you, we will notify you and the Office of the Australian Information Commissioner as soon as practicable, and tell you what happened, what information was involved, and what steps you should take in response.
              </p>
              <p>
                If you believe your account has been compromised, contact us immediately at{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>.
              </p>
            </div>
          </section>

          {/* Section 14: How long we keep your information */}
          <section id="section-14" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              14.  How long we keep your information
            </h2>
            <div className="space-y-6 text-sm sm:text-base">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">While you hold an account</h3>
                <p className="mb-2">We retain your account and performance data for as long as your account exists.</p>
                <p>
                  Ending a subscription does not delete your data. When a subscription is cancelled or expires, your account reverts to the free tier and your records &mdash; including your performance history &mdash; are retained. This means your progress is still there if you resubscribe.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">When you delete your account</h3>
                <p className="mb-2">You can delete your account at any time from your account settings. Deletion is:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                  <li><strong>Immediate.</strong> There is no grace period once you confirm.</li>
                  <li><strong>Verified.</strong> Clerk will ask you to confirm your identity first.</li>
                  <li><strong>Complete.</strong> Every record linked to your account is removed &mdash; payments, subscriptions, test attempts, quiz configurations, badges, notifications and cancellation feedback.</li>
                  <li><strong>Permanent.</strong> Records are physically deleted, not hidden or flagged. Nothing is retained. Your name and email address are removed from our database and your Clerk identity is deleted.</li>
                  <li><strong>Irreversible.</strong> Neither you nor we can recover your account or your history afterwards.</li>
                </ul>
                <p className="mt-2 text-slate-600 dark:text-slate-400">There is no refund of any unused subscription period on deletion.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Backups</h3>
                <p>
                  Our database provider keeps a short recovery history, so that data can be restored if something goes wrong. Deleted records may remain recoverable within that window for up to 7 days before they age out permanently.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Records held by our payment provider</h3>
                <p>
                  Stripe retains transaction records independently of our systems, in order to meet its own legal and taxation obligations. Deleting your GP Edge account does not delete Stripe&rsquo;s records of payments you have made.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">Data export</h3>
                <p>
                  We do not currently offer a self-service data export. If you would like a copy of your data before deleting your account, email{" "}
                  <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                    admin@thegpedge.com.au
                  </a>{" "}
                  and we will provide it (see section 15).
                </p>
              </div>
            </div>
          </section>

          {/* Section 15: Accessing and correcting your information */}
          <section id="section-15" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              15.  Accessing and correcting your information
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                You may request access to the personal information we hold about you, and ask us to correct it if it is inaccurate, out of date, incomplete, irrelevant or misleading. Email{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>.
              </p>
              <p>There is no charge for making a request, or for us providing access.</p>
              <p>We will respond within 30 days.</p>
              <p>We may ask you to verify your identity before releasing information.</p>
              <p>
                In limited circumstances we may refuse access or correction &mdash; for example where doing so would unreasonably affect another person&rsquo;s privacy. If we refuse, we will tell you why in writing and explain how to complain.
              </p>
              <p>You can update most of your account details yourself in your account settings.</p>
            </div>
          </section>

          {/* Section 16: Complaints */}
          <section id="section-16" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              16.  Complaints
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                If you have a concern about how we have handled your personal information, contact us first at{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>. We will acknowledge your complaint within 14 business days and aim to resolve it within 30 days.
              </p>
              <p>If you are not satisfied with our response, you may complain to the Office of the Australian Information Commissioner:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
                <li>
                  Online:{" "}
                  <a href="https://www.oaic.gov.au/privacy/privacy-complaints" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700 inline-flex items-center gap-1">
                    oaic.gov.au/privacy/privacy-complaints <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li>Phone: 1300 363 992</li>
                <li>Post: GPO Box 5288, Sydney NSW 2001</li>
              </ul>
            </div>
          </section>

          {/* Section 17: Changes to this policy */}
          <section id="section-17" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              17.  Changes to this policy
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                We may update this policy from time to time. The current version is always available at{" "}
                <a href="https://thegpedge.com.au/privacy" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  https://thegpedge.com.au/privacy
                </a>{" "}
                with its effective date at the top.
              </p>
              <p>
                If we make a change that materially affects how we handle your personal information, we will notify you by email or through the platform before it takes effect.
              </p>
            </div>
          </section>

          {/* Section 18: Contact us */}
          <section id="section-18" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              18.  Contact us
            </h2>
            <div className="space-y-2 text-sm sm:text-base">
              <p>
                Privacy enquiries:{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>
              </p>
              <p>
                General support:{" "}
                <a href="mailto:admin@thegpedge.com.au" className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700">
                  admin@thegpedge.com.au
                </a>
              </p>
            </div>
          </section>

        </main>

        {/* Bottom Back Link (Far Right Margin Aligned) */}
        <div className="w-full flex justify-end mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors group"
          >
            Back to Home
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
