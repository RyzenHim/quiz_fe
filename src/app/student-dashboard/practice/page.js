"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpenCheck } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function PracticeQuizPage() {
  const { auth } = useAppContext();
  const [alignedCourses, setAlignedCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        return;
      }

      const response = await api.get("/student/practice/topics", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setAlignedCourses(response.data.alignedCourses || []);
      setLoadingTopics(false);
    };

    load().catch(() => setLoadingTopics(false));
  }, [auth?.token]);

  const selectedCourse = useMemo(
    () => alignedCourses.find((course) => course._id === selectedCourseId),
    [alignedCourses, selectedCourseId]
  );

  const availableSkills = useMemo(() => selectedCourse?.skills || [], [selectedCourse]);

  const selectedSkill = useMemo(
    () => availableSkills.find((skill) => skill._id === selectedSkillId),
    [availableSkills, selectedSkillId]
  );

  const availableTopics = useMemo(() => selectedSkill?.topics || [], [selectedSkill]);
  const selectedTopic = useMemo(() => availableTopics.find((topic) => topic._id === selectedTopicId), [
    availableTopics,
    selectedTopicId,
  ]);

  const practiceSummary = useMemo(() => {
    if (!selectedCourse) {
      return "Choose a course to preview the practice pool.";
    }

    if (selectedTopic && selectedSkill) {
      return `Questions will be randomly shown only from the ${selectedTopic.title} topic inside the ${selectedSkill.name} skill for ${selectedCourse.title}.`;
    }

    if (selectedSkill) {
      return `Questions will be randomly shown from any topic inside the ${selectedSkill.name} skill for ${selectedCourse.title}.`;
    }

    return `Questions will be randomly shown from any aligned skill and any aligned topic inside ${selectedCourse.title}.`;
  }, [selectedCourse, selectedSkill, selectedTopic]);

  const handleLaunchPractice = () => {
    if (!selectedCourse) {
      return;
    }

    setLaunching(true);

    const params = new URLSearchParams({
      courseId: selectedCourse._id,
    });

    if (selectedSkill) {
      params.set("skillId", selectedSkill._id);
    }

    if (selectedTopic) {
      params.set("topicId", selectedTopic._id);
    }

    window.open(`/student-practice?${params.toString()}`, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setLaunching(false), 250);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Practice Quiz</p>
        <h2 className="mt-3 text-4xl font-semibold">Launch a focused practice window from your aligned learning map</h2>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          Pick a course first, then optionally narrow it by skill and topic. The practice session opens
          in a separate page and shows one question at a time with answer submission and feedback.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="surface-card rounded-[24px] p-6">
          <h3 className="text-2xl font-semibold">Choose your practice scope</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Students only see courses, skills, and topics aligned to their current batch.
          </p>

          {loadingTopics ? (
            <p className="mt-6 text-sm text-[var(--muted)]">Loading aligned learning map...</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Aligned course</label>
                <select
                  value={selectedCourseId}
                  onChange={(event) => {
                    setSelectedCourseId(event.target.value);
                    setSelectedSkillId("");
                    setSelectedTopicId("");
                  }}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
                >
                  <option value="">Select course</option>
                  {alignedCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Aligned skill</label>
                <select
                  value={selectedSkillId}
                  disabled={!selectedCourse}
                  onChange={(event) => {
                    setSelectedSkillId(event.target.value);
                    setSelectedTopicId("");
                  }}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 disabled:opacity-60"
                >
                  <option value="">Any skill from this course</option>
                  {availableSkills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Aligned topic</label>
                <select
                  value={selectedTopicId}
                  disabled={!selectedSkill}
                  onChange={(event) => {
                    setSelectedTopicId(event.target.value);
                  }}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 disabled:opacity-60"
                >
                  <option value="">Any topic from this skill</option>
                  {availableTopics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourse ? (
                <div className="rounded-[20px] border border-[var(--border)] p-5">
                  <p className="text-lg font-semibold">Practice scope preview</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Course: {selectedCourse.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Skill: {selectedSkill?.name || "Any skill aligned to this course"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Topic: {selectedTopic?.title || "Any topic aligned to this selection"}
                  </p>
                  <p className="mt-4 text-sm text-[var(--muted)]">{practiceSummary}</p>

                  <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
                    <div className="rounded-2xl bg-[var(--accent)]/8 px-4 py-3">
                      <p className="font-medium text-[var(--accent)]">Course description</p>
                      <p className="mt-1">{selectedCourse.description || "No course description provided."}</p>
                    </div>

                    {selectedSkill ? (
                      <div className="rounded-2xl bg-[var(--surface-strong)] px-4 py-3">
                        <p className="font-medium text-[var(--foreground)]">Skill description</p>
                        <p className="mt-1">{selectedSkill.description || "No skill description provided."}</p>
                      </div>
                    ) : null}

                    {selectedTopic ? (
                      <div className="rounded-2xl bg-[var(--surface-strong)] px-4 py-3">
                        <p className="font-medium text-[var(--foreground)]">Topic description</p>
                        <p className="mt-1">{selectedTopic.description || "No topic description provided."}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleLaunchPractice}
                disabled={!selectedCourse || launching}
                className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  {launching ? "Opening practice window..." : "Load practice quiz"}
                  <ArrowUpRight size={16} />
                </span>
              </button>
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="surface-card rounded-[24px] p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
              <BookOpenCheck size={16} />
              Practice behavior
            </div>
            <h3 className="mt-4 text-2xl font-semibold">How the new practice flow works</h3>
            <div className="mt-4 space-y-4 text-sm text-[var(--muted)]">
              <p>If only the course is selected, questions are randomly picked from any aligned skill and topic in that course.</p>
              <p>If the course and skill are selected, questions are randomly picked only from that skill inside the selected course.</p>
              <p>If course, skill, and topic are selected, questions are filtered all the way down to that exact topic.</p>
              <p>The practice window shows one question at a time with only the question, its options, and a submit answer button.</p>
              <p>If the answer is correct, the student sees a success message. If the answer is wrong, the correct answer and explanation are shown immediately.</p>
            </div>
          </div>

          <div className="surface-card rounded-[24px] p-6 text-sm text-[var(--muted)]">
            {selectedCourse ? practiceSummary : "Select a course to preview the question pool before launching practice."}
          </div>
        </section>
      </div>
    </div>
  );
}
