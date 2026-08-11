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
}

export default function ProfileBillingCard({
  accessLevel,
  hasPaidAccess,
  isRegistrarActive,
  accessExpiresAt,
  hasCustomerProfile,
  cancelAtPeriodEnd,
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
    <div className="p-6 h-full flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
              Billing & Subscription
            </h3>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
              Plan status & invoice downloads
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
              cancelAtPeriodEnd
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                : hasPaidAccess
                ? "bg-teal-100 dark:bg-teal-955/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {cancelAtPeriodEnd ? "Canceled (Active)" : hasPaidAccess ? "Active Plan" : "Free Tier"}
          </span>
        </div>

        {/* Plan status card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            {hasPaidAccess ? (
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-sans text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {planTitle}
            </span>
          </div>

          {cancelAtPeriodEnd && formattedExpiry ? (
            <div className="mt-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
              <p className="font-sans text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong className="font-semibold block mb-1">Subscription Canceled</strong>
                Your plan is scheduled to end on <strong className="font-semibold">{formattedExpiry}</strong>. You will maintain full access until then, after which your account will revert to the Free tier.
              </p>
            </div>
          ) : formattedExpiry ? (
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 pl-6">
              {isRegistrarActive ? "Access valid until" : "Renews / Expires"}:{" "}
              <strong className="text-slate-700 dark:text-slate-300">{formattedExpiry}</strong>
            </p>
          ) : (
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 pl-6">
              {hasPaidAccess ? "Active subscription" : "15 questions & 5 note templates included."}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-955/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Stripe Customer Portal Action Buttons */}
      <div className="mt-2 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => handlePortalRedirect("invoice")}
          disabled={pendingAction !== null}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-slate-800 dark:text-slate-200 font-sans text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            {pendingAction === "invoice" ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            ) : (
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            )}
            Download Bills / Invoices
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>

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
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            {pendingAction === "cancel" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
            {cancelAtPeriodEnd ? "Reactivate Subscription" : "Manage / Cancel Subscription"}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <CancellationSurveyModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </div>
  );
}
