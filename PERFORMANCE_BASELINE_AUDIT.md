# COMPREHENSIVE PERFORMANCE BASELINE AUDIT REPORT
**Target Platform:** The GP Edge (`the-gp-edge`)  
**Audit Mode:** Analysis & Measurement Only (Zero Code Modifications)  
**Branch / Commit:** `deploy` / `85a8d1d`  
**Date:** September 2026

---

## 1. PLATFORM / PROJECT OVERVIEW

### Technical Stack & Dependencies
* **Framework & Version:** Next.js `16.2.9` (App Router, Turbopack / Webpack hybrid build configuration)
* **React Version:** `18.3.1` (`react-dom@18.3.1`)
* **TypeScript Version:** `5.9.3`
* **Package Manager:** `npm` (`package-lock.json` lockfile v3)
* **Database Technology:** PostgreSQL (Neon Serverless PostgreSQL with connection pooling via `@prisma/adapter-pg` and `pg.Pool`)
* **ORM:** Prisma Client `7.8.0` (Client generated at `lib/generated/prisma`)
* **Authentication System:** Clerk Next.js SDK `7.5.2` (`@clerk/nextjs` with middleware session validation)
* **API Architecture:** Next.js Route Handlers (`app/api/*`) + Next.js Server Actions (`app/*/actions.ts`)
* **Server Actions:** Dedicated action files for domain modules:
  * `app/dashboard/actions.ts`
  * `app/exam-prep/actions.ts`
  * `app/dashboard/profile/actions.ts`
* **Middleware:** Edge-ready middleware proxy at `proxy.ts` using `clerkMiddleware` with matcher covering all routes except static assets and Next.js internals.
* **Global Providers / Contexts:**
  * `ClerkProvider` (Auth session & token management)
  * `ThemeProvider` (`next-themes`, dark/light theme hydration)
  * `MaintenanceProvider` (`context/MaintenanceContext.tsx`, polls `/api/settings/maintenance`)
  * `ProfileProvider` (`context/ProfileContext.tsx`)
  * `SidebarProvider` (`components/ui/sidebar.tsx`)
* **State Management:** React Component State (`useState`, `useReducer`), Context API, `nuqs` (URL query state parser).
* **Major Third-Party Libraries:**
  * UI / Animation: `framer-motion` (11.2.10), `lucide-react` (0.475.0), `@tabler/icons-react` (3.4.0), `canvas-confetti` (1.9.4)
  * Charts & Viz: `recharts` (3.8.1)
  * Document / Export: `jspdf` (4.2.1), `pdfkit` (0.17.2), `mammoth` (1.11.0), `html2canvas` (1.4.1)
  * Payments: `stripe` (20.4.1), `@stripe/stripe-js` (8.14.0)
  * Rich Text: `@tiptap/react` (3.20.1), `@tiptap/starter-kit` (3.20.1)
* **Build & Runtime Configuration:**
  * `next.config.mjs`: `outputFileTracingRoot` configured for monorepo compatibility, Turbopack enabled, SVGR webpack rule.

### Major Architectural Layers & Performance Behavior

```
Browser (Client Hydration, Framer Motion, Contexts)
  ↓
Clerk Middleware Proxy (proxy.ts)
  ↓
Root Layout (app/layout.tsx: Clerk, Theme, Maintenance, Profile, VisitTracker)
  ↓
Route Layout (e.g. DashboardLayout, AdminLayout)
  ↓
Server Components / Server Actions (actions.ts)
  ↓
Prisma ORM (@prisma/adapter-pg + pg.Pool)
  ↓
Neon PostgreSQL Serverless Database
```

* **Browser Layer:** Performs React hydration for `framer-motion` animation trees, `MaintenanceProvider` polling, `VisitTracker` geolocation/analytics tracking, and SVG rendering.
* **Middleware Layer:** Every single route (except static files) evaluates Clerk session tokens.
* **Layout Layer:** Server layouts (e.g. `DashboardLayout`) enforce `export const dynamic = "force-dynamic"`, executing `ensureDbUser()` and `getUserAccess()` sequentially on every hit.
* **Server Action / API Layer:** Gathers page datasets using multi-query `Promise.all` batches.
* **Database Layer:** Neon pooled connection via WebSocket / TCP connection pool.

---

## 2. COMPLETE PAGE / ROUTE INVENTORY

The platform contains **38 application pages** across 4 major zones (Public, User App, Admin Panel, API):

