import { fetchQuizzesFromDbAction } from "@/actions/quiz.actions";
import ExamPrepClient, { type QuizItem } from "./ExamPrepClient";

export const dynamic = "force-dynamic";

export default async function ExamPrepDashboard() {
  const initialQuizzes = await fetchQuizzesFromDbAction();

  return <ExamPrepClient initialQuizzes={initialQuizzes as unknown as QuizItem[]} />;
}
