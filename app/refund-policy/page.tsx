import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

export const metadata = {
  title: "Refund Policy | The GP Edge",
  description:
    "Refund Policy for The GP Edge. Understand our terms regarding change of mind, subscription cancellations, billing error refunds, and consumer rights under Australian Consumer Law.",
};

export default function RefundPolicyPage() {
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
            Billing &amp; Refund Policy
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Refund Policy
          </h1>

          <div className="mt-4 flex flex-wrap justify-center items-center gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>Version 1.0</span>
            <span></span>
            <span>Effective date: 4/10/2026</span>
          </div>
        </div>

        {/* Main Content Container */}
        <main className="w-full max-w-4xl mx-auto bg-white dark:bg-[#151922] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 md:p-12 shadow-sm font-sans leading-relaxed text-slate-700 dark:text-slate-300 space-y-10">

          {/* Applicability Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            This policy applies to all paid subscriptions to <strong>The GP Edge</strong> (ABN 66701866757).
          </div>

          {/* Section 1: Change of mind */}
          <section id="section-1" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              1. Change of mind
            </h2>
            <p className="text-sm sm:text-base">
              We do not provide refunds for change of mind. A free tier is available so you can try the platform before you pay.
            </p>
          </section>

          {/* Section 2: Cancelling */}
          <section id="section-2" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              2. Cancelling
            </h2>
            <p className="text-sm sm:text-base">
              You can cancel at any time from your account settings. Cancellation stops future charges. Your paid access continues until the end of the period already paid for, and no part of that period is refunded.
            </p>
          </section>

          {/* Section 3: When we refund */}
          <section id="section-3" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              3. When we refund
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Billing errors</h3>
                <p>
                  A duplicate charge, an incorrect amount, or a charge taken after a valid cancellation is refunded in full.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Faults with the service</h3>
                <p>
                  A fault is a problem that significantly affects the platform’s ability to deliver what it is described as providing, such as being unable to access the question bank you have paid for. Tell us and we will fix it within a reasonable time. If we cannot, you may cancel and receive a refund for the unused part of your subscription.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Minor problems</h3>
                <p>
                  Brief interruptions, display issues and errors in individual questions are corrected when reported. They are not grounds for a refund.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Withdrawal of the service</h3>
                <p>
                  If we stop providing a subscription you have paid for, we refund the unused part.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: When we do not refund */}
          <section id="section-4" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              4. When we do not refund
            </h2>
            <ul className="list-disc list-inside space-y-2.5 pl-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
              <li>You did not pass an examination. We do not guarantee examination results.</li>
              <li>You withdrew from or deferred an examination, or the examination date or format changed.</li>
              <li>You did not use the subscription, or forgot to cancel before a renewal.</li>
              <li>You deleted your account during a paid period.</li>
              <li>We closed your account because of a breach of the Terms of Service, such as account sharing.</li>
            </ul>
          </section>

          {/* Section 5: How to request a refund */}
          <section id="section-5" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              5. How to request a refund
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                Email{" "}
                <a
                  href="mailto:admin@thegpedge.com.au"
                  className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2 hover:text-teal-700 inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  admin@thegpedge.com.au
                </a>{" "}
                from the address on your account, with the payment date, the amount and the reason. Approved refunds are returned to the original payment method where possible.
              </p>
            </div>
          </section>

          {/* Section 6: Your legal rights */}
          <section id="section-6" className="scroll-mt-28">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              6. Your legal rights
            </h2>
            <p className="text-sm sm:text-base">
              Nothing in this policy excludes or limits any right you have under the Australian Consumer Law.
            </p>
          </section>

          {/* Legal Review Disclaimer Notice */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs italic text-slate-400 dark:text-slate-500 text-center">
            Draft prepared for legal review. Not to be published in this form.
          </div>

        </main>

        {/* Bottom Back Link */}
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
