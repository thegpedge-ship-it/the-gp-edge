"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalLogo() {
  const pathname = usePathname();

  if (!pathname) return null;

  // Rule 4: The logo should NOT be displayed anywhere inside the Admin area
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Rule 3: Exam Prep logic — Show logo ONLY on the main Exam Prep dashboard page. Hide on sub-pages.
  // We treat paths starting with /test or /exam-prep (that are not exactly the root) as subpages.
  const isExamPrepPath = pathname.startsWith("/exam-prep") || pathname.startsWith("/dashboard/exam-prep") || pathname.startsWith("/test");
  const isMainExamPrep = pathname === "/exam-prep" || pathname === "/dashboard/exam-prep";

  if (isExamPrepPath && !isMainExamPrep) {
    return null;
  }

  return (
    <div className="fixed top-3 left-0 md:top-4 md:left-0 z-[60] pointer-events-auto">
      <Link href="/">
        <Image
          src="/assets/logo.png"
          alt="The GP Edge"
          width={240}
          height={240}
          className="w-auto h-12 md:h-16 lg:h-20 xl:h-[84px] object-contain drop-shadow-sm hover:opacity-90 transition-opacity"
          priority
        />
      </Link>
    </div>
  );
}
