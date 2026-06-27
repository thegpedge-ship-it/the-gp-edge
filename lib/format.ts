// Pure formatting helpers — safe to import from both server and client modules.

/** "Joined Jan 2026" from an ISO timestamp, or a fallback if absent. */
export function formatJoined(iso: string | null, fallback = "Recently"): string {
  if (!iso) return `Joined ${fallback}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `Joined ${fallback}`;
  return `Joined ${d.toLocaleString("en-AU", { month: "short", year: "numeric" })}`;
}
