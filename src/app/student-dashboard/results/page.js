"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, History, Trophy, XCircle } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import { getCached } from "../../../lib/api";

export default function StudentResultsPage() {
  const { auth } = useAppContext();
  const [quizData, setQuizData] = useState(null);
  const [practiceData, setPracticeData] = useState(null);
  const [message, setMessage] = useState("Loading results...");

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const headers = {
        Authorization: `Bearer ${auth.token}`,
      };

      const [resultsRes, practiceRes] = await Promise.all([
        getCached("/student/results", { headers }),
        getCached("/student/practice/history", { headers }),
      ]);

      setQuizData(resultsRes.data);
      setPracticeData(practiceRes.data);
      setMessage("");
    };

    load().catch((error) => {
      setMessage(error.response?.data?.message || "Unable to load results.");
    });
  }, [auth?.token]);

  if (!quizData || !practiceData) {
    return <div className="surface-card rounded-[24px] p-6">{message}</div>;
  }

  const cards = [
    {
      label: "Quiz Attempts",
      value: quizData.summary?.totalAttempts || 0,
      icon: Trophy,
    },
    {
      label: "Passed Quizzes",
      value: quizData.summary?.passedAttempts || 0,
      icon: CheckCircle2,
    },
    {
      label: "Practice Accuracy",
      value: `${practiceData.summary?.accuracy || 0}%`,
      icon: History,
    },
    {
      label: "Incorrect Practice",
      value: practiceData.summary?.incorrectAttempts || 0,
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Results</p>
        <h1 className="mt-3 text-4xl font-semibold">Quiz scores and practice history</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          Review your quiz outcomes, pass rate, and the recent practice questions you attempted.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="surface-card rounded-[22px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{card.label}</p>
                <Icon size={18} className="text-[var(--accent)]" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Quiz result history</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Open any attempted quiz to review correct and incorrect answers.
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
              Average {quizData.summary?.averagePercentage || 0}%
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {(quizData.attempts || []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No quiz attempts yet.</p>
            ) : (
              quizData.attempts.map((attempt) => (
                <div key={attempt._id} className="surface-soft rounded-[18px] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{attempt.quizAssignment?.title || "Quiz"}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {attempt.quizAssignment?.course?.title || "Course"} | {attempt.quizAssignment?.batch?.batchName || "Batch"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                        {attempt.percentage || 0}%
                      </span>
                      <Link
                        href={`/student-dashboard/quizzes/${attempt.quizAssignment?._id}/result`}
                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                      >
                        View result
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface-card rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Practice history</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your latest practice questions and the topics they came from.
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
              {practiceData.summary?.totalAttempts || 0} attempts
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {(practiceData.attempts || []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No practice attempts yet.</p>
            ) : (
              practiceData.attempts.slice(0, 12).map((attempt) => (
                <div key={attempt._id} className="surface-soft rounded-[18px] p-4">
                  <p className="text-sm font-semibold">{attempt.questionText}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {attempt.course?.title || "Course"} | {attempt.skill?.name || "Skill"} | {attempt.topicTitle || "Topic"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium ${attempt.isCorrect ? "text-emerald-600" : "text-amber-700"}`}>
                      {attempt.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(attempt.submittedAt || attempt.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
