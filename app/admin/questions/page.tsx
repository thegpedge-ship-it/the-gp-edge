"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import PageBanner from "@/components/shared/PageBanner";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  rationale: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  examType: "AKT" | "KFP";
  status: "draft" | "review" | "published";
  tags: string[];
}

const mockQuestions: Question[] = [
  { id: 2847, text: "A 54-year-old male presents with sudden chest pain. ECG shows ST elevation in leads II, III, and aVF. Which artery is most likely occluded?", options: ["Left anterior descending (LAD)", "Right coronary artery (RCA)", "Left circumflex (LCx)", "Posterior descending artery"], correctIndex: 1, rationale: "Inferior STEMI with ST elevation in II, III, aVF is most commonly caused by RCA occlusion.", topic: "Cardiology", difficulty: "Medium", examType: "AKT", status: "published", tags: ["STEMI", "ECG", "Coronary"] },
  { id: 2848, text: "A 22-year-old female presents with acute asthma exacerbation. Her peak flow is 50% of predicted. What is the first-line medication?", options: ["Salbutamol (SABA) via spacer", "Oral prednisolone", "Inhaled fluticasone", "IV magnesium sulfate"], correctIndex: 0, rationale: "First-line treatment for acute asthma is inhaled SABA via spacer.", topic: "Respiratory", difficulty: "Easy", examType: "AKT", status: "published", tags: ["Asthma", "Emergency", "Pharmacology"] },
  { id: 2849, text: "A 35-year-old woman describes 3 weeks of depressed mood, insomnia, and anhedonia. Which screening tool is most appropriate?", options: ["GAD-7", "AUDIT", "PHQ-9", "K10"], correctIndex: 2, rationale: "PHQ-9 is the standard screening tool for depression severity.", topic: "Mental Health", difficulty: "Easy", examType: "KFP", status: "published", tags: ["Depression", "Screening", "PHQ-9"] },
  { id: 2850, text: "An elderly patient on warfarin presents with INR of 8.5 and minor gum bleeding. What is the most appropriate management?", options: ["Continue warfarin at same dose", "Withhold warfarin and give vitamin K 1-2mg orally", "Give fresh frozen plasma", "Administer prothrombinex"], correctIndex: 1, rationale: "For INR 5-9 with minor bleeding, withhold warfarin and give low-dose oral vitamin K.", topic: "Haematology", difficulty: "Hard", examType: "AKT", status: "review", tags: ["Warfarin", "INR", "Anticoagulation"] },
  { id: 2851, text: "A mother brings her 6-month-old infant for vaccination. Which vaccines are due at this age according to the Australian NIP?", options: ["DTPa, Hep B, IPV, Hib, PCV13, Rotavirus", "MMR, Varicella, MenACWY", "DTPa, IPV only", "No vaccines due at this age"], correctIndex: 0, rationale: "At 6 months, the third dose of DTPa-Hep B-IPV-Hib, PCV13 (3rd dose), and Rotavirus (3rd dose) are due.", topic: "Paediatrics", difficulty: "Medium", examType: "AKT", status: "published", tags: ["Vaccination", "NIP", "Paediatrics"] },
  { id: 2852, text: "A 45-year-old presents with a pigmented skin lesion. Which dermoscopic feature is most concerning for melanoma?", options: ["Symmetrical pattern", "Single uniform color", "Irregular blue-white veil", "Regular pigment network"], correctIndex: 2, rationale: "Blue-white veil is a high-risk dermoscopic feature associated with melanoma.", topic: "Dermatology", difficulty: "Hard", examType: "KFP", status: "draft", tags: ["Melanoma", "Dermoscopy", "Skin Cancer"] },
  { id: 2853, text: "A GP registrar reviews MBS item 721. What is the minimum documentation required for a GPMP claim?", options: ["Patient name and date only", "Problem list, management goals, actions, review date", "Referral letter to specialist", "Hospital discharge summary"], correctIndex: 1, rationale: "A GPMP requires documented problem identification, treatment goals, actions/strategies, and agreed review arrangements.", topic: "MBS Billing", difficulty: "Medium", examType: "KFP", status: "review", tags: ["GPMP", "MBS", "Billing"] },
  { id: 2854, text: "What is the recommended first-line treatment for uncomplicated lower UTI in a non-pregnant woman?", options: ["Amoxicillin 500mg TDS for 7 days", "Trimethoprim 300mg daily for 3 days", "Ciprofloxacin 500mg BD for 5 days", "Nitrofurantoin 100mg QID for 14 days"], correctIndex: 1, rationale: "Trimethoprim 300mg daily for 3 days is first-line for uncomplicated UTI in Australia.", topic: "Infectious Disease", difficulty: "Easy", examType: "AKT", status: "published", tags: ["UTI", "Antibiotics", "Women's Health"] },
];

