import { redirect } from "next/navigation";

/**
 * /medical-library is now served under /dashboard/medical-library.
 * This redirect ensures any existing links continue to work.
 */
export default function MedicalLibraryRedirect() {
  redirect("/dashboard/medical-library");
}
