"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";

export default function TeacherDashboard() {
  const { auth } = useAppContext();
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    batches: 0,
    skills: 0,
  });

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const headers = { Authorization: `Bearer ${auth.token}` };
      const [studentsRes, coursesRes, batchesRes, skillsRes] = await Promise.all([
        api.get("/students", { headers }),
        api.get("/courses", { headers }),
        api.get("/batches", { headers }),
        api.get("/skills", { headers }),
      ]);

      setStats({
        students: studentsRes.data.students?.length || 0,
        courses: coursesRes.data.courses?.length || 0,
        batches: batchesRes.data.batches?.length || 0,
        skills: skillsRes.data.skills?.length || 0,
      });
    };

    load().catch(() => null);
  }, [auth]);

  const cards = [
    { label: "Students", value: stats.students },
    { label: "Courses", value: stats.courses },
    { label: "Batches", value: stats.batches },
    { label: "Skills", value: stats.skills },
  ];

  return (
    <div className="space-y-6">
      <div className="surface-card theme-transition rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Overview</p>
        <h1 className="mt-3 text-4xl font-semibold">Teacher dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
          Manage students, batches, courses, and skills from one place. These numbers are
          loaded directly from your backend APIs.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="surface-card theme-transition rounded-[24px] p-6">
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
