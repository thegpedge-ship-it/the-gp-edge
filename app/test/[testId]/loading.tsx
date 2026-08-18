import ExamLoadingScreen from "@/components/exam-prep/ExamLoadingScreen";

/**
 * Covers both /test/[testId]/instructions and /test/[testId]/start.
 *
 * Bridges the gap between clicking "Start" and the client component mounting —
 * the route chunk still has to load, and without this the user sits on the
 * previous page with no feedback and assumes the button did nothing.
 */
export default function Loading() {
  return <ExamLoadingScreen title="Preparing your test" />;
}
