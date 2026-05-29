"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveStudentSimulatorProps {
  weakTopicWeight: number;
  difficultyScaling: number;
  spacedRepetition: boolean;
  topicPriorities: { topic: string; weight: number; auto: boolean }[];
}

interface Question {
  id: string;
  topic: string;
  type: string;
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  choices: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

const mockQuestions: Question[] = [
  {
    id: "Q2",
    topic: "Respiratory",
    type: "KFP PRACTICE CASE",
    question: "A 22-year-old female presents with acute asthma exacerbation. Her peak flow is 50% of predicted. What is the first-line medication?",
    difficulty: "Medium",
    choices: [
      { key: "A", text: "Salbutamol (SABA) via spacer" },
      { key: "B", text: "Oral prednisolone" },
      { key: "C", text: "Inhaled fluticasone" },
    ],
    correctAnswer: "A",
    explanation: "Salbutamol (SABA) via spacer is the first-line bronchodilator for acute asthma exacerbation. Systemic corticosteroids like oral prednisolone are added early but SABA is the immediate first-line response.",
  },
  {
    id: "Q5",
    topic: "Cardiology",
    type: "AKT PRACTICE CASE",
    question: "A 55-year-old male with type 2 diabetes has a clinic blood pressure of 145/88 mmHg. What is the recommended first-line antihypertensive agent?",
    difficulty: "Medium",
    choices: [
      { key: "A", text: "Amlodipine (Calcium Channel Blocker)" },
      { key: "B", text: "Ramipril (ACE Inhibitor)" },
      { key: "C", text: "Indapamide (Thiazide-like Diuretic)" },
    ],
    correctAnswer: "B",
    explanation: "For patients with diabetes and hypertension, an ACE inhibitor (like Ramipril) or an ARB is recommended first-line due to its renal protective benefits.",
  },
  {
    id: "Q14",
    topic: "Mental Health",
    type: "KFP PRACTICE CASE",
    question: "A 34-year-old female presents with moderate depressive symptoms for 3 months. She prefers non-pharmacological treatment. What is the most appropriate first-line recommendation?",
    difficulty: "Hard",
    choices: [
      { key: "A", text: "Structured psychological intervention (e.g. CBT)" },
      { key: "B", text: "Immediate initiation of SSRI (e.g. Sertraline)" },
      { key: "C", text: "St John's Wort herbal therapy" },
    ],
    correctAnswer: "A",
    explanation: "For moderate depression, especially when preferred by the patient, structured psychological interventions like Cognitive Behavioural Therapy (CBT) are the recommended first-line strategy.",
  },
  {
    id: "Q1",
    topic: "Dermatology",
    type: "AKT PRACTICE CASE",
    question: "An 8-year-old child presents with an intensely itchy rash, particularly worse at night. Scabies is suspected. What is the first-line treatment?",
    difficulty: "Easy",
    choices: [
      { key: "A", text: "Hydrocortisone 1% topical cream" },
      { key: "B", text: "Permethrin 5% topical cream" },
      { key: "C", text: "Oral Ivermectin" },
    ],
    correctAnswer: "B",
    explanation: "Permethrin 5% topical cream applied from the neck down and washed off after 8-12 hours is the first-line treatment for scabies. All household contacts should be treated simultaneously.",
  },
];

export default function LiveStudentSimulator({
  weakTopicWeight,
  difficultyScaling,
  spacedRepetition,
  topicPriorities,
}: LiveStudentSimulatorProps) {
  // Simulator states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredState, setAnsweredState] = useState<"correct" | "incorrect" | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question>(mockQuestions[0]);
  const [progressScores, setProgressScores] = useState({
    Cardiology: 96,
    Respiratory: 78,
    "Mental Health": 65,
    Dermatology: 62,
  });
  const [readinessScore, setReadinessScore] = useState(88);
  const [explanationShown, setExplanationShown] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([
    "Adaptive Learning Engine Initialized.",
    "Session started: Loading student progress profile...",
  ]);

  // Add simulator logs helper
  const addLog = (msg: string) => {
    setLogMessages((prev) => [msg, ...prev.slice(0, 4)]);
  };

  // Determine active question based on weights & priorities
  useEffect(() => {
    // Find the topic with the highest weight that we have a question for
    const sortedPriorities = [...topicPriorities].sort((a, b) => b.weight - a.weight);
    
    // Find matching question in mock questions
    const matchingQ = mockQuestions.find(
      (q) => q.topic.toLowerCase() === sortedPriorities[0]?.topic.toLowerCase()
    );

    if (matchingQ && matchingQ.id !== activeQuestion.id) {
      setActiveQuestion(matchingQ);
      setSelectedAnswer(null);
      setAnsweredState(null);
      setExplanationShown(false);
      addLog(`Adaptive Engine redirect: Priority topic '${matchingQ.topic}' has weight ${sortedPriorities[0].weight}%. Serving ${matchingQ.id}.`);
    }
  }, [topicPriorities]);

  // Handle settings changes logs
  useEffect(() => {
    addLog(`Engine Parameters Updated: Weak Topic Weight: ${weakTopicWeight}%, Difficulty Scaling: ${difficultyScaling}%`);
  }, [weakTopicWeight, difficultyScaling]);

  useEffect(() => {
    addLog(`Spaced Repetition algorithm ${spacedRepetition ? "ENABLED" : "DISABLED"}`);
  }, [spacedRepetition]);

  const handleSelectAnswer = (key: string) => {
    if (answeredState !== null) return; // Allow answering only once per question load

    setSelectedAnswer(key);
    const isCorrect = key === activeQuestion.correctAnswer;
    setAnsweredState(isCorrect ? "correct" : "incorrect");
    setExplanationShown(true);

    if (isCorrect) {
      addLog(`Student answered ${activeQuestion.id} CORRECTLY. Recalculating topic proficiency...`);
      // Update the progress bar for the topic
      const topicName = activeQuestion.topic;
      setProgressScores((prev) => {
        const currentScore = (prev as any)[topicName] || 70;
        const newScore = Math.min(100, currentScore + 4);
        
        // Update general readiness score too
        setReadinessScore((r) => Math.min(100, r + 1));
        
        return {
          ...prev,
          [topicName]: newScore,
        };
      });
    } else {
      addLog(`Student answered ${activeQuestion.id} INCORRECTLY. Scheduling review with Spaced Repetition...`);
      // Slightly lower the score
      const topicName = activeQuestion.topic;
      setProgressScores((prev) => {
        const currentScore = (prev as any)[topicName] || 70;
        const newScore = Math.max(0, currentScore - 3);
        
        setReadinessScore((r) => Math.max(0, r - 1));
        
        return {
          ...prev,
          [topicName]: newScore,
        };
      });
    }
  };

  const handleNextSimulation = () => {
    // Find another question
    const currentIndex = mockQuestions.findIndex((q) => q.id === activeQuestion.id);
    const nextIndex = (currentIndex + 1) % mockQuestions.length;
    
    setActiveQuestion(mockQuestions[nextIndex]);
    setSelectedAnswer(null);
    setAnsweredState(null);
    setExplanationShown(false);
    addLog(`Loading simulated question ${mockQuestions[nextIndex].id} (${mockQuestions[nextIndex].topic})`);
  };

  const resetSimulation = () => {
    setProgressScores({
      Cardiology: 96,
      Respiratory: 78,
      "Mental Health": 65,
      Dermatology: 62,
    });
    setReadinessScore(88);
    setSelectedAnswer(null);
    setAnsweredState(null);
    setExplanationShown(false);
    addLog("Simulator reset. Restored baseline student metrics.");
  };

  return (
    <div className="bg-[#090d16] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden text-white">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Members only
            </span>
            <span className="bg-teal-500/10 border border-teal-500/30 text-teal-400 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Most Popular
            </span>
            <div className="flex items-center gap-1.5 ml-2 bg-slate-800/50 px-2.5 py-0.5 rounded-md border border-slate-700/50 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live Simulation Mode
            </div>
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl font-medium tracking-tight text-white mb-2">
            Adaptive Exam Prep
          </h2>
          <p className="text-slate-400 text-xs max-w-xl font-light">
            Dynamic mock exams for AKT and KFP. The platform learns your weak spots and prioritizes them—every minute counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-xs font-semibold transition"
          >
            Reset Student
          </button>
          <button
            onClick={handleNextSimulation}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition shadow-lg shadow-teal-600/20"
          >
            Next Question
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT COLUMN: Progress metrics & Engine logs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Progress Card - Matches styling exactly */}
          <div className="bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-teal-500/10 border border-teal-500/20">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">Your Progress</span>
                </div>
                <span className="text-[10px] text-slate-500 tracking-wide uppercase font-medium">Last 7 days</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-serif font-bold text-white">{readinessScore}%</div>
                <div className="text-[10px] font-semibold text-teal-400 flex items-center justify-end gap-0.5">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +12%
                </div>
              </div>
            </div>

            {/* Proficiency Bars */}
            <div className="space-y-4 mb-6">
              {[
                { name: "Cardiology", key: "Cardiology", color: "bg-[#0fb7a1]", glow: "shadow-[0_0_8px_rgba(15,183,161,0.5)]" },
                { name: "Respiratory", key: "Respiratory", color: "bg-[#10b981]", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]" },
                { name: "Mental Health", key: "Mental Health", color: "bg-[#f59e0b]", glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]" },
                { name: "Dermatology", key: "Dermatology", color: "bg-slate-400", glow: "shadow-[0_0_8px_rgba(148,163,184,0.3)]" },
              ].map((topic) => {
                const score = (progressScores as any)[topic.key] || 70;
                return (
                  <div key={topic.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-light">{topic.name}</span>
                      <span className="font-semibold text-white">{score}%</span>
                    </div>
                    <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${topic.color} ${topic.glow}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activity Sparklines Representation */}
            <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">Weekly Activity</span>
                <span className="text-slate-400 font-mono text-[10px]">352 Attempts</span>
              </div>
              <div className="flex items-end justify-between h-8 px-1">
                {[12, 18, 25, 15, 30, 22, 38].map((h, i) => (
                  <div key={i} className="w-[10%] group cursor-pointer relative" style={{ height: "100%" }}>
                    <div
                      className="w-full bg-slate-800 group-hover:bg-teal-500/50 rounded-sm transition-all"
                      style={{ height: "100%" }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h * 2.5}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="absolute bottom-0 w-full bg-teal-500/20 group-hover:bg-teal-400 rounded-sm transition-all shadow-[0_0_6px_rgba(20,184,166,0.3)]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
            </div>

            {/* Ready Badge & View Details */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider leading-none">Ready for exam!</span>
                  <span className="text-[8px] text-slate-400 leading-none mt-0.5">Confidence: High</span>
                </div>
              </div>
              <span className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer transition">
                View details
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>

          {/* Simulated Decision Engine Logs */}
          <div className="bg-[#0f172a]/40 border border-slate-800/60 rounded-2xl p-4">
            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Adaptive Engine Logs
            </h4>
            <div className="space-y-2 h-[120px] overflow-y-auto font-mono text-[10px] text-slate-400 scrollbar-thin">
              {logMessages.map((log, idx) => (
                <div key={idx} className="flex gap-2 border-b border-slate-900/40 pb-1.5 last:border-0">
                  <span className="text-teal-500 shrink-0">❯</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Question Popup simulator */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Question Overlay Card - Matches styling exactly */}
          <div className="w-full bg-[#0a0e1a] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative">
            
            {/* Question Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block shadow-[0_0_6px_rgba(20,184,166,0.8)]" />
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  {activeQuestion.type}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {activeQuestion.id}
              </span>
            </div>

            {/* Difficulty Badge */}
            <div className="mb-4">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                activeQuestion.difficulty === "Easy"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : activeQuestion.difficulty === "Medium"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                Difficulty: {activeQuestion.difficulty}
              </span>
            </div>

            {/* Question Body */}
            <p className="text-slate-100 text-sm md:text-base font-normal leading-relaxed mb-6 font-sans">
              {activeQuestion.question}
            </p>

            {/* Choices */}
            <div className="space-y-3">
              {activeQuestion.choices.map((choice) => {
                const isSelected = selectedAnswer === choice.key;
                const isCorrect = choice.key === activeQuestion.correctAnswer;
                
                let optionStyle = "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700/60";
                let badgeStyle = "bg-slate-800 border-slate-700 text-slate-400";
                
                if (answeredState !== null) {
                  if (isCorrect) {
                    optionStyle = "border-emerald-500/80 bg-emerald-500/10 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                    badgeStyle = "bg-emerald-500 border-emerald-400 text-white";
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "border-red-500/80 bg-red-500/10 text-slate-200";
                    badgeStyle = "bg-red-500 border-red-400 text-white";
                  } else {
                    optionStyle = "border-slate-900 bg-slate-900/20 text-slate-500 opacity-60 pointer-events-none";
                    badgeStyle = "bg-slate-950 border-slate-900 text-slate-600";
                  }
                }

                return (
                  <button
                    key={choice.key}
                    disabled={answeredState !== null}
                    onClick={() => handleSelectAnswer(choice.key)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all duration-300 group ${optionStyle}`}
                  >
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${badgeStyle}`}>
                      {choice.key}
                    </div>
                    <span className="text-sm font-medium">{choice.text}</span>
                    {answeredState !== null && isCorrect && (
                      <svg className="w-5 h-5 text-emerald-400 ml-auto shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {answeredState !== null && isSelected && !isCorrect && (
                      <svg className="w-5 h-5 text-red-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Section */}
            <AnimatePresence>
              {explanationShown && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className={`mt-6 p-4 rounded-xl border text-xs leading-relaxed transition-all duration-300 relative ${
                    answeredState === "correct"
                      ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                      : "bg-red-950/20 border-red-800/40 text-red-300"
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1">
                    {answeredState === "correct" ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Simulated Answer: Correct!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Simulated Answer: Incorrect
                      </>
                    )}
                  </div>
                  <p>{activeQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Info note */}
          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-500 font-light flex items-center gap-1.5 justify-center">
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Admins can click options above to simulate a student completing practice cases in real time.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
