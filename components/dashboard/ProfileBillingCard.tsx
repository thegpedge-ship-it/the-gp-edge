"use client";

import { useState, useTransition } from "react";
import { CreditCard, FileText, ExternalLink, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
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

  const planTitle = planTitles[accessLevel] || (hasPaidAccess ? "Active Paid Plan" : "Free Tier");
  const formattedExpiry = accessExpiresAt
    ? new Date(accessExpiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-3.5">
      {/* Card Header */}
      <div>
        <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Billing & Subscription
        </h3>
        <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Plan status & invoice downloads
        </p>
      </div>

      {/* Plan details and action buttons container */}
      <div className="p-3.5 sm:px-4 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
        {/* Left: Plan title, badge, and renewal/expiry info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <div className="flex items-center gap-2">
              {hasPaidAccess ? (
                <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <h4 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {planTitle}
              </h4>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                cancelAtPeriodEnd
                  ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60"
                  : hasPaidAccess
                  ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {cancelAtPeriodEnd ? "Canceled (Active)" : hasPaidAccess ? "Active Plan" : "Free Tier"}
            </span>
          </div>

          {cancelAtPeriodEnd && formattedExpiry ? (
            <div className="mt-2 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <p className="font-sans text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong className="font-semibold block mb-0.5">Subscription Canceled</strong>
                Your plan is scheduled to end on <strong className="font-semibold">{formattedExpiry}</strong>. You will maintain full access until then, after which your account will revert to the Free tier.
              </p>
            </div>
          ) : formattedExpiry ? (
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 pl-6">
              {isRecurring && !cancelAtPeriodEnd ? "Renews on" : "Expires on"}:{" "}
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formattedExpiry}</strong>
            </p>
          ) : (
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 pl-6">
              {hasPaidAccess ? "Active subscription" : "15 questions & 5 note templates included."}
            </p>
          )}
        </div>

        {/* Right: Action Buttons */}
        {(showDownloadInvoice || (showCancelSubscription && isRecurring)) && (
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
            {showDownloadInvoice && (
              <button
                type="button"
                onClick={() => handlePortalRedirect("invoice")}
                disabled={pendingAction !== null}
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 text-slate-800 dark:text-slate-200 font-sans text-xs font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-sans text-xs font-semibold shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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
