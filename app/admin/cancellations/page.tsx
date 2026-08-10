import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface CancellationRow {
  id: string;
  user_id: string;
  reason: string;
  feedback: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  training_stage: string | null;
}

export default async function AdminCancellationsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  // Fetch cancellation feedback records via raw SQL (bypasses Prisma client cache issues)
  let cancellations: CancellationRow[] = [];
  try {
    cancellations = await query<CancellationRow>(
      `SELECT
         cf.id, cf.user_id, cf.reason, cf.feedback, cf.created_at,
         u.first_name, u.last_name, u.email, u.training_stage
       FROM cancellation_feedback cf
       LEFT JOIN users u ON u.id = cf.user_id
       ORDER BY cf.created_at DESC`
    );
  } catch (err) {
    console.error("Failed to fetch cancellation feedback:", err);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
          Cancellation Feedback
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review reasons why users have canceled their active subscriptions.
        </p>
      </div>

      <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {cancellations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              No cancellations yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              When users cancel, their feedback will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    User
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    Stage
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    Reason
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    Additional Feedback
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {cancellations.map((item: CancellationRow) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {item.first_name} {item.last_name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.training_stage ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-400 line-clamp-3 max-w-sm">
                        {item.feedback || <span className="italic text-slate-400">None provided</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                      {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
