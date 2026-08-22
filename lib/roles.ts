export type RoleCode = "SA" | "CE" | "OM" | "DR" | "PR" | "SUB";

export interface RoleDefinition {
  code: RoleCode;
  title: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  SA: {
    code: "SA",
    title: "Super Admin",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
    desc: "Full administrative and financial authority",
  },
  CE: {
    code: "CE",
    title: "Clinical Editor",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    desc: "Clinical oversight and work acceptance",
  },
  OM: {
    code: "OM",
    title: "Operations Manager",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    desc: "Operational task assignment and pipeline management",
  },
  DR: {
    code: "DR",
    title: "Drafter",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    desc: "Drafts medical questions and condition items",
  },
  PR: {
    code: "PR",
    title: "Peer Reviewer",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Reviews drafted items and completes rubrics",
  },
  SUB: {
    code: "SUB",
    title: "Subscriber",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    desc: "End-user subscriber accessing published material",
  },
};
