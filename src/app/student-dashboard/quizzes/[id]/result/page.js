"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleX } from "lucide-react";
import { useAppContext } from "../../../../../components/app-provider";
import api from "../../../../../lib/api";

export default function StudentQuizResultPage() {
  const params = useParams();
  const { auth } = useAppContext();
  const [attempt, setAttempt] = useState(null);
  const [message, setMessage] = useState("Loading quiz result...");

  useEffect(() => {
    const load = async () => {
      if (!auth?.token || !params?.id) {
        return;
      }

      const response = await api.get(`/student/quiz-attempts/${params.id}/result`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setAttempt(response.data.attempt);
      setMessage("");
    };

    load().catch((error) => {
      setMessage(error.response?.data?.message || "Unable to load quiz result.");
    });
  }, [auth?.token, params?.id]);

  if (!attempt) {
    return <div className="surface-card rounded-[24px] p-6">{message}</div>;
  }

  const quiz = attempt.quizAssignment;

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Quiz Result</p>
            <h1 className="mt-3 text-4xl font-semibold">{quiz.title}</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Score {attempt.score}/{attempt.totalMarks} | Percentage {attempt.percentage}% | {attempt.isPassed ? "Passed" : "Not passed"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/student-dashboard/results"
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
            >
              Back to results
            </Link>
            <Link
              href={`/student-dashboard/quizzes/${quiz._id}`}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              Quiz overview
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card rounded-[22px] p-5">
          <p className="text-sm text-[var(--muted)]">Course</p>
          <p className="mt-3 text-xl font-semibold">{quiz.course?.title || "N/A"}</p>
        </div>
        <div className="surface-card rounded-[22px] p-5">
          <p className="text-sm text-[var(--muted)]">Batch</p>
          <p className="mt-3 text-xl font-semibold">{quiz.batch?.batchName || "N/A"}</p>
        </div>
        <div className="surface-card rounded-[22px] p-5">
          <p className="text-sm text-[var(--muted)]">Submitted At</p>
          <p className="mt-3 text-xl font-semibold">
            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="surface-card rounded-[22px] p-5">
          <p className="text-sm text-[var(--muted)]">Teacher</p>
          <p className="mt-3 text-xl font-semibold">{quiz.teacher?.name || "Teacher"}</p>
        </div>
      </div>

      <section className="space-y-4">
        {quiz.questions.map((question, index) => (
          <article key={question._id} className="surface-card rounded-[24px] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Question {index + 1}</p>
                <h2 className="mt-2 text-xl font-semibold">{question.questionText}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {question.skill?.name || "Skill"} | {question.topicTitle} | {question.marks} marks
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                  question.submittedAnswer?.isCorrect
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-700"
                }`}
              >
                {question.submittedAnswer?.isCorrect ? <CheckCircle2 size={16} /> : <CircleX size={16} />}
                {question.submittedAnswer?.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {question.type === "short_answer" ? (
                <>
                  <div className="rounded-[18px] border border-[var(--border)] p-4">
                    <p className="text-sm font-medium">Your answer</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {question.submittedAnswer?.answerText || "No answer submitted"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border)] p-4">
                    <p className="text-sm font-medium">Correct answer</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{question.correctAnswerText || "Not available"}</p>
                  </div>
                </>
              ) : (
                question.options.map((option) => {
                  const isSelected = (question.submittedAnswer?.selectedOptionIds || []).some(
                    (selectedId) => String(selectedId) === String(option._id)
                  );
                  return (
                    <div
                      key={option._id}
                      className={`rounded-[18px] border px-4 py-4 text-sm ${
                        option.isCorrect
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : isSelected
                            ? "border-amber-400/40 bg-amber-500/10"
                            : "border-[var(--border)]"
                      }`}
                    >
                      {option.text}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 rounded-[18px] bg-[var(--accent)]/8 p-4">
              <p className="text-sm font-medium text-[var(--accent)]">Explanation</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {question.explanation || "No explanation provided for this question."}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
