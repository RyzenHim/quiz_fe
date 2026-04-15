"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Code2, Layers, ListChecks, Users } from "lucide-react";
import { useAppContext } from "../../components/app-provider";
import { getCached } from "../../lib/api";
import { EntityCard, EntitySection, PageHeader, StatCard } from "../../components/ui-kit";

export default function TeacherDashboard() {
  const { auth } = useAppContext();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const response = await getCached("/teacher/analytics", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setAnalytics(response.data);
    };

    load().catch(() => null);
  }, [auth?.token]);

  const summary = analytics?.summary || {};
  const cards = [
    { label: "Students", value: summary.students || 0, icon: Users },
    { label: "Courses", value: summary.courses || 0, icon: BookOpen },
    { label: "Batches", value: summary.batches || 0, icon: Layers },
    { label: "Skills", value: summary.skills || 0, icon: Code2 },
    { label: "Questions", value: summary.questions || 0, icon: ListChecks },
    { label: "Quiz Average", value: `${summary.overallQuizAverage || 0}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Teacher analytics and reporting"
        description="This dashboard now summarizes quiz performance, practice activity, and weaker topics from the backend in one request."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <EntitySection
          title="Quiz Performance"
          items={analytics?.quizPerformance || []}
          emptyText="No quiz performance data yet."
        >
          {(quiz) => (
            <EntityCard
              key={quiz.quizAssignmentId}
              title={quiz.title}
              subtitle={`${quiz.courseTitle} | ${quiz.batchName} | Attempts: ${quiz.attempts}`}
              meta={`Average ${quiz.averagePercentage}% | Pass rate ${quiz.passRate}%`}
            />
          )}
        </EntitySection>

        <EntitySection
          title="Lower-Scoring Topics"
          items={analytics?.topicPerformance || []}
          emptyText="No topic analytics yet."
        >
          {(topic) => (
            <EntityCard
              key={topic.topicTitle}
              title={topic.topicTitle}
              subtitle={`Questions: ${topic.questionCount} | Attempts: ${topic.attempts}`}
              meta={`Average score ${topic.averagePercentage}%`}
            />
          )}
        </EntitySection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <EntitySection
          title="Recent Quiz Attempts"
          items={analytics?.recentAttempts || []}
          emptyText="No recent quiz attempts."
        >
          {(attempt) => (
            <EntityCard
              key={attempt._id}
              title={attempt.student?.name || "Student"}
              subtitle={`${attempt.quizAssignment?.title || "Quiz"} | ${attempt.student?.email || "No email"}`}
              meta={`${attempt.percentage || 0}% | ${attempt.isPassed ? "Passed" : "Failed"}`}
            />
          )}
        </EntitySection>

        <EntitySection
          title="Practice Topic Activity"
          items={analytics?.practiceSummary?.topTopics || []}
          emptyText="No practice activity yet."
          count={analytics?.practiceSummary?.totalAttempts || 0}
        >
          {(topic) => (
            <EntityCard
              key={topic.topicTitle}
              title={topic.topicTitle}
              subtitle={`Attempts: ${topic.attempts} | Correct: ${topic.correct}`}
              meta={`Practice accuracy ${topic.accuracy}%`}
            />
          )}
        </EntitySection>
      </div>
    </div>
  );
}
