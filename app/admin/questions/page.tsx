"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
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
  image?: string;
}

const mockQuestions: Question[] = [
  { id: 2847, text: "A 54-year-old male presents with sudden chest pain. ECG shows ST elevation in leads II, III, and aVF. Which artery is most likely occluded?", options: ["Left anterior descending (LAD)", "Right coronary artery (RCA)", "Left circumflex (LCx)", "Posterior descending artery"], correctIndex: 1, rationale: "Inferior STEMI with ST elevation in II, III, aVF is most commonly caused by RCA occlusion.", topic: "Cardiology", difficulty: "Medium", examType: "AKT", status: "published", tags: ["STEMI", "ECG", "Coronary"], image: "/assets/ecg_inferior_stemi.png" },
  { id: 2848, text: "A 22-year-old female presents with acute asthma exacerbation. Her peak flow is 50% of predicted. What is the first-line medication?", options: ["Salbutamol (SABA) via spacer", "Oral prednisolone", "Inhaled fluticasone", "IV magnesium sulfate"], correctIndex: 0, rationale: "First-line treatment for acute asthma is inhaled SABA via spacer.", topic: "Respiratory", difficulty: "Easy", examType: "AKT", status: "published", tags: ["Asthma", "Emergency", "Pharmacology"] },
  { id: 2849, text: "A 35-year-old woman describes 3 weeks of depressed mood, insomnia, and anhedonia. Which screening tool is most appropriate?", options: ["GAD-7", "AUDIT", "PHQ-9", "K10"], correctIndex: 2, rationale: "PHQ-9 is the standard screening tool for depression severity.", topic: "Mental Health", difficulty: "Easy", examType: "KFP", status: "published", tags: ["Depression", "Screening", "PHQ-9"] },
  { id: 2850, text: "An elderly patient on warfarin presents with INR of 8.5 and minor gum bleeding. What is the most appropriate management?", options: ["Continue warfarin at same dose", "Withhold warfarin and give vitamin K 1-2mg orally", "Give fresh frozen plasma", "Administer prothrombinex"], correctIndex: 1, rationale: "For INR 5-9 with minor bleeding, withhold warfarin and give low-dose oral vitamin K.", topic: "Haematology", difficulty: "Hard", examType: "AKT", status: "review", tags: ["Warfarin", "INR", "Anticoagulation"] },
  { id: 2851, text: "A mother brings her 6-month-old infant for vaccination. Which vaccines are due at this age according to the Australian NIP?", options: ["DTPa, Hep B, IPV, Hib, PCV13, Rotavirus", "MMR, Varicella, MenACWY", "DTPa, IPV only", "No vaccines due at this age"], correctIndex: 0, rationale: "At 6 months, the third dose of DTPa-Hep B-IPV-Hib, PCV13 (3rd dose), and Rotavirus (3rd dose) are due.", topic: "Paediatrics", difficulty: "Medium", examType: "AKT", status: "published", tags: ["Vaccination", "NIP", "Paediatrics"] },
  { id: 2852, text: "A 45-year-old presents with a pigmented skin lesion. Which dermoscopic feature is most concerning for melanoma?", options: ["Symmetrical pattern", "Single uniform color", "Irregular blue-white veil", "Regular pigment network"], correctIndex: 2, rationale: "Blue-white veil is a high-risk dermoscopic feature associated with melanoma.", topic: "Dermatology", difficulty: "Hard", examType: "KFP", status: "draft", tags: ["Melanoma", "Dermoscopy", "Skin Cancer"], image: "/assets/melanoma_dermoscopy.png" },
  { id: 2853, text: "A GP registrar reviews MBS item 721. What is the minimum documentation required for a GPMP claim?", options: ["Patient name and date only", "Problem list, management goals, actions, review date", "Referral letter to specialist", "Hospital discharge summary"], correctIndex: 1, rationale: "A GPMP requires documented problem identification, treatment goals, actions/strategies, and agreed review arrangements.", topic: "MBS Billing", difficulty: "Medium", examType: "KFP", status: "review", tags: ["GPMP", "MBS", "Billing"] },
  { id: 2854, text: "What is the recommended first-line treatment for uncomplicated lower UTI in a non-pregnant woman?", options: ["Amoxicillin 500mg TDS for 7 days", "Trimethoprim 300mg daily for 3 days", "Ciprofloxacin 500mg BD for 5 days", "Nitrofurantoin 100mg QID for 14 days"], correctIndex: 1, rationale: "Trimethoprim 300mg daily for 3 days is first-line for uncomplicated UTI in Australia.", topic: "Infectious Disease", difficulty: "Easy", examType: "AKT", status: "published", tags: ["UTI", "Antibiotics", "Women's Health"] },
];

type StatusFilter = "all" | "draft" | "review" | "published";

