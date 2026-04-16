"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, Layers3 } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import { SectionLoader } from "../../../components/loaders";

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
};

export default function UpcomingQuizzesPage() {
  const { auth } = useAppContext();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const response = await api.get("/student/quizzes/upcoming", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setQuizzes(response.data.quizzes || []);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [auth?.token]);

  if (loading) {
    return (
      <SectionLoader
        title="Loading upcoming quizzes"
        description="Checking scheduled quizzes assigned to your batch."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Upcoming Quiz</p>
        <h2 className="mt-3 text-4xl font-semibold">Quizzes lined up for your batch</h2>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          These are the scheduled or published quizzes assigned to you from the backend.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="surface-card rounded-[24px] p-6">
          <p className="text-sm text-[var(--muted)]">Total upcoming quizzes</p>
          <p className="mt-4 text-4xl font-semibold">{quizzes.length}</p>
        </div>
        <div className="surface-card rounded-[24px] p-6">
          <p className="text-sm text-[var(--muted)]">Current batch</p>
          <p className="mt-4 text-4xl font-semibold">{auth?.user?.batch?.batchName || "N/A"}</p>
        </div>
      </div>

      <section className="grid gap-5">
        {quizzes.length === 0 ? (
          <div className="surface-card rounded-[24px] p-6 text-sm text-[var(--muted)]">
            No upcoming quizzes found right now.
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="surface-card rounded-[24px] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">{quiz.title}</h3>
                  <p className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock size={16} className="text-[var(--accent)]" />
                      {formatDateTime(quiz.startAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Layers3 size={16} className="text-[var(--accent)]" />
                      {quiz.batch?.batchName || "N/A"}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Course: {quiz.course?.title || "N/A"} | Duration: {quiz.durationInMinutes} mins
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                    {quiz.status}
                  </span>
                  <Link
                    href={`/student-dashboard/quizzes/${quiz._id}`}
                    className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
