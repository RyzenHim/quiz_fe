"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";

export default function StudentDashboard() {
  const { auth } = useAppContext();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const response = await api.get("/student/quizzes", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setQuizzes(response.data.quizzes || []);
    };

    load().catch(() => null);
  }, [auth]);

  return (
    <div className="space-y-6">
      <div className="surface-card theme-transition rounded-[28px] p-8">
        <h2 className="text-3xl font-semibold">Assigned quizzes</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Your teacher-assigned quizzes appear here after login.
        </p>
      </div>

      <div className="grid gap-5">
        {quizzes.length === 0 ? (
          <div className="surface-card rounded-[24px] p-6 text-sm text-[var(--muted)]">
            No quizzes assigned yet.
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="surface-card rounded-[24px] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{quiz.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Course: {quiz.course?.title || "N/A"} | Duration: {quiz.durationInMinutes} mins
                  </p>
                </div>
                <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                  {quiz.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
