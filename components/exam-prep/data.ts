export const stats = [
  { label: "Questions Done", value: "1,240", sub: "Total questions completed" },
  { label: "Accuracy", value: "82%", sub: "Average accuracy" },
  { label: "Study Streak", value: "12 Days", sub: "Keep it going!" },
  { label: "Mock Test Average", value: "76%", sub: "Average across 8 tests" },
];

export const quizFeatures = [
  "AKT or KFP",
  "Fixed mode",
  "Topic selection",
  "Timed practice",
  "Adaptive mode",
];

export const mockExamFeatures = [
  "Select topics",
  "Mixed subjects",
  "Question count",
  "Save presets",
  "Time limits",
];

export const resumeExam = {
  title: "AKT Mock #5",
  questionsRemaining: 72,
  percentComplete: 65,
};

export const presetExams = [
  "Full AKT Simulation",
  "KFP Practice Set",
  "Rapid Revision Test",
  "Final Week Assessment",
];

export const weakAreas = ["Cardiovascular", "Endocrinology", "Dermatology"];

export const reviewSummary = [
  { label: "Average Score", value: "78%" },
  { label: "Accuracy Trend", value: "Improving" },
  { label: "Recent Exams", value: "12 Completed" },
  { label: "Topic Perf.", value: "View breakdown" },
];

export const goals = {
  daily: {
    questions: { done: 40, target: 80 },
    time: { done: 60, target: 120 },
    mocks: { done: 0, target: 1 },
  },
  weekly: {
    questions: { done: 320, target: 500 },
    time: { done: 510, target: 900 },
    mocks: { done: 3, target: 7 },
  },
  monthly: {
    questions: { done: 1240, target: 2000 },
    time: { done: 1800, target: 3600 },
    mocks: { done: 10, target: 20 },
  },
};

export const recentActivities = [
  { date: "Today", activity: "Cardiology Quiz", result: "84%", type: "score" },
  { date: "Yesterday", activity: "AKT Mock #5", result: "In Progress", type: "progress" },
  { date: "2 Days Ago", activity: "Dermatology Practice", result: "78%", type: "score" },
  { date: "3 Days Ago", activity: "KFP Practice Set", result: "81%", type: "score" },
  { date: "4 Days Ago", activity: "Rapid Revision Test", result: "71%", type: "score" },
];

export const studyTargets = [
  { task: "Complete 200 Questions", done: false },
  { task: "Finish AKT Mock #5", done: false },
  { task: "Improve Dermatology Accuracy", done: false },
  { task: "Review Endocrinology Notes", done: true },
  { task: "Complete KFP Practice Set", done: true },
];
