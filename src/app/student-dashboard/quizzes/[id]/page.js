"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlarmClock, BookOpenText, CircleHelp, Layers3, UserSquare2 } from "lucide-react";
import { useAppContext } from "../../../../components/app-provider";
import api from "../../../../lib/api";

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
};

export default function StudentQuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { auth } = useAppContext();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token || !params?.id) {
        return;
      }

      const response = await api.get(`/student/quizzes/${params.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setQuiz(response.data.quizAssignment);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [auth, params?.id]);

  const topics = useMemo(() => {
    if (!quiz?.questions) {
      return [];
    }

    return Array.from(new Set(quiz.questions.map((question) => question.topicTitle)));
  }, [quiz]);

  if (loading) {
    return <div className="surface-card rounded-[24px] p-6">Loading quiz details...</div>;
  }

  if (!quiz) {
    return <div className="surface-card rounded-[24px] p-6">Quiz details could not be loaded.</div>;
  }

  const metaCards = [
    {
      label: "Course",
      value: quiz.course?.title || "N/A",
      icon: BookOpenText,
    },
    {
      label: "Batch",
      value: quiz.batch?.batchName || "N/A",
      icon: Layers3,
    },
    {
      label: "Assigned By",
      value: quiz.teacher?.name || "Teacher",
      icon: UserSquare2,
    },
    {
      label: "Questions",
      value: quiz.questions?.length || 0,
      icon: CircleHelp,
    },
    {
      label: "Timer",
      value: `${quiz.durationInMinutes} mins`,
      icon: AlarmClock,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-[28px] p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Quiz overview</p>
            <h1 className="mt-3 text-4xl font-semibold">{quiz.title}</h1>
            <p className="mt-4 max-w-3xl text-sm text-[var(--muted)]">
              {quiz.description || "No description provided for this quiz."}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/student-dashboard"
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={() => router.push(`/student-dashboard/quizzes/${quiz._id}/attempt`)}
              disabled={quiz.alreadySubmitted}
              className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {quiz.alreadySubmitted ? "Already attempted" : "Take quiz"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {metaCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card rounded-[24px] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{card.label}</p>
                <Icon size={18} className="text-[var(--accent)]" />
              </div>
              <p className="mt-4 text-xl font-semibold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="surface-card rounded-[24px] p-6">
          <h2 className="text-2xl font-semibold">Quiz details</h2>
          <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
            <p>Assigned To: {auth?.user?.name || "Student"}</p>
            <p>Assigned By: {quiz.teacher?.name || "Teacher"} ({quiz.teacher?.email || "No email"})</p>
            <p>Starts At: {formatDateTime(quiz.startAt)}</p>
            <p>Ends At: {formatDateTime(quiz.endAt)}</p>
            <p>Pass Marks: {quiz.passMarks}</p>
            <p>Total Marks: {quiz.totalMarks}</p>
            <p>Status: {quiz.status}</p>
          </div>

          <div className="mt-6 rounded-[20px] border border-[var(--border)] p-5">
            <h3 className="text-lg font-semibold">Instructions</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {quiz.instructions || "Read every question carefully, manage your timer, and submit once you finish."}
            </p>
          </div>
        </section>

        <section className="surface-card rounded-[24px] p-6">
          <h2 className="text-2xl font-semibold">Topics covered</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {topics.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No topics available.</p>
            ) : (
              topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-[var(--accent)]/15 px-4 py-2 text-sm text-[var(--accent)]"
                >
                  {topic}
                </span>
              ))
            )}
          </div>

          <div className="mt-8 space-y-3">
            {quiz.questions?.map((question, index) => (
              <div key={question._id} className="rounded-[18px] border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted)]">
                  Q{index + 1} | {question.skill?.name || "Skill"} | {question.marks} marks
                </p>
                <p className="mt-2 text-sm">{question.questionText}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