const topicColors: Record<string, { bg: string; text: string; border: string }> = {
  Cardiology: { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-600 dark:text-red-400", border: "border-red-100 dark:border-red-900/30" },
  Respiratory: { bg: "bg-teal-50 dark:bg-teal-950/20", text: "text-teal-600 dark:text-teal-400", border: "border-teal-100 dark:border-teal-900/30" },
  "Mental Health": { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-600 dark:text-green-400", border: "border-green-100 dark:border-green-900/30" },
  Haematology: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/30" },
  Paediatrics: { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-100/30 dark:border-emerald-900/20" },
  Dermatology: { bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700/50" },
  "MBS Billing": { bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-900/30" },
  "Infectious Disease": { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-900/30" },
};
const defaultTopicColor = { bg: "bg-slate-50 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700/40" };

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A");
  const [newQuestionTopic, setNewQuestionTopic] = useState("Cardiology");
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newExamType, setNewExamType] = useState("AKT");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptionA, setNewOptionA] = useState("");
  const [newOptionB, setNewOptionB] = useState("");
  const [newOptionC, setNewOptionC] = useState("");
  const [newOptionD, setNewOptionD] = useState("");
  const [newRationale, setNewRationale] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newImage, setNewImage] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAddForm = () => {
    setNewQuestionText("");
    setNewOptionA("");
    setNewOptionB("");
    setNewOptionC("");
    setNewOptionD("");
    setNewRationale("");
    setNewTags("");
    setNewImage("");
    setNewCorrectAnswer("A");
    setNewQuestionTopic("Cardiology");
    setNewDifficulty("Medium");
    setNewExamType("AKT");
  };

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

  const handleCreateQuestion = () => {
    if (!newQuestionText.trim()) {
      alert("Please enter the question text.");
      return;
    }
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 2855;
    const correctIndex = newCorrectAnswer === "A" ? 0 : newCorrectAnswer === "B" ? 1 : newCorrectAnswer === "C" ? 2 : 3;
    const newQuestion: Question = {
      id: nextId,
      text: newQuestionText,
      options: [newOptionA || "Option A", newOptionB || "Option B", newOptionC || "Option C", newOptionD || "Option D"],
      correctIndex,
      rationale: newRationale || "No explanation provided.",
      topic: newQuestionTopic,
      difficulty: newDifficulty as "Easy" | "Medium" | "Hard",
      examType: newExamType as "AKT" | "KFP",
      status: "draft",
      tags: newTags ? newTags.split(",").map(t => t.trim()).filter(Boolean) : ["General"],
      image: newImage || undefined,
    };
    setQuestions((prev) => [newQuestion, ...prev]);
    setShowAddModal(false);
    resetAddForm();

    // Reset filters to ensure the user immediately sees their new question at the top of the list
    setSearchQuery("");
    setStatusFilter("all");
    setTopicFilter("all");
    setDifficultyFilter("all");

    addUserNotification(
      "New Question Added",
      `Admin added a new practice question to the ${newQuestionTopic} category.`,
      1,
      "new-questions"
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Question"
        highlightedText="Management"
        subtitle={`${questions.length} questions in bank`}
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
            <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950/20 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/40 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-all flex items-center gap-2">
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
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as StatusFilter)}
          options={[
            { value: "all", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "review", label: "Review" },
            { value: "published", label: "Published" },
          ]}
          className="w-48"
        />
        <CustomSelect
          value={topicFilter}
          onChange={setTopicFilter}
          options={[
            { value: "all", label: "All Topics" },
            ...topics.map((t) => ({ value: t, label: t })),
          ]}
          className="w-48"
        />
        <CustomSelect
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { value: "all", label: "All Difficulty" },
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
          ]}
          className="w-48"
        />
      </motion.div>

      {/* Questions table */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
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
                  onClick={() => setPreviewQuestion(q)}
                  className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400">#{q.id}</span>
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate font-semibold">{q.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {q.image && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Clinical Image
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Subtopics:</span>
                      {q.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {(() => {
                      const colors = topicColors[q.topic] || defaultTopicColor;
                      return (
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {q.topic}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" :
                      q.difficulty === "Medium" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{q.examType}</span></td>
                  <td className="px-4 py-4"><StatusBadge variant={q.status} /></td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[60] cursor-pointer"
              onClick={() => setPreviewQuestion(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-[10%] mx-auto max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-[70] shadow-2xl overflow-y-auto max-h-[80vh] text-slate-800 dark:text-slate-100"
            >
              <div className="p-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block shadow-[0_0_6px_rgba(20,184,166,0.4)]" />
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {previewQuestion.examType} Practice Case
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      previewQuestion.difficulty === "Easy"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : previewQuestion.difficulty === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    }`}>
                      {previewQuestion.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      #{previewQuestion.id}
                    </span>
                    <button
                      onClick={() => setPreviewQuestion(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <p className="text-slate-800 dark:text-slate-100 text-base font-medium leading-relaxed mb-6 font-sans">
                  {previewQuestion.text}
                </p>

                {/* Question Image (High Resolution Container) */}
                {previewQuestion.image && (
                  <div 
                    onClick={() => setZoomImage(previewQuestion.image!)}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5 mb-6 group cursor-zoom-in transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1 shadow-lg">
                      <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Click to zoom
                    </div>
                    <img 
                      src={previewQuestion.image} 
                      alt="Clinical diagnostic image" 
                      className="max-h-64 mx-auto rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.01]" 
                    />
                  </div>
                )}

                {/* Options list */}
                <div className="space-y-3 mb-6">
                  {previewQuestion.options.map((opt, i) => {
                    const isCorrect = i === previewQuestion.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-100 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                            isCorrect
                              ? "bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm font-semibold">{opt}</span>
                        {isCorrect && (
                          <svg className="w-5 h-5 text-emerald-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rationale */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 text-xs leading-relaxed text-emerald-950 dark:text-emerald-300">
                  <div className="font-bold mb-1.5 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[13px]">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correct Answer Rationale
                  </div>
                  <p className="font-normal leading-relaxed text-slate-600 dark:text-slate-400">{previewQuestion.rationale}</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl z-[70] shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-normal text-slate-900 dark:text-slate-100 tracking-tight leading-none">Add New Question</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Question Text</label>
                    <textarea rows={3} value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none dark:text-slate-100" placeholder="Enter the question..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Option A</label>
                    <input type="text" value={newOptionA} onChange={(e) => setNewOptionA(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-100" placeholder="Option A..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Option B</label>
                    <input type="text" value={newOptionB} onChange={(e) => setNewOptionB(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-100" placeholder="Option B..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Option C</label>
                    <input type="text" value={newOptionC} onChange={(e) => setNewOptionC(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-100" placeholder="Option C..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Option D</label>
                    <input type="text" value={newOptionD} onChange={(e) => setNewOptionD(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-100" placeholder="Option D..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Correct Answer</label>
                      <CustomSelect
                        value={newCorrectAnswer}
                        onChange={setNewCorrectAnswer}
                        options={[
                          { value: "A", label: "A" },
                          { value: "B", label: "B" },
                          { value: "C", label: "C" },
                          { value: "D", label: "D" },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Topic</label>
                      <CustomSelect
                        value={newQuestionTopic}
                        onChange={setNewQuestionTopic}
                        options={topics.map((t) => ({ value: t, label: t }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Difficulty</label>
                      <CustomSelect
                        value={newDifficulty}
                        onChange={setNewDifficulty}
                        options={[
                          { value: "Easy", label: "Easy" },
                          { value: "Medium", label: "Medium" },
                          { value: "Hard", label: "Hard" },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Exam Type</label>
                      <CustomSelect
                        value={newExamType}
                        onChange={setNewExamType}
                        options={[
                          { value: "AKT", label: "AKT" },
                          { value: "KFP", label: "KFP" },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Attach Image Section */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Attach Clinical Image</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: "None", value: "" },
                        { name: "STEMI ECG", value: "/assets/ecg_inferior_stemi.png" },
                        { name: "Melanoma Dermoscopy", value: "/assets/melanoma_dermoscopy.png" },
                      ].map((imgOpt) => (
                        <button
                          type="button"
                          key={imgOpt.name}
                          onClick={() => setNewImage(imgOpt.value)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                            newImage === imgOpt.value
                              ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:border-teal-500 dark:bg-teal-500/20 dark:text-teal-400"
                              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          {imgOpt.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                          newImage && !newImage.startsWith("/assets/")
                            ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:border-teal-500 dark:bg-teal-500/20 dark:text-teal-400"
                            : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {newImage && !newImage.startsWith("/assets/") ? "Uploaded ✓" : "Upload File"}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    {newImage && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 h-24 flex items-center justify-center shrink-0">
                        <img src={newImage} alt="Preview" className="h-20 object-contain rounded-lg" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewImage("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }} 
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-slate-950 transition-all shadow"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Rationale</label>
                    <textarea rows={3} value={newRationale} onChange={(e) => setNewRationale(e.target.value)} className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none dark:text-slate-100" placeholder="Explain the correct answer..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tags (comma separated)</label>
                    <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all dark:text-slate-100" placeholder="e.g. STEMI, ECG, Emergency" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                      onClick={handleCreateQuestion}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-sm shadow-teal-600/20"
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

      {/* High Resolution Lightbox Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out"
            onClick={() => setZoomImage(null)}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:scale-105 transition-all shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomImage}
                alt="High Resolution Clinical Image Detail"
                className="rounded-xl max-h-[75vh] w-auto object-contain shadow-2xl"
              />
              <div className="mt-3 text-xs text-slate-400 font-semibold tracking-wide flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                High Resolution Diagnostic View · Click outside to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
