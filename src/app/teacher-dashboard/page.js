"use client";

import { useEffect, useState } from "react";
import { BookOpen, Code2, Layers, Users } from "lucide-react";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";
import { PageHeader, StatCard } from "../../components/ui-kit";

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
  }, [auth?.token]);

  const cards = [
    { label: "Students", value: stats.students, icon: Users },
    { label: "Courses", value: stats.courses, icon: BookOpen },
    { label: "Batches", value: stats.batches, icon: Layers },
    { label: "Skills", value: stats.skills, icon: Code2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Teacher control room with a calmer visual rhythm"
        description="These totals are still coming directly from the backend APIs, but the UI now uses a softer neumorphic shell to make the dashboard feel less mechanical."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>
    </div>
  );
}
