import { quizFeatures, mockExamFeatures, resumeExam, presetExams, weakAreas } from "./data";

const CARD_BASE = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

function ArrowIcon() {
  return (
    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CardCorner() {
  return (
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 dark:from-teal-900/20 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
  );
}

function CardFooter({ label }: { label: string }) {
  return (
    <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
      <button className="text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
        {label}
        <ArrowIcon />
      </button>
    </div>
  );
}

function Dot({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <div className="w-1 h-1 rounded-full bg-teal-300" />
      {text}
    </span>
  );
}

export default function ActionCards() {
  return (
    <>
      {/* Row 1 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Start a New Quiz */}
        <div className={CARD_BASE}>
          <CardCorner />
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Start a New Quiz</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Choose your exam type, topics, question count, and difficulty level.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-5 mt-1">
            {quizFeatures.map((f) => <Dot key={f} text={f} />)}
          </div>
          <CardFooter label="Start Quiz" />
        </div>

        {/* Create Your Own Mock Exam */}
        <div className={CARD_BASE}>
          <CardCorner />
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Create Your Own Mock Exam</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Build a fully customized mock exam tailored to your study goals.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-5 mt-1">
            {mockExamFeatures.map((f) => <Dot key={f} text={f} />)}
          </div>
          <CardFooter label="Create Mock" />
        </div>

        {/* Resume Mock Exam */}
        <div className={CARD_BASE}>
          <CardCorner />
          <div className="mb-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Resume Mock Exam</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Continue exactly where you left off.</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-slate-800/50 border border-teal-100/30 dark:border-teal-900/30 rounded-xl px-4 py-3.5 mb-5 mt-1 shadow-sm">
            <div className="text-[13px] font-bold text-teal-800 dark:text-teal-200 mb-0.5">{resumeExam.title}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{resumeExam.questionsRemaining} Questions Remaining</div>
            <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-teal-500 rounded-full" style={{ width: `${resumeExam.percentComplete}%` }} />
            </div>
            <div className="text-[10px] font-medium text-right text-teal-600 dark:text-teal-400 mt-1.5 uppercase tracking-wider">{resumeExam.percentComplete}% Complete</div>
          </div>
          <CardFooter label="Resume Exam" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Preset Mock Exams */}
        <div className={CARD_BASE}>
          <CardCorner />
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Preset Mock Exams</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Jump straight into professionally curated mock exams.</p>
          </div>
          <ul className="space-y-2 mb-5 mt-1">
            {presetExams.map((item) => (
              <li key={item} className="text-[13px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <CardFooter label="Start Mock" />
        </div>

        {/* Drill Weak Areas */}
        <div className={CARD_BASE}>
          <CardCorner />
          <div className="mb-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] leading-snug mb-1.5 group-hover:text-teal-600 transition-colors">Drill Weak Areas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">AI identifies your weakest topics and generates focused practice.</p>
          </div>
          <div className="mb-5 mt-1">
            <p className="text-[10px] text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest font-bold mb-2.5">Blind Spots Identified</p>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map((chip) => (
                <span key={chip} className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-[11px] font-bold text-teal-700 dark:text-teal-300 shadow-sm border border-teal-100 dark:border-teal-800/50">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <CardFooter label="Practice Weak Areas" />
        </div>
      </div>
    </>
  );
}
