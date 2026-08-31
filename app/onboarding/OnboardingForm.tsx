"use client";

import { useState, useTransition } from "react";
import {
  GraduationCap,
  Target,
  FileCheck,
  Globe,
  MapPin,
  Users,
  Megaphone,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { completeOnboarding } from "./actions";

export type OnboardingDefaults = {
  postgraduate_year: number | null;
  exam_target_code: string;
  terms_accepted_at: string | null;
  primary_medical_degree: string;
  exam_history: string[];
  fellowship_status: string;
  country: string;
  state_territory: string;
  referral_source: string;
  referral_source_other: string;
};

const PGY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: i === 9 ? "PGY10+" : `PGY${i + 1}`,
}));

const EXAM_TARGET_OPTIONS = [
  { value: "AKT", label: "AKT" },
  { value: "KFP", label: "KFP" },
  { value: "BOTH", label: "Both" },
  { value: "NONE", label: "Not currently sitting — using GP Edge for reference and CPD" },
];

const MEDICAL_DEGREE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "OVERSEAS", label: "Overseas" },
];

const EXAM_HISTORY_OPTIONS = [
  { value: "FIRST_ATTEMPT", label: "No, this will be my first attempt" },
  { value: "PASSED_AKT", label: "Yes, and I passed the AKT" },
  { value: "PASSED_KFP", label: "Yes, and I passed the KFP" },
  { value: "FAILED_AKT", label: "Yes, but I did not pass the AKT" },
  { value: "FAILED_KFP", label: "Yes, but I did not pass the KFP" },
];

const FELLOWSHIP_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "NO", label: "No — I am preparing for the Fellowship exams" },
  { value: "FRACGP", label: "Yes — FRACGP" },
  { value: "FACRRM", label: "Yes — FACRRM" },
];

const AU_STATES = [
  { value: "", label: "Select…" },
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "WA", label: "WA" },
  { value: "TAS", label: "TAS" },
  { value: "NT", label: "NT" },
  { value: "ACT", label: "ACT" },
];

const REFERRAL_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "COLLEAGUE", label: "A colleague or friend" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook group" },
  { value: "GOOGLE", label: "Google search" },
  { value: "TRAINING_ORG", label: "My training organisation or supervisor" },
  { value: "CONFERENCE", label: "A conference or event" },
  { value: "OTHER", label: "Other" },
];

const COUNTRIES = [
  "Australia", "New Zealand", "Afghanistan", "Albania", "Algeria", "Argentina",
  "Austria", "Bangladesh", "Belgium", "Brazil", "Cambodia", "Canada", "Chile",
  "China", "Colombia", "Croatia", "Czech Republic", "Denmark", "Egypt",
  "Ethiopia", "Fiji", "Finland", "France", "Germany", "Ghana", "Greece",
  "Hong Kong", "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kenya", "Kuwait",
  "Lebanon", "Libya", "Malaysia", "Maldives", "Mexico", "Morocco", "Myanmar",
  "Nepal", "Netherlands", "Nigeria", "Norway", "Oman", "Pakistan", "Papua New Guinea",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Samoa", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Thailand", "Tonga", "Turkey", "UAE", "Uganda", "Ukraine",
  "United Kingdom", "United States", "Vietnam", "Zimbabwe", "Other",
];

