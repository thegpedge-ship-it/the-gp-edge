"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subjects, testTypes } from "./data";
import type { Subject, SubTopic } from "./data";

/* ─── Subject Icon Map ────────────────────────────────────────────────── */
function SubjectIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || "w-5 h-5";
  switch (name) {
    case "heart":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case "wind":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>;
    case "utensils":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>;
    case "flame":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case "brain":
    case "brain-circuit":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7zM9 22h6" /></svg>;
    case "bone":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.31 5.69a3.5 3.5 0 0 0-4.95 0L5.69 13.36a3.5 3.5 0 1 0 4.95 4.95l7.67-7.67a3.5 3.5 0 0 0 0-4.95z" /></svg>;
    case "scan":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /></svg>;
    case "droplets":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12 6 12 2c0 4-2.5 6-4.5 7.5S5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
    case "baby":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="8" r="5" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 21a8 8 0 0 0-16 0" /></svg>;
    case "heart-pulse":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h2l2 3 4-6 2 3h4" /></svg>;
    case "eye":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>;
    default:
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={1.8} /></svg>;
  }
}

/* ─── Color Helpers ───────────────────────────────────────────────────── */
const colorMap: Record<string, { bg: string; bgHover: string; text: string; border: string; ring: string; dot: string }> = {
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/30",    bgHover: "hover:bg-rose-100/80 dark:hover:bg-rose-900/30",    text: "text-rose-600 dark:text-rose-400",    border: "border-rose-200/60 dark:border-rose-800/40",    ring: "ring-rose-500/20",    dot: "bg-rose-500" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-950/30",      bgHover: "hover:bg-sky-100/80 dark:hover:bg-sky-900/30",      text: "text-sky-600 dark:text-sky-400",      border: "border-sky-200/60 dark:border-sky-800/40",      ring: "ring-sky-500/20",      dot: "bg-sky-500" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",  bgHover: "hover:bg-amber-100/80 dark:hover:bg-amber-900/30",  text: "text-amber-600 dark:text-amber-400",  border: "border-amber-200/60 dark:border-amber-800/40",  ring: "ring-amber-500/20",  dot: "bg-amber-500" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/30", bgHover: "hover:bg-violet-100/80 dark:hover:bg-violet-900/30", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200/60 dark:border-violet-800/40", ring: "ring-violet-500/20", dot: "bg-violet-500" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-950/30", bgHover: "hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200/60 dark:border-indigo-800/40", ring: "ring-indigo-500/20", dot: "bg-indigo-500" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-950/30", bgHover: "hover:bg-orange-100/80 dark:hover:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200/60 dark:border-orange-800/40", ring: "ring-orange-500/20", dot: "bg-orange-500" },
  pink:    { bg: "bg-pink-50 dark:bg-pink-950/30",    bgHover: "hover:bg-pink-100/80 dark:hover:bg-pink-900/30",    text: "text-pink-600 dark:text-pink-400",    border: "border-pink-200/60 dark:border-pink-800/40",    ring: "ring-pink-500/20",    dot: "bg-pink-500" },
  teal:    { bg: "bg-teal-50 dark:bg-teal-950/30",    bgHover: "hover:bg-teal-100/80 dark:hover:bg-teal-900/30",    text: "text-teal-600 dark:text-teal-400",    border: "border-teal-200/60 dark:border-teal-800/40",    ring: "ring-teal-500/20",    dot: "bg-teal-500" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-950/30",    bgHover: "hover:bg-cyan-100/80 dark:hover:bg-cyan-900/30",    text: "text-cyan-600 dark:text-cyan-400",    border: "border-cyan-200/60 dark:border-cyan-800/40",    ring: "ring-cyan-500/20",    dot: "bg-cyan-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", bgHover: "hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800/40", ring: "ring-emerald-500/20", dot: "bg-emerald-500" },
  fuchsia: { bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30", bgHover: "hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-900/30", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-200/60 dark:border-fuchsia-800/40", ring: "ring-fuchsia-500/20", dot: "bg-fuchsia-500" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",    bgHover: "hover:bg-blue-100/80 dark:hover:bg-blue-900/30",    text: "text-blue-600 dark:text-blue-400",    border: "border-blue-200/60 dark:border-blue-800/40",    ring: "ring-blue-500/20",    dot: "bg-blue-500" },
};

/* ─── Test Type Icons ─────────────────────────────────────────────────── */
function TestIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || "w-5 h-5";
  switch (name) {
    case "clipboard-check":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case "file-text":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} /><line x1="16" y1="13" x2="8" y2="13" strokeWidth={1.8} /><line x1="16" y1="17" x2="8" y2="17" strokeWidth={1.8} /></svg>;
    case "zap":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} /></svg>;
    default:
      return null;
  }
}

/* ─── Animations ──────────────────────────────────────────────────────── */
const fadeSlide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