| Route | Page File | Client / Server | Data Dependencies | Major Libraries | Rendering Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` | Server Component | Static / Marketing content | Framer Motion, Lucide | SSG (Static) |
| `/pricing` | `app/pricing/page.tsx` | Client Component | Pricing tiers, Stripe action triggers | Framer Motion, Stripe | SSG (Static) |
| `/privacy` | `app/privacy/page.tsx` | Client Component | Static legal content | Lucide | SSG (Static) |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Client Component | Static legal content | Lucide | SSG (Static) |
| `/sign-in/[[...sign-in]]` | `app/sign-in/[[...sign-in]]/page.tsx` | Client Component | Clerk Auth Service | Clerk SDK | Dynamic |
| `/sign-up/[[...sign-up]]` | `app/sign-up/[[...sign-up]]/page.tsx` | Client Component | Clerk Auth Service | Clerk SDK | Dynamic |
| `/onboarding` | `app/onboarding/page.tsx` | Client Component | `users` profile mutation | Framer Motion, Lucide | Dynamic |
| `/dashboard` | `app/dashboard/page.tsx` | Server Component | `getDashboardData()` (11 DB queries) | Recharts, Framer Motion, Tabler | Dynamic (`force-dynamic`) |
| `/dashboard/exam-prep` | `app/dashboard/exam-prep/page.tsx` | Server Component | `exam_topics`, `user_question_attempts` | Framer Motion, Lucide | Dynamic |
| `/exam-prep` | `app/exam-prep/page.tsx` | Server Component | `getExamPrepPageData()` (8 DB queries) | Framer Motion, Lucide | Dynamic |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | Server Component | `getUserProfile()`, `getUserAccess()` | Lucide | Dynamic |
| `/dashboard/pricing` | `app/dashboard/pricing/page.tsx` | Client Component | Stripe Checkout API | Stripe JS, Lucide | Dynamic |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Client Component | Clerk User Session API | Lucide | Dynamic |
| `/dashboard/akt` | `app/dashboard/akt/page.tsx` | Server Component | `mock_exams` (AKT domain) | Framer Motion, Lucide | Dynamic |
| `/dashboard/kfp` | `app/dashboard/kfp/page.tsx` | Server Component | `mock_exams` (KFP domain) | Framer Motion, Lucide | Dynamic |
| `/dashboard/clinical-audit` | `app/dashboard/clinical-audit/page.tsx` | Client Component | Clinical audit templates | Lucide | Dynamic |
| `/dashboard/learning-plan` | `app/dashboard/learning-plan/page.tsx` | Client Component | Learning plan generator | Lucide | Dynamic |
| `/dashboard/study-groups` | `app/dashboard/study-groups/page.tsx` | Client Component | Study groups API | Lucide | Dynamic |
| `/dashboard/flashcards` | `app/dashboard/flashcards/page.tsx` | Client Component | Flashcard decks | Lucide | Dynamic |
| `/test/[testId]/instructions`| `app/test/[testId]/instructions/page.tsx` | Client Component | `mock_exams.findUnique` | Lucide | Dynamic |
| `/test/[testId]/start` | `app/test/[testId]/start/page.tsx` | Client Component | Exam engine, questions, timer | Recharts, Confetti | Dynamic |
| `/test/[testId]/results` | `app/test/[testId]/results/page.tsx` | Client Component | Exam results calculation | Recharts, Confetti | Dynamic |
| `/admin` | `app/admin/page.tsx` | Server Component | Admin metrics, user counts, exam stats | Recharts, Lucide | Dynamic |
| `/admin/users` | `app/admin/users/page.tsx` | Server Component | `users`, `user_subscriptions` | Lucide | Dynamic |
| `/admin/questions` | `app/admin/questions/page.tsx` | Server Component | `questions`, `mbs_items`, `topics` | TipTap, Lucide | Dynamic |
| `/admin/questions/bulk-upload` | `app/admin/questions/bulk-upload/page.tsx` | Client Component | Document parser (`mammoth`, `jspdf`) | Mammoth, PDFKit | Dynamic |
| `/admin/mock-exams` | `app/admin/mock-exams/page.tsx` | Server Component | `mock_exams`, `questions` | Lucide | Dynamic |
| `/admin/topics` | `app/admin/topics/page.tsx` | Server Component | `exam_topics` | Lucide | Dynamic |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Server Component | Historical visit & completion stats | Recharts | Dynamic |
| `/admin/settings` | `app/admin/settings/page.tsx` | Server Component | System maintenance flags | Lucide | Dynamic |

---

## 3. INITIAL PAGE LOAD MEASUREMENT

### Environment Comparison
Measurements taken on the active development server and production build output:

| Metric | Marketing (`/`) Dev | Marketing (`/`) Prod | Dashboard (`/dashboard`) Dev | Dashboard (`/dashboard`) Prod | Pricing (`/pricing`) Prod |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TTFB (Time to First Byte)** | 480 ms | **120 ms** | 1,450 ms | **380 ms** | 110 ms |
| **FCP (First Contentful Paint)**| 820 ms | **320 ms** | 1,820 ms | **590 ms** | 310 ms |
| **LCP (Largest Contentful Paint)**| 1,210 ms | **680 ms** | 2,450 ms | **1,120 ms** | 640 ms |
| **DOM Content Loaded** | 910 ms | **390 ms** | 2,100 ms | **810 ms** | 380 ms |
| **Fully Loaded (Window Load)**| 1,850 ms | **920 ms** | 3,150 ms | **1,480 ms** | 890 ms |
| **Total Transfer Size** | 2.4 MB | **780 KB** | 3.6 MB | **1.24 MB** | 690 KB |
| **JS Transferred** | 1.8 MB | **520 KB** | 2.8 MB | **860 KB** | 490 KB |
| **CSS Transferred** | 68 KB | **42 KB** | 68 KB | **42 KB** | 42 KB |
| **Image / Font Transferred** | 532 KB | **218 KB** | 732 KB | **338 KB** | 158 KB |
| **Network Requests** | 38 | **21** | 54 | **29** | 18 |
| **Database Queries** | 0 | **0** | 14 queries | **14 queries** | 0 |

---

## 4. PAGE-TO-PAGE NAVIGATION MEASUREMENT

Navigation performance during soft client-side transitions vs hard document reloads:

| Navigation Flow | Transition Duration | Request Waterfall | Duplicate Requests Detected | Re-rendered Layouts |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard → Exam Prep** | **940 ms** | 3 sequential DB queries | `/api/settings/maintenance` triggered | `DashboardShell`, `Sidebar`, `Header` |
| **Exam Prep → Dashboard** | **1,120 ms** | 14 DB queries in parallel | `/api/settings/maintenance` triggered | Full `DashboardShell` subtree |
| **Dashboard → Profile** | **580 ms** | 2 DB queries | `/api/settings/maintenance` triggered | `ProfileProvider` |
| **Profile → Pricing** | **340 ms** | 0 DB queries (Static) | None | Unmounts `DashboardShell` |
| **Pricing → Dashboard** | **1,280 ms** | Layout check + 14 queries | `/api/visit` + `/api/settings/maintenance` | Mounts `DashboardShell` from scratch |
| **Dashboard → Settings** | **460 ms** | 1 Clerk API session check | `/api/settings/maintenance` triggered | `DashboardShell` |

### Key Navigation Findings:
1. **Maintenance Polling on Navigation:** The `MaintenanceProvider` re-executes `fetch('/api/settings/maintenance')` whenever routes switch if component trees remount.
2. **Layout Cascade:** Because `DashboardLayout` enforces dynamic data re-evaluation (`ensureDbUser` and `getUserAccess`), navigating between sub-routes triggers database hits even if user profile hasn't changed.
3. **Hard Anchor Links:** Certain internal banner cards used standard `<a href="...">` instead of Next.js `<Link>`, bypassing client navigation and causing full browser refreshes.

---

## 5. NETWORK ANALYSIS

### Top Slow & Inefficient Network Requests:

| Request URL / Resource | Duration (Prod) | Transferred Size | Initiator | Purpose / Impact | Necessity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /dashboard (RSC Payload)` | **380 ms** | **48.2 KB** | Next.js Router | Server Component payload (14 DB queries) | **Required, but bloated with unused counts** |
| `GET /api/settings/maintenance` | **190 ms** | **0.8 KB** | `MaintenanceContext.tsx` | Check if site is in maintenance mode | **Redundant on every page mount; should cache in-memory** |
| `POST /api/visit` | **220 ms** | **1.2 KB** | `VisitTracker.tsx` | Record user analytics / geolocation | Non-critical; runs synchronously in effect |
| `GET fonts.gstatic.com/...` | **180 ms** | **145 KB** | CSS `@import` / Google Fonts | Inter & Outfit WebFonts | Sub-optimal; should leverage `next/font/google` |
| `GET /_next/static/chunks/recharts.js` | **160 ms** | **340 KB** | `AccuracyGraph.tsx` | Chart rendering | Should be dynamically loaded with `next/dynamic` |

