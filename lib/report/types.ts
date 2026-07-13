/* Shared shapes for the client-side, downloadable test report.
   Everything here is built from data already held on the client at
   submission time — no DB / R2 read is involved. */

export interface ReportQuestion {
  /** 1-based position in the test, as the candidate saw it. */
  number: number;
  text: string;
  options: string[];
  correctIndex: number;
  /** null = the candidate left it unattempted. */
  selectedIndex: number | null;
  rationale: string;
  topic: string;
  difficulty: string;
  /** True when the question carried an illustration (not embedded in the PDF). */
  hadImage: boolean;
}

export interface ReportData {
  testName: string;
  /** Human-readable submission date, e.g. "14 Jul 2026, 18:42". */
  dateLabel: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  /** correct / total, rounded to a whole percent. */
  scorePercent: number;
  /** correct / attempted, rounded to a whole percent (0 when nothing attempted). */
  accuracyPercent: number;
  timeUsedSeconds: number;
  questions: ReportQuestion[];
}

/** One report row as persisted in the browser's IndexedDB. */
export interface StoredReport {
  /** Keyed by the route's testId — re-taking a test overwrites this. */
  testId: string;
  testName: string;
  scorePercent: number;
  createdAt: string;
  blob: Blob;
}
