export const user = {
  firstName: "Sarah",
  lastName: "Chen",
  initials: "SC",
  role: "GP Registrar — PGY3",
  hospital: "Royal North Shore",
  location: "Sydney, NSW",
  examTarget: "AKT — Aug 2026",
  lastSyncedMin: 2,
  rank: 142,
  totalUsers: 8420,
  joinedLabel: "Joined Jan 2026",
  bio: "Preparing for AKT/KFP · Cardiology enthusiast",
  contact: {
    email: "s.chen@gpedge.au",
    racgpId: "RACGP-89241",
  },
};

export const badges = [
  { key: "first-mock", name: "First Mock", earned: "12 Jan", accent: "emerald" as const, icon: "trophy" },
  { key: "100q", name: "100 Questions", earned: "18 Jan", accent: "violet" as const, icon: "spark" },
  { key: "streak-7", name: "7-day Streak", earned: "24 Jan", accent: "amber" as const, icon: "flame" },
  { key: "streak-14", name: "14-day Streak", earned: "31 Jan", accent: "amber" as const, icon: "flame" },
  { key: "cardio-pro", name: "Cardio Pro", earned: "9 Feb", accent: "rose" as const, icon: "heart" },
  { key: "1000q", name: "1,000 Questions", earned: "22 Apr", accent: "violet" as const, icon: "spark" },
  { key: "mbs-master", name: "MBS Master", earned: "3 May", accent: "cyan" as const, icon: "bolt" },
  { key: "perfect-block", name: "Perfect Block", earned: "21 May", accent: "emerald" as const, icon: "trophy" },
];

// 12 weeks × 7 days = 84 cells. Values 0–4 represent activity intensity.
export const heatmap = [
  0, 1, 0, 2, 1, 0, 0,
  1, 2, 1, 0, 0, 1, 1,
  0, 0, 1, 2, 2, 1, 0,
  1, 1, 2, 3, 2, 1, 0,
  0, 1, 2, 2, 3, 2, 1,
  2, 2, 3, 3, 2, 1, 1,
  1, 2, 2, 3, 3, 2, 2,
  2, 3, 3, 4, 3, 2, 1,
  3, 3, 4, 4, 3, 3, 2,
  2, 3, 4, 4, 4, 3, 2,
  3, 4, 4, 3, 4, 3, 3,
  4, 4, 3, 4, 4, 3, 4,
];

export const subjectCoverage = {
  totalTopics: 124,
  covered: 78,
  // mini stats by category for the sidebar
  buckets: [
    { label: "Strong", count: 18, color: "bg-emerald-500" },
    { label: "Good", count: 32, color: "bg-teal-400" },
    { label: "Developing", count: 28, color: "bg-amber-400" },
    { label: "Weak", count: 14, color: "bg-rose-400" },
    { label: "Untouched", count: 32, color: "bg-slate-200 dark:bg-slate-700" },
  ],
};

export const subscription = {
  plan: "Premium" as const,
  renewsOn: "12 Sep 2026",
  features: ["Unlimited mocks", "AI recommendations", "MBS Pro"],
};

export const stats = [
  {
    key: "readiness",
    label: "Exam Readiness",
    value: "72%",
    delta: "+4%",
    trend: "up" as const,
    accent: "emerald" as const,
    caption: "vs last week",
    icon: "target" as const,
    spark: [55, 58, 57, 62, 60, 64, 66, 65, 68, 70, 69, 72],
  },
  {
    key: "streak",
    label: "Study Streak",
    value: "18",
    unit: "days",
    delta: "Personal best: 23 days",
    trend: "up" as const,
    accent: "amber" as const,
    caption: "",
    icon: "flame" as const,
    spark: [4, 5, 7, 6, 8, 10, 12, 11, 13, 15, 16, 18],
  },
  {
    key: "accuracy",
    label: "Avg Accuracy",
    value: "78.4%",
    delta: "+2.1%",
    trend: "up" as const,
    accent: "violet" as const,
    caption: "vs last 30 days",
    icon: "trend" as const,
    spark: [62, 65, 64, 68, 71, 70, 73, 75, 74, 76, 78, 78.4],
  },
  {
    key: "attempts",
    label: "Quiz Attempts",
    value: "1,284",
    delta: "+92",
    trend: "up" as const,
    accent: "sky" as const,
    caption: "this week",
    icon: "doc" as const,
    spark: [820, 880, 940, 990, 1040, 1090, 1130, 1170, 1192, 1220, 1245, 1284],
  },
];

export const greeting = {
  emoji: "👋",
  salutation: "Good morning, Sarah!",
  title: "Your study",
  highlight: "cockpit",
  subtext: "Keep going! You're doing great. ✨",
};

export const quickActionChips = [
  { key: "practice", label: "Start Practice", icon: "book" as const, accent: "emerald" as const },
  { key: "review", label: "Topic Review", icon: "doc" as const, accent: "amber" as const },
  { key: "weak", label: "Weak Areas", icon: "target" as const, accent: "violet" as const },
  { key: "saved", label: "Saved Questions", icon: "bookmark" as const, accent: "sky" as const },
  { key: "performance", label: "Performance", icon: "chart" as const, accent: "rose" as const },
];

export const continueSession = {
  title: "Cardiovascular — ECG interpretation",
  subtitle: "AKT mock · Block 3 of 5",
  progress: 62,
  questionsLeft: 14,
  estMinutes: 22,
  lastTopic: "Atrial fibrillation management",
  difficulty: "Mixed",
};

