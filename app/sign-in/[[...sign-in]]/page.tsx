import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | The GP Edge",
  description: "Sign in to access your GP Edge dashboard, exam prep, and clinical tools.",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: "#0d9488",
              colorBackground: "#ffffff",
              colorForeground: "#0f172a",
              colorMutedForeground: "#64748b",
              colorInput: "#f8fafc",
              colorInputForeground: "#0f172a",
              colorDanger: "#dc2626",
              borderRadius: "0.875rem",
              fontFamily: "inherit",
              fontSize: "15px",
            },
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border border-slate-200 rounded-2xl w-full",
              headerTitle:
                "text-2xl font-extrabold text-slate-900 tracking-tight",
              headerSubtitle: "text-slate-500 text-[14px]",
              socialButtonsBlockButton:
                "border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-700 transition-colors",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400 text-[13px]",
              formFieldLabel:
                "text-[13px] font-semibold text-slate-700 mb-1",
              formFieldInput:
                "border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 placeholder:text-slate-400 text-[14px]",
              formButtonPrimary:
                "bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm shadow-teal-600/20 transition-all duration-200 hover:-translate-y-0.5",
              footerActionLink:
                "text-teal-600 hover:text-teal-700 font-semibold",
              identityPreviewText: "text-slate-700",
              identityPreviewEditButton: "text-teal-600 hover:text-teal-700",
              alertText: "text-[13px]",
              formResendCodeLink: "text-teal-600 hover:text-teal-700",
              otpCodeFieldInput:
                "border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
            },
          }}
        />
      </div>
    </main>
  );
}