function SelectField({
  id,
  label,
  required,
  icon,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {icon}
        </span>
        <select
          id={id}
          name={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                     text-sm text-slate-800 appearance-none cursor-pointer font-medium
                     focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                     hover:border-slate-300 transition-all duration-150"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={14} />
        </span>
      </div>
    </div>
  );
}

export default function OnboardingForm({
  firstName,
  defaults,
}: {
  firstName: string | null;
  defaults: OnboardingDefaults;
}) {
  const [step, setStep] = useState(defaults.terms_accepted_at ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Step 1 state
  const [pgy, setPgy] = useState(defaults.postgraduate_year ? String(defaults.postgraduate_year) : "");
  const [examTarget, setExamTarget] = useState(defaults.exam_target_code || "");
  const [termsAccepted, setTermsAccepted] = useState(!!defaults.terms_accepted_at);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Step 2 state
  const [medDegree, setMedDegree] = useState(defaults.primary_medical_degree || "");
  const [examHistory, setExamHistory] = useState<string[]>(defaults.exam_history || []);
  const [fellowship, setFellowship] = useState(defaults.fellowship_status || "");
  const [country, setCountry] = useState(defaults.country || "Australia");
  const [stateTerritory, setStateTerritory] = useState(defaults.state_territory || "");
  const [referral, setReferral] = useState(defaults.referral_source || "");
  const [referralOther, setReferralOther] = useState(defaults.referral_source_other || "");

  function handleExamHistoryToggle(value: string) {
    if (value === "FIRST_ATTEMPT") {
      setExamHistory((prev) =>
        prev.includes("FIRST_ATTEMPT") ? [] : ["FIRST_ATTEMPT"]
      );
    } else {
      setExamHistory((prev) => {
        const without = prev.filter((v) => v !== "FIRST_ATTEMPT" && v !== value);
        return prev.includes(value) ? without : [...without, value];
      });
    }
  }

  function validateStep1(): boolean {
    if (!pgy) {
      setError("Please select your postgraduate year.");
      return false;
    }
    if (!examTarget) {
      setError("Please select your exam target.");
      return false;
    }
    if (!termsAccepted) {
      setError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return false;
    }
    return true;
  }

  function handleContinueToStep2() {
    setError(null);
    if (validateStep1()) setStep(2);
  }

  function handleSubmit(skip: boolean) {
    setError(null);
    const formData = new FormData();

    // Step 1 (always present)
    formData.set("postgraduate_year", pgy);
    formData.set("exam_target_code", examTarget);
    formData.set("terms_accepted", "true");
    formData.set("marketing_consent", marketingConsent ? "true" : "false");

    // Step 2 (only if not skipping)
    if (!skip) {
      formData.set("primary_medical_degree", medDegree);
      formData.set("exam_history", JSON.stringify(examHistory));
      formData.set("fellowship_status", fellowship);
      formData.set("country", country);
      formData.set("state_territory", country === "Australia" ? stateTerritory : "");
      formData.set("referral_source", referral);
      formData.set("referral_source_other", referral === "OTHER" ? referralOther : "");
    }

    startTransition(async () => {
      const res = await completeOnboarding(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-slate-100">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {firstName ? `Welcome, ${firstName}!` : "Welcome to The GP Edge!"}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {step === 1
              ? "A few essential details to get you started."
              : "Optional — help us personalise your experience. You can skip and complete later in Settings."}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step === 1 ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-700"
            }`}>
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step === 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-400"
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 mb-4">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <SelectField
                id="postgraduate_year"
                label="What is your postgraduate year?"
                required
                icon={<GraduationCap size={14} />}
                value={pgy}
                onChange={setPgy}
                options={[{ value: "", label: "Select…" }, ...PGY_OPTIONS]}
              />

              <SelectField
                id="exam_target_code"
                label="Which exam are you preparing for?"
                required
                icon={<Target size={14} />}
                value={examTarget}
                onChange={setExamTarget}
                options={[{ value: "", label: "Select…" }, ...EXAM_TARGET_OPTIONS]}
              />

              {/* Terms acceptance — inline, not modal */}
              <div className="mt-2 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-800 mb-2.5">
                    By creating an account you acknowledge that:
                  </p>
                  <ul className="space-y-1.5 text-[13px] text-slate-600 list-disc pl-5">
                    <li>Your account is personal to you and must not be shared</li>
                    <li>Our content is protected by copyright — you may not copy, download, screenshot, distribute, or reproduce any part of it, or use it to train an AI system.</li>
                    <li>Our content is educational and is not clinical or billing advice.</li>
                    <li>You will not submit content from an actual examination you have sat.</li>
                    <li>GP Edge is not affiliated with or endorsed by the RACGP</li>
                  </ul>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-snug">
                    I have read and agree to the{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline underline-offset-2 font-semibold">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline underline-offset-2 font-semibold">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40 cursor-pointer"
                  />
                  <span className="text-sm text-slate-500 leading-snug">
                    Send me updates about new content and features{" "}
                    <span className="text-slate-400">(optional)</span>
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
                             bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl
                             shadow-sm shadow-teal-600/20 transition-all duration-200
                             hover:-translate-y-0.5"
                >
                  Continue
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <SelectField
                id="primary_medical_degree"
                label="Where did you complete your primary medical degree?"
                icon={<FileCheck size={14} />}
                value={medDegree}
                onChange={setMedDegree}
                options={MEDICAL_DEGREE_OPTIONS}
              />

              {/* Exam history — multi-select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Have you sat the RACGP written exams before?
                </label>
                <div className="space-y-1.5">
                  {EXAM_HISTORY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                        examHistory.includes(opt.value)
                          ? "border-teal-500 bg-teal-50 text-teal-800"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={examHistory.includes(opt.value)}
                        onChange={() => handleExamHistoryToggle(opt.value)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40 cursor-pointer"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <SelectField
                id="fellowship_status"
                label="Have you obtained Fellowship?"
                icon={<GraduationCap size={14} />}
                value={fellowship}
                onChange={setFellowship}
                options={FELLOWSHIP_OPTIONS}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="country"
                    className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1"
                  >
                    Country
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Globe size={14} />
                    </span>
                    <select
                      id="country"
                      name="country"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        if (e.target.value !== "Australia") setStateTerritory("");
                      }}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                                 text-sm text-slate-800 appearance-none cursor-pointer font-medium
                                 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                                 hover:border-slate-300 transition-all duration-150"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </span>
                  </div>
                </div>

                {country === "Australia" && (
                  <SelectField
                    id="state_territory"
                    label="State or Territory"
                    icon={<MapPin size={14} />}
                    value={stateTerritory}
                    onChange={setStateTerritory}
                    options={AU_STATES}
                  />
                )}
              </div>

              {/* Referral source */}
              <SelectField
                id="referral_source"
                label="How did you hear about us?"
                icon={<Megaphone size={14} />}
                value={referral}
                onChange={setReferral}
                options={REFERRAL_OPTIONS}
              />
              {referral === "OTHER" && (
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Users size={14} />
                    </span>
                    <input
                      id="referral_source_other"
                      name="referral_source_other"
                      type="text"
                      value={referralOther}
                      onChange={(e) => setReferralOther(e.target.value)}
                      placeholder="Please tell us how you found GP Edge"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                                 text-sm text-slate-800 placeholder-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                                 hover:border-slate-300 transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setError(null); setStep(1); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                             text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700
                             border border-slate-200 rounded-xl hover:border-slate-300
                             transition-all duration-150 disabled:opacity-60"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleSubmit(false)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5
                             bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed
                             text-white text-sm font-bold rounded-xl shadow-sm shadow-teal-600/20
                             transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0"
                >
                  {pending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Complete"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