/* ─── Component ───────────────────────────────────────────────────────── */
export default function SubjectMenu() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubTopic | null>(null);

  const colors = selectedSubject ? colorMap[selectedSubject.color] || colorMap.teal : colorMap.teal;

  const handleSubjectClick = (subject: Subject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
      setSelectedSubtopic(null);
    } else {
      setSelectedSubject(subject);
      setSelectedSubtopic(null);
    }
  };

  const handleSubtopicClick = (subtopic: SubTopic) => {
    if (selectedSubtopic?.id === subtopic.id) {
      setSelectedSubtopic(null);
    } else {
      setSelectedSubtopic(subtopic);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Exam Preparation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Master every topic, drill your weak areas, and pass with confidence.</p>
        </div>
        {selectedSubject && (
          <button
            onClick={() => { setSelectedSubject(null); setSelectedSubtopic(null); }}
            className="text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* ─── Subjects List ────────────────────────────────────── */}
        <div className={`${selectedSubject ? "w-[190px] flex-shrink-0" : "w-full"} transition-all duration-300`}>
          <div className={`grid ${selectedSubject ? "grid-cols-1 gap-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"} transition-all duration-300`}>
            {subjects.map((subject) => {
              const c = colorMap[subject.color] || colorMap.teal;
              const isActive = selectedSubject?.id === subject.id;

              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className={`
                    group relative flex items-center gap-3 text-left rounded-xl transition-all duration-200 border
                    ${selectedSubject ? "px-3 py-2" : "px-3 py-3"}
                    ${isActive
                      ? `${c.bg} ${c.border} ring-2 ${c.ring} shadow-sm`
                      : `bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40 ${c.bgHover} hover:border-slate-300/60 dark:hover:border-slate-600/60 hover:shadow-sm`
                    }
                  `}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? c.bg : "bg-slate-100 dark:bg-slate-700/50"}`}>
                    <SubjectIcon name={subject.icon} className={`w-4 h-4 ${isActive ? c.text : "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold truncate transition-colors ${isActive ? c.text : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                      {subject.name}
                    </p>
                    {!selectedSubject && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subject.subtopics.length} subtopics</p>
                    )}
                  </div>
                  {isActive && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Subtopics & Tests Panel ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {selectedSubject && (
            <motion.div
              key={selectedSubject.id}
              {...fadeSlide}
              className="flex-1 min-w-0 flex flex-col"
            >
              {/* Subtopics */}
              <div className={`glass dark:glass-strong rounded-2xl p-4 border ${colors.border} shadow-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.bg}`}>
                    <SubjectIcon name={selectedSubject.icon} className={`w-3.5 h-3.5 ${colors.text}`} />
                  </div>
                  <h3 className={`text-[15px] font-bold ${colors.text}`}>{selectedSubject.name}</h3>
                </div>

                <div className="space-y-1.5">
                  {selectedSubject.subtopics.map((st) => {
                    const isActive = selectedSubtopic?.id === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleSubtopicClick(st)}
                        className={`
                          w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 border
                          ${isActive
                            ? `${colors.bg} ${colors.border} ring-1 ${colors.ring}`
                            : "bg-white/40 dark:bg-slate-800/30 border-transparent hover:bg-white/70 dark:hover:bg-slate-700/40 hover:border-slate-200/50 dark:hover:border-slate-600/40"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? colors.dot : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span className={`text-[13px] font-semibold transition-colors ${isActive ? colors.text : "text-slate-700 dark:text-slate-300"}`}>
                            {st.name}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold transition-colors ${isActive ? colors.text : "text-slate-400 dark:text-slate-500"}`}>
                          {st.questionCount} Qs
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Types — shown when a subtopic is selected */}
              <AnimatePresence mode="wait">
                {selectedSubtopic && (
                  <motion.div
                    key={selectedSubtopic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-4"
                  >
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                      Choose your test — {selectedSubtopic.name}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {testTypes.map((test) => (
                        <button
                          key={test.id}
                          className={`
                            group/test relative glass dark:glass-strong rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/40
                            hover:shadow-lg hover:border-teal-400/50 dark:hover:border-teal-500/40 hover:-translate-y-0.5
                            transition-all duration-300 text-left flex flex-col
                          `}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                              <TestIcon name={test.icon} className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                            </div>
                          </div>
                          <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover/test:text-teal-700 dark:group-hover/test:text-teal-300 transition-colors">
                            {test.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 flex-1">
                            {test.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
                              {test.duration}
                            </span>
                            <span>{test.questionCount} Qs</span>
                          </div>
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-600 dark:text-teal-400 group-hover/test:text-teal-700 dark:group-hover/test:text-teal-300 transition-colors">
                              Start
                              <svg className="w-3.5 h-3.5 group-hover/test:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