type StatusFilter = "all" | "draft" | "review" | "published";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const topics = Array.from(new Set(questions.map((q) => q.topic)));

  const filtered = questions.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.id.toString().includes(searchQuery);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    const matchTopic = topicFilter === "all" || q.topic === topicFilter;
    const matchDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchSearch && matchStatus && matchTopic && matchDifficulty;
  });

  const updateStatus = (id: number, newStatus: Question["status"]) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
  };

  const deleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <PageBanner
        title="Question"
        highlightedText="Management"
        subtitle={`${questions.length} questions in bank`}
        illustrationPath="/assets/admin_questions_illustration.png"
        pillText="Questions"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const count = 100;
                addUserNotification(
                  `${count} New Questions Added`,
                  `Admin has successfully added a batch of ${count} new practice questions to the Cardiology & Mental Health categories.`,
                  count,
                  "new-questions"
                );
                alert(`${count} new questions successfully published to user dashboard notifications!`);
              }}
              className="px-4 py-2.5 bg-emerald-600 text-sm font-semibold text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Simulate Question Set (+100 Qs)
            </button>
            <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950/20 text-sm font-medium text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800/40 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              CSV Upload
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-teal-600 text-sm font-semibold text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Question
            </button>
          </div>
        }
        variants={itemVariants}
      />

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
        </select>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
          <option value="all">All Topics</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
          <option value="all">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </motion.div>

      {/* Questions table */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none animate-pulse-slow" />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Question</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Topic</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Difficulty</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Exam</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400">#{q.id}</span>
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className="text-sm text-slate-700 truncate">{q.text}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {q.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="text-sm text-slate-600">{q.topic}</span></td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" :
                      q.difficulty === "Medium" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{q.examType}</span></td>
                  <td className="px-4 py-4"><StatusBadge variant={q.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={() => setPreviewQuestion(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Preview">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {q.status === "draft" && (
                        <button onClick={() => updateStatus(q.id, "review")} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Send to Review">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                      {q.status === "review" && (
                        <button onClick={() => updateStatus(q.id, "published")} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Publish">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {previewQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50"
              onClick={() => setPreviewQuestion(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-[12%] mx-auto max-w-2xl bg-[#090d16] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] border border-slate-800 rounded-3xl z-50 shadow-2xl overflow-hidden text-white relative"
            >
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block shadow-[0_0_6px_rgba(20,184,166,0.8)]" />
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      {previewQuestion.examType} Practice Case
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      previewQuestion.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : previewQuestion.difficulty === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {previewQuestion.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      #{previewQuestion.id}
                    </span>
                    <button
                      onClick={() => setPreviewQuestion(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <p className="text-slate-100 text-base font-normal leading-relaxed mb-6 font-sans">
                  {previewQuestion.text}
                </p>

                {/* Options list */}
                <div className="space-y-3 mb-6">
                  {previewQuestion.options.map((opt, i) => {
                    const isCorrect = i === previewQuestion.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                          isCorrect
                            ? "border-emerald-500/80 bg-emerald-500/10 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "border-slate-800/80 bg-slate-900/40 text-slate-400 opacity-60"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                            isCorrect
                              ? "bg-emerald-500 border-emerald-400 text-white"
                              : "bg-slate-950 border-slate-900 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm font-medium">{opt}</span>
                        {isCorrect && (
                          <svg className="w-5 h-5 text-emerald-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rationale */}
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 text-xs leading-relaxed text-emerald-300">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correct Answer Rationale
                  </div>
                  <p className="font-light leading-relaxed">{previewQuestion.rationale}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 backdrop-blur-2xl border border-white rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-slate-900 tracking-tight leading-none">Add New Question</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question Text</label>
                    <textarea rows={3} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none" placeholder="Enter the question..." />
                  </div>
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Option {opt}</label>
                      <input type="text" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" placeholder={`Option ${opt}...`} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Correct Answer</label>
                      <select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600"><option>A</option><option>B</option><option>C</option><option>D</option></select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Topic</label>
                      <select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600">
                        {topics.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Difficulty</label>
                      <select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600"><option>Easy</option><option>Medium</option><option>Hard</option></select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exam Type</label>
                      <select className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-600"><option>AKT</option><option>KFP</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rationale</label>
                    <textarea rows={3} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none" placeholder="Explain the correct answer..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tags (comma separated)</label>
                    <input type="text" className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" placeholder="e.g. STEMI, ECG, Emergency" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        addUserNotification(
                          "New Question Added",
                          "Admin added a new practice question to the general bank.",
                          1,
                          "new-questions"
                        );
                        alert("New question successfully saved and published to user dashboard!");
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all shadow-sm shadow-teal-500/20"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
