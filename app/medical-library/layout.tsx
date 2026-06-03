/**
 * /medical-library layout — minimal passthrough.
 * The page.tsx immediately redirects to /dashboard/medical-library.
 * No sidebar, no header — server-side redirect fires before layout renders content.
 */
export default function MedicalLibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
