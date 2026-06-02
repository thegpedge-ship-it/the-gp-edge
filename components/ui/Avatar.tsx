/**
 * Avatar — shared professional avatar SVG.
 * Single source of truth used by Sidebar, Profile, Settings, and any future pages.
 */
export default function Avatar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Default profile avatar"
    >
      <circle cx="48" cy="48" r="48" fill="#E2F0EE" />
      <circle cx="48" cy="33" r="15" fill="#8BBDB8" />
      <path d="M10 84c0-15.464 17.01-28 38-28s38 12.536 38 28" fill="#8BBDB8" />
    </svg>
  );
}
