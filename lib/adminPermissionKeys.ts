// Resolves an admin route path to its permission key. Most routes are gated by their first
// path segment (e.g. /admin/questions -> "questions"), but the three feedback review pages
// share one URL segment ("feedbacks") while carrying separate permissions, so those need their
// second segment to disambiguate. Shared by app/admin/layout.tsx (route gating) and
// components/admin/AdminSidebar.tsx (nav item visibility) so both stay in sync.
export function resolveAdminSectionKey(pathSegments: string[]): string {
  const top = pathSegments[0] || "dashboard";
  if (top === "feedbacks") {
    const sub = pathSegments[1];
    if (sub === "library") return "feedbacksLibrary";
    if (sub === "questions") return "feedbacksQuestions";
    if (sub === "note-templates") return "feedbacksNoteTemplates";
  }
  return top;
}
