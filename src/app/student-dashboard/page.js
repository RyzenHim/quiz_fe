"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Clock3, FileText, Layers3, Target } from "lucide-react";
import { useAppContext } from "../../components/app-provider";
import { getCached } from "../../lib/api";
import { SectionLoader } from "../../components/loaders";

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
};

export default function StudentDashboard() {
  const { auth, updateAuthUser } = useAppContext();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const response = await getCached("/student/dashboard", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setDashboard(response.data.dashboard);
      if (response.data.student) {
        updateAuthUser(response.data.student);
      }
      setErrorMessage("");
      setLoading(false);
    };

    load().catch((error) => {
      setErrorMessage(error.response?.data?.message || "Unable to load dashboard.");
      setLoading(false);
    });
  }, [auth?.token, updateAuthUser]);

  if (loading) {
    return (
      <SectionLoader
        title="Loading dashboard"
        description="Pulling your batch, quizzes, and practice activity."
      />
    );
  }

  if (!dashboard) {
    return <div className="surface-card rounded-[24px] p-6">{errorMessage || "Unable to load dashboard."}</div>;
  }

  const cards = [
    {
      label: "Assigned Quizzes",
      value: dashboard.assignedQuizCount || 0,
      icon: FileText,
    },
    {
      label: "Upcoming Quizzes",
      value: dashboard.upcomingQuizCount || 0,
      icon: Clock3,
    },
    {
      label: "Batch",
      value: dashboard.batch?.batchName || "N/A",
      icon: Layers3,
    },
    {
      label: "Aligned Courses",
      value: dashboard.alignedCourses?.length || 0,
      icon: BookOpen,
    },
    {
      label: "Practice Attempts",
      value: dashboard.practiceAttemptCount || 0,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Dashboard</p>
        <h2 className="mt-3 text-4xl font-semibold">Your batch and quiz overview</h2>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          This dashboard now comes directly from the backend and shows the batch you are
          assigned to, the courses aligned to that batch, and the quizzes available to you.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card rounded-[24px] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{card.label}</p>
                <Icon size={18} className="text-[var(--accent)]" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Batch details</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your current assigned batch and the courses linked to it.
              </p>
            </div>
            <Link
              href="/student-dashboard/profile"
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
            >
              Profile
            </Link>
          </div>

          <div className="mt-6 rounded-[22px] border border-[var(--border)] p-5">
            <p className="text-sm text-[var(--muted)]">Batch Name</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.batch?.batchName || "Not assigned"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Code: {dashboard.batch?.batchCode || "N/A"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Description: {dashboard.batch?.description || "No description available."}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {!dashboard.batch ? (
              <div className="surface-soft rounded-[20px] p-5 text-sm text-[var(--muted)]">
                You are not aligned to any batch yet. Ask your teacher to assign you to a batch to unlock courses, topics, practice, and quizzes.
              </div>
            ) : null}
            {(dashboard.alignedCourses || []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No courses aligned to this batch yet.</p>
            ) : (
              dashboard.alignedCourses.map((course) => (
                <div key={course._id} className="surface-soft rounded-[20px] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-xl font-semibold">{course.title}</h4>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {course.category || "General"} | {course.level || "beginner"}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Skills: {(course.skills || []).map((skill) => skill.name).join(", ") || "No skills"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                      {course.status || "active"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface-card rounded-[24px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">Recent assigned quizzes</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Open any assigned quiz and review its details before attempting it.
                </p>
              </div>
              <Link
                href="/student-dashboard/upcoming"
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                View upcoming
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {(dashboard.recentQuizzes || []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No quizzes assigned yet.</p>
              ) : (
                dashboard.recentQuizzes.map((quiz) => (
                  <div key={quiz._id} className="surface-soft rounded-[20px] p-5">
                    <p className="text-lg font-semibold">{quiz.title}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Course: {quiz.course?.title || "N/A"} | Starts: {formatDateTime(quiz.startAt)}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                        {quiz.status}
                      </span>
                      <Link
                        href={`/student-dashboard/quizzes/${quiz._id}`}
                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-card rounded-[24px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">Practice by topic</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Practice questions come from the topics aligned to your batch courses.
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                Accuracy {dashboard.practiceAttemptCount > 0
                  ? `${Math.round((dashboard.practiceCorrectCount / dashboard.practiceAttemptCount) * 100)}%`
                  : "0%"}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {(dashboard.recentPractice || []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No practice attempts yet.</p>
              ) : (
                dashboard.recentPractice.map((attempt) => (
                  <div key={attempt._id} className="surface-soft rounded-[18px] p-4">
                    <p className="text-sm font-semibold">{attempt.questionText}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {attempt.course?.title || "Course"} | {attempt.skill?.name || "Skill"} | {attempt.topicTitle || "Topic"}
                    </p>
                    <p className={`mt-2 text-sm ${attempt.isCorrect ? "text-emerald-600" : "text-amber-700"}`}>
                      {attempt.isCorrect ? "Correct practice answer" : "Needs revision"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/student-dashboard/practice"
                className="inline-flex rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                Start practice
              </Link>
              <Link
                href="/student-dashboard/results"
                className="inline-flex rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"
              >
                View results
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
