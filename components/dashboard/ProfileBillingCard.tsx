"use client";

import { useState } from "react";
import { CreditCard, FileText, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { createBillingPortalSessionAction, getLatestInvoicePdfAction } from "@/actions/stripe.actions";
import CancellationSurveyModal from "./CancellationSurveyModal";

interface Props {
  accessLevel: string;
  hasPaidAccess: boolean;
  isRegistrarActive: boolean;
  accessExpiresAt: string | null;
  hasCustomerProfile: boolean;
  cancelAtPeriodEnd?: boolean;
  isRecurring?: boolean;
  showDownloadInvoice?: boolean;
  showCancelSubscription?: boolean;
  activePlanName?: string | null;
  compact?: boolean;
}

export default function ProfileBillingCard({
  accessLevel,
  hasPaidAccess,
  isRegistrarActive,
  accessExpiresAt,
  hasCustomerProfile,
  cancelAtPeriodEnd,
  isRecurring,
  showDownloadInvoice = true,
  showCancelSubscription = true,
  activePlanName = null,
  compact = false,
}: Props) {
  const [pendingAction, setPendingAction] = useState<"invoice" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  function handlePortalRedirect(actionType: "invoice" | "cancel") {
    setError(null);
    setPendingAction(actionType);

    const actionPromise = actionType === "invoice" 
      ? getLatestInvoicePdfAction() 
      : createBillingPortalSessionAction();

    actionPromise.then((res) => {
      if (res.url) {
        if (actionType === "invoice") {
          window.open(res.url, '_blank');
          setPendingAction(null);
        } else {
          window.location.href = res.url;
        }
      } else {
        setError(res.error || (actionType === "invoice" ? "Could not fetch invoice PDF." : "Could not launch Stripe billing portal."));
        setPendingAction(null);
      }
    }).catch(() => {
      setError("An unexpected error occurred.");
      setPendingAction(null);
    });
  }

  const planTitles: Record<string, string> = {
    REGISTRAR: "Registrar Package (Full Exam Prep)",
    FELLOWSHIP: "Fellowship Plan",
    POST_REGISTRAR_UPGRADE: "Loyalty Monthly Plan ($15/mo)",
    FREE: "Free Tier",
  };

  const planTitle = activePlanName || planTitles[accessLevel] || (hasPaidAccess ? "Active Paid Plan" : "Free Tier");
  const formattedExpiry = accessExpiresAt
    ? new Date(accessExpiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className={`p-5 sm:p-6 flex flex-col justify-between ${compact ? "gap-3.5" : "h-full gap-4"}`}>
      {/* Card Header */}
      <div>
        <h3 className="font-sans text-lg md:text-[22px] font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
          Billing &amp; Subscription
        </h3>
        <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
          Plan status &amp; invoice downloads
        </p>
      </div>

      {/* Content directly on card baseline */}
      <div className={`flex flex-col ${compact ? "gap-3" : "flex-1 justify-around py-1 gap-3"}`}>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="font-sans text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Current Plan
            </p>
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                cancelAtPeriodEnd
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60"
                  : hasPaidAccess
                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {cancelAtPeriodEnd ? "Canceled (Active)" : hasPaidAccess ? "Active Plan" : "Free Tier"}
            </span>
          </div>

          <h4 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
            {planTitle}
          </h4>
        </div>

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/85">
          <p className="font-sans text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">
            {isRecurring && !cancelAtPeriodEnd ? "Renewal Date" : "Expiration Date"}
          </p>
          <p className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formattedExpiry ? formattedExpiry : (hasPaidAccess ? "Active subscription" : "15 questions & 5 note templates included")}
          </p>
        </div>

        {cancelAtPeriodEnd && formattedExpiry && (
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
            <p className="font-sans text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong className="font-semibold block mb-0.5">Subscription Canceled</strong>
              Your plan is scheduled to end on <strong className="font-semibold">{formattedExpiry}</strong>. You will maintain full access until then.
            </p>
          </div>
        )}

        {/* Action Buttons if available */}
        {(showDownloadInvoice || (showCancelSubscription && isRecurring)) && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/85 flex flex-col sm:flex-row items-center justify-end gap-2.5 w-full">
            {showDownloadInvoice && (
              <button
                type="button"
                onClick={() => handlePortalRedirect("invoice")}
                disabled={pendingAction !== null}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 text-slate-800 dark:text-slate-200 font-sans text-xs font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {pendingAction === "invoice" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                )}
                Download Bills / Invoices
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}

            {showCancelSubscription && isRecurring && (
              <button
                type="button"
                onClick={() => {
                  if (!cancelAtPeriodEnd) {
                    setShowCancelModal(true);
                  } else {
                    handlePortalRedirect("cancel");
                  }
                }}
                disabled={pendingAction !== null}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-sans text-xs font-semibold shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {pendingAction === "cancel" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
                {cancelAtPeriodEnd ? "Reactivate Auto-Renewal" : "Cancel Auto-Renewal"}
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <CancellationSurveyModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        formattedExpiry={formattedExpiry}
      />
    </div>
  );
}
