import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Protected routes — any path matching these patterns requires an active
 * Clerk session. Unauthenticated requests are automatically redirected to
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL (/sign-in) by Clerk's middleware.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", // All dashboard pages and sub-pages
  "/exam-prep(.*)", // Exam-prep section
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/**
 * matcher — controls WHICH requests Next.js passes to this middleware.
 * Excludes:
 *   • Next.js internals (_next/*)
 *   • Static assets (images, fonts, favicons, etc.)
 * This keeps middleware fast — it only runs on real page/API requests.
 */
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