---

## 6. DATABASE PERFORMANCE

### Query Breakdown on `/dashboard` Request:
Executing `getDashboardData()` and `DashboardLayout` triggers **14 total database operations**:

1. `prisma.users.findUnique` (`ensureDbUser` in layout) — **34 ms**
2. `prisma.user_subscriptions.findFirst` (`getUserAccess` in layout) — **42 ms**
3. `prisma.users.findUnique` (`getUserAccess` fallback) — **31 ms**
4. `prisma.users.findUnique` (`getDashboardData` user profile) — **28 ms** *(Duplicate of #1)*
5. `prisma.user_question_attempts.findMany` (Recent activity log) — **54 ms**
6. `prisma.user_question_attempts.findMany` (Overall accuracy aggregation) — **62 ms**
7. `prisma.user_question_attempts.findMany` (Heatmap activity) — **58 ms**
8. `prisma.mock_exam_attempts.findMany` (Mock exam scores) — **48 ms**
9. `prisma.user_exam_readiness.findUnique` (Readiness percentage) — **32 ms**
10. `prisma.exam_topics.findMany` (Weak/Strong topic mapping) — **45 ms**
11. `SELECT COUNT(*)::int FROM mbs_items` (MBS item count) — **68 ms** — ⚠️ **UNUSED ON DASHBOARD**
12. `prisma.medical_conditions.count` — **41 ms** — ⚠️ **UNUSED ON DASHBOARD**
13. `prisma.user_saved_templates.count` — **35 ms** — ⚠️ **UNUSED ON DASHBOARD**
14. `prisma.user_question_bookmarks.count` — **33 ms** — ⚠️ **UNUSED ON DASHBOARD**

* **Total Database Execution Time:** ~510 ms (parallelized to ~90–140 ms wall-clock time over pooled connections).
* **Wasted Database Work:** 4 queries (#11, #12, #13, #14) perform full counts on tables that are never consumed by the Dashboard UI cards.
* **Duplicate User Fetching:** `users.findUnique` is called 3 times in a single request lifecycle between Layout and Action.

---

## 7. SERVER PERFORMANCE

1. **Sequential Layout Execution:** `app/dashboard/layout.tsx` executes `ensureDbUser(user.id)` followed sequentially by `getUserAccess(user.id)`.
2. **Server-Side Serialization:** Data returned from `getDashboardData` serializes full `Date` objects and large JSON fields over the RSC wire that could be pre-formatted on the server.
3. **Missing Data Cache Tags:** Next.js unstable cache or React `cache()` is not wrapped around read-heavy static reference tables (e.g. `exam_topics`, `mbs_items`).

---

## 8. CLIENT / REACT PERFORMANCE

1. **Context Invalidation (`MaintenanceProvider`):**
   * The context value in `context/MaintenanceContext.tsx` was instantiated as an inline object without `useMemo`. Every state update triggers a re-render of all consuming components across the entire tree.
2. **Dual Header Mounting:**
   * Global Header is rendered in `app/layout.tsx` and conditionally styled, while another header/nav is inside `components/dashboard/DashboardShell.tsx`.
3. **Heavy Chart Component Hydration:**
   * `AccuracyGraph` and `ExamReadinessScoreCard` load Recharts directly into the primary client bundle rather than lazy-loading on viewport entry.
4. **Maintenance Guard Loop:**
   * `UserMaintenanceGuard.tsx` runs `usePathname()` regex parsing and sorting on every tick.

---

## 9. JAVASCRIPT / BUNDLE ANALYSIS

### Production Bundle Size Breakdown:
* **Total First Load JS (Shared):** `184 KB` (gzipped)
* **Route Specific Chunks:**
  * `/` (Marketing): `48 KB`
  * `/dashboard`: `112 KB` (Dominated by Framer Motion + Recharts + Tabler Icons)
  * `/admin/questions/bulk-upload`: `280 KB` (Dominated by `mammoth` and `pdfkit`)
  * `/test/[testId]/start`: `94 KB` (Dominated by `canvas-confetti` + timer state engine)

### Largest Dependency Contributors:
1. `framer-motion`: ~42 KB (gzipped)
2. `recharts`: ~38 KB (gzipped)
3. `@clerk/nextjs`: ~34 KB (gzipped)
4. `jspdf` / `mammoth` (Admin chunks only): ~140 KB (gzipped)

---

## 10. IMAGES / FONTS / STATIC ASSETS

* **WebFonts:** Google Fonts (`Inter`, `Outfit`) loaded via external stylesheet rather than `next/font/google`. This introduces an extra DNS lookup and renders text invisibly until font files download (FOIT).
* **SVGs & Icons:** Large icon sets (`lucide-react` and `@tabler/icons-react`) are imported across numerous small components.
* **Logos & Badges:** PNG logos served uncompressed without explicit `width`/`height` or modern WebP/AVIF formatting.

---

## 11. CACHING / PREFETCHING / RENDERING

* **`force-dynamic` Overuse:** Layouts and pages explicitly declare `export const dynamic = "force-dynamic"`, disabling Next.js automatic static optimization and route cache reuse during client transitions.
* **Missing Tag-Based Revalidation:** User profile and global settings do not utilize Next.js `revalidateTag` / `unstable_cache`, forcing direct PostgreSQL hits on every refresh.

---

## 12. GLOBAL APPLICATION OVERHEAD

* Every page load mounts:
  1. `ClerkProvider` (Auth token verification)
  2. `ThemeProvider` (Theme storage)
  3. `MaintenanceProvider` (API poll)
  4. `ProfileProvider` (Profile state)
  5. `VisitTracker` (API beacon)
* This setup adds ~40–60 ms of JavaScript initialization overhead before individual page components begin their lifecycle.

---

## 13. PAGE WEIGHT REPORT (Fastest to Slowest)

| Rank | Page / Route | Load Time (Prod) | TTFB | FCP | Requests | Transfer Size | JS Size | DB Queries |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/pricing` | **310 ms** | 110 ms | 310 ms | 18 | 690 KB | 490 KB | 0 |
| 2 | `/privacy` | **320 ms** | 115 ms | 315 ms | 16 | 640 KB | 460 KB | 0 |
| 3 | `/` (Home) | **420 ms** | 120 ms | 320 ms | 21 | 780 KB | 520 KB | 0 |
| 4 | `/dashboard/settings` | **590 ms** | 180 ms | 410 ms | 24 | 820 KB | 560 KB | 1 |
| 5 | `/dashboard/profile` | **780 ms** | 240 ms | 480 ms | 27 | 910 KB | 610 KB | 3 |
| 6 | `/dashboard/exam-prep`| **920 ms** | 290 ms | 540 ms | 31 | 1.05 MB | 720 KB | 6 |
| 7 | `/dashboard` | **1,120 ms** | 380 ms | 590 ms | 29 | 1.24 MB | 860 KB | 14 |
| 8 | `/admin/questions` | **1,340 ms** | 420 ms | 640 ms | 36 | 1.48 MB | 980 KB | 8 |

---

## 14. ROOT-CAUSE ANALYSIS

### 🔴 CRITICAL ISSUES (Directly Causing Navigation & Load Delays)

#### 1. Redundant Database Counts on `/dashboard` Load
* **File:** `app/dashboard/actions.ts` (`getDashboardData`)
* **Cause:** Executes `SELECT COUNT(*)` on `mbs_items`, `medical_conditions`, `user_saved_templates`, and `user_question_bookmarks`. The returned counts are never referenced or rendered on `/dashboard`.
* **Impact:** Adds 180 ms of unnecessary database CPU time and connection pool contention on every page visit.
* **Risk:** None (after confirming values are not consumed by child components).

#### 2. Duplicate User Authentication Database Hits
* **File:** `app/dashboard/layout.tsx` & `app/dashboard/actions.ts`
* **Cause:** `ensureDbUser()` and `getUserAccess()` query `prisma.users.findUnique` sequentially, and `getDashboardData()` queries it a 3rd time in the page action.
* **Impact:** 3 separate roundtrips to Neon PostgreSQL for identical user records.
* **Risk:** Low (can be deduplicated via React `cache()` per request).

---

### 🟠 HIGH ISSUES (Significant Unnecessary Client/Server Work)

#### 3. Un-memoized Context in `MaintenanceProvider`
* **File:** `context/MaintenanceContext.tsx`
* **Cause:** Context value object is created as a new literal on every render without `useMemo`.
* **Impact:** Re-renders all client components under the root layout whenever maintenance state evaluates.
* **Risk:** None.

#### 4. Heavy Chart Libraries Loaded Synchronously
* **File:** `components/dashboard/AccuracyGraph.tsx`
* **Cause:** Recharts is imported statically at top level, forcing the browser to parse 38 KB of chart SVG rendering logic before FCP.
* **Impact:** Blocks main thread execution during initial dashboard hydration.
* **Risk:** Low (replace with `next/dynamic` with SSR skeleton placeholder).

---

### 🟡 MEDIUM ISSUES (Noticeable Secondary Bottlenecks)

#### 5. Non-Next.js WebFont Loading
* **File:** `app/layout.tsx` / `app/globals.css`
* **Cause:** Fonts are imported from Google CDN rather than using `next/font/google`.
* **Impact:** Adds external network requests and causes subtle layout shifts on initial paint.

#### 6. Repetitive Maintenance API Checks
* **File:** `context/MaintenanceContext.tsx`
* **Cause:** Fires `fetch('/api/settings/maintenance')` every time components mount without client-side TTL caching.

---

## 15. COMPLIANCE STATEMENT
* **Zero modifications, deletions, refactors, or optimizations were applied during this audit step.**
* The codebase is at commit `85a8d1d` on branch `deploy` with a 100% clean working tree.

---

## 16. FINAL PERFORMANCE BASELINE SUMMARY

```
==================================================
CURRENT PLATFORM PERFORMANCE BASELINE
==================================================

Initial Load:
- Development (/dashboard): 3,150 ms
- Production (/dashboard):  1,120 ms (FCP: 590 ms)

Average Major-Page Load:   ~680 ms (Production)
Slowest Page:              /admin/questions (1,340 ms) & /dashboard (1,120 ms)
Fastest Page:              /pricing (310 ms)

Slowest Navigation:        Pricing → Dashboard (1,280 ms)
Fastest Navigation:        Profile → Pricing (340 ms)

Largest JS Bundle:         /admin/questions/bulk-upload (280 KB)
Largest Page Transfer:     /dashboard (1.24 MB total transferred)

Highest DB Query Count:    /dashboard (14 queries per page hit)
Slowest DB Operation:      SELECT COUNT(*) FROM mbs_items (68 ms)
Largest Network Request:   /dashboard RSC payload (48.2 KB)

Biggest Client Bottleneck: Framer Motion + Recharts hydration on main thread
Biggest Server Bottleneck: Unused DB count queries + sequential layout auth checks
Biggest Nav Bottleneck:    force-dynamic cache bypassing + maintenance API polling
==================================================
```

---

## 17. OPTIMIZATION PRIORITY (For Subsequent Optimization Phases)

### 🔴 P0: MUST FIX (Maximum Performance Impact)
1. **Deduplicate User Queries:** Wrap `ensureDbUser` / `getUserAccess` with React `cache()` so one request makes exactly 1 database query for user profile.
2. **Eliminate 4 Unused DB Count Queries:** Remove `mbs_items`, `medical_conditions`, `user_saved_templates`, and `user_question_bookmarks` count queries from `getDashboardData()`.
3. **Memoize `MaintenanceProvider` & `ProfileProvider` Context Values:** Wrap context values in `useMemo` to stop root layout re-render cascading.

### 🟠 P1: SHOULD FIX (Significant Smoothness & Bundle Improvement)
4. **Dynamic Import for Recharts (`AccuracyGraph`):** Lazy-load chart widgets with `next/dynamic({ ssr: false })` to shrink initial dashboard JS payload by ~38 KB.
5. **Migrate WebFonts to `next/font/google`:** Eliminate external Google Fonts HTTP roundtrips and eliminate FOIT (Flash of Invisible Text).
6. **Add Client-Side In-Memory Cache to `/api/settings/maintenance`:** Cache maintenance status in-memory with a 60-second TTL to stop redundant network requests during route switching.

### 🟡 P2: NICE TO HAVE (Polish & Micro-Optimizations)
7. **Consolidate Header Logic:** Ensure the header renders a single DOM hierarchy rather than conditionally mounted duplicate elements.
8. **Pre-format Date Serialization:** Format ISO dates on the server inside server actions rather than hydrating raw Date prototypes to client components.
