"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/contexts/ThemeContext";

const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZHVtbXktY2xlcmstcHVibGlzaGFibGUta2V5JG1vY2suY2xlcmsuYWNjb3VudHMuZGV2JA";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