export const performance = [
  { subject: "Cardiology", mastery: 84, change: 6, color: "emerald" as const },
  { subject: "Respiratory", mastery: 71, change: 3, color: "cyan" as const },
  { subject: "Endocrinology", mastery: 68, change: -2, color: "violet" as const },
  { subject: "Mental Health", mastery: 59, change: 8, color: "amber" as const },
  { subject: "Paediatrics", mastery: 54, change: 1, color: "emerald" as const },
  { subject: "Dermatology", mastery: 47, change: -4, color: "violet" as const },
];

export const upcomingExam = {
  name: "AKT Mock Exam — Block 4",
  dateLabel: "Sat, 13 Jun 2026",
  timeLabel: "09:00 AEST",
  daysAway: 16,
  totalQuestions: 150,
  durationMin: 210,
};

export const weeklyProgress = {
  totalQs: 312,
  totalMin: 284,
  goalQs: 350,
  days: [
    { label: "Mon", qs: 42, min: 38 },
    { label: "Tue", qs: 58, min: 51 },
    { label: "Wed", qs: 31, min: 27 },
    { label: "Thu", qs: 66, min: 60 },
    { label: "Fri", qs: 49, min: 44 },
    { label: "Sat", qs: 38, min: 36 },
    { label: "Sun", qs: 28, min: 28 },
  ],
};

export const accuracyTrend = {
  current: 78.4,
  delta: 2.1,
  points: [62, 65, 64, 68, 71, 70, 73, 75, 74, 76, 78, 78.4],
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "Now"],
};

export const weakTopics = [
  { name: "Dermatology — pigmented lesions", accuracy: 41, attempts: 28 },
  { name: "Endocrine emergencies", accuracy: 47, attempts: 19 },
  { name: "Paediatric rashes", accuracy: 52, attempts: 24 },
];

export const strongTopics = [
  { name: "ECG rhythm interpretation", accuracy: 92, attempts: 64 },
  { name: "Asthma & COPD management", accuracy: 88, attempts: 51 },
  { name: "Hypertension targets", accuracy: 87, attempts: 47 },
];

export const aiRecommendations = [
  {
    title: "Drill 20 dermatology stems tonight",
    reason: "Your dermatology accuracy is 47% — biggest gap for AKT.",
    minutes: 25,
    tag: "Priority",
  },
  {
    title: "Review GPMHCP autofill template",
    reason: "You bookmarked this 3 days ago and haven't opened it.",
    minutes: 8,
    tag: "Quick win",
  },
  {
    title: "KFP case set: chest pain triage",
    reason: "You're ahead on cardiology — extend to KFP application.",
    minutes: 35,
    tag: "Stretch",
  },
];

export const dailyPractice = {
  date: "Today",
  goalQs: 50,
  doneQs: 32,
  blocks: [
    { name: "Warm-up — mixed 10", done: true, minutes: 12 },
    { name: "Dermatology focus — 15 stems", done: true, minutes: 20 },
    { name: "KFP case — chest pain", done: false, minutes: 18 },
    { name: "Cool-down — flagged review", done: false, minutes: 10 },
  ],
};

export const examPaths = [
  {
    code: "AKT",
    name: "Applied Knowledge Test",
    readiness: 72,
    mocksDone: 6,
    mocksTotal: 12,
    nextMilestone: "70% on Block 4",
    accent: "emerald" as const,
  },
  {
    code: "KFP",
    name: "Key Feature Problem",
    readiness: 58,
    mocksDone: 3,
    mocksTotal: 10,
    nextMilestone: "Complete case set 4",
    accent: "violet" as const,
  },
];

export const activity = [
  { id: 1, type: "mock" as const, title: "Completed AKT Mock — Block 3", meta: "Scored 78% · 132/150", timeAgo: "2 hours ago" },
  { id: 2, type: "autofill" as const, title: "Saved autofill template", meta: "Mental Health Care Plan (GPMHCP)", timeAgo: "Yesterday" },
  { id: 3, type: "mbs" as const, title: "Looked up MBS item 36", meta: "Level C consult · added to favourites", timeAgo: "Yesterday" },
  { id: 4, type: "study" as const, title: "Completed 'Asthma in adults' module", meta: "12 min · 18/20 correct", timeAgo: "2 days ago" },
  { id: 5, type: "mock" as const, title: "Started AKT Mock — Block 3", meta: "Resumed from Cardiology", timeAgo: "2 days ago" },
];

export const quickAccess = [
  { key: "mbs", title: "MBS Explorer", caption: "Search billing items", accent: "emerald" as const, badge: "1,924 items" },
  { key: "autofills", title: "Clinical Autofills", caption: "Templates & macros", accent: "violet" as const, badge: "42 saved" },
  { key: "conditions", title: "Conditions Library", caption: "Reference & guidelines", accent: "cyan" as const, badge: "318 entries" },
  { key: "notes", title: "Notes & Flags", caption: "Your bookmarked items", accent: "amber" as const, badge: "27 flagged" },
];

export const notifications = [
  { id: 1, type: "streak" as const, title: "18-day streak — keep it going", meta: "Practice 20 more questions to lock in today.", timeAgo: "1h ago", unread: true },
  { id: 2, type: "milestone" as const, title: "Readiness hit 72%", meta: "+4% this week. Next milestone: 75%.", timeAgo: "3h ago", unread: true },
  { id: 3, type: "content" as const, title: "New case set: Paediatric rashes", meta: "12 KFP stems added to your queue.", timeAgo: "Yesterday", unread: false },
];

export const nav = [
  { key: "dashboard", label: "Dashboard", active: true },
  { key: "exams", label: "Mock Exams", active: false, badge: "New" },
  { key: "mbs", label: "MBS Explorer", active: false },
  { key: "autofills", label: "Autofills", active: false },
  { key: "cases", label: "Case Library", active: false },
  { key: "progress", label: "Progress", active: false },
];

export const bottomNav = [
  { key: "settings", label: "Settings" },
  { key: "help", label: "Help & support" },
];
