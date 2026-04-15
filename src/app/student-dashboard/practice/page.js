"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, RefreshCcw } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";

export default function PracticeQuizPage() {
  const { auth } = useAppContext();
  const [topics, setTopics] = useState([]);
  const [selectedTopicKey, setSelectedTopicKey] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

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

      setTopics(response.data.topics || []);
      setLoadingTopics(false);
    };

    load().catch(() => setLoadingTopics(false));
  }, [auth?.token]);

  const selectedTopic = useMemo(
    () => topics.find((topic) => `${topic.skill._id}:${topic._id}` === selectedTopicKey),
    [selectedTopicKey, topics]
  );

  const totalAnswered = useMemo(
    () =>
      questions.filter((question) => {
        const currentAnswer = answers[question._id];
        if (!currentAnswer) {
          return false;
        }

        if (question.type === "short_answer") {
          return Boolean(currentAnswer.answerText?.trim());
        }

        return (currentAnswer.selectedOptionIds || []).length > 0;
      }).length,
    [answers, questions]
  );

  const loadPracticeQuestions = async () => {
    if (!selectedTopic || !auth?.token) {
      return;
    }

    setLoadingQuestions(true);

    try {
      const response = await api.get("/student/practice/questions", {
        params: {
          topicId: selectedTopic._id,
          skillId: selectedTopic.skill._id,
        },
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setQuestions(response.data.questions || []);
      setAnswers({});
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Practice Quiz</p>
        <h2 className="mt-3 text-4xl font-semibold">Practice by topic from your batch courses</h2>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          Topics are loaded from the skills attached to the courses aligned with your batch.
          Pick a topic and the backend will return matching practice questions.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="surface-card rounded-[24px] p-6">
          <h3 className="text-2xl font-semibold">Choose a topic</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Practice is scoped to topics you are actually studying.
          </p>

          {loadingTopics ? (
            <p className="mt-6 text-sm text-[var(--muted)]">Loading topics...</p>
          ) : (
            <>
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium">Available topics</label>
                <select
                  value={selectedTopicKey}
                  onChange={(event) => setSelectedTopicKey(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
                >
                  <option value="">Select topic</option>
                  {topics.map((topic) => (
                    <option key={`${topic.skill._id}:${topic._id}`} value={`${topic.skill._id}:${topic._id}`}>
                      {topic.title} | {topic.skill.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTopic ? (
                <div className="mt-5 rounded-[20px] border border-[var(--border)] p-5">
                  <p className="text-lg font-semibold">{selectedTopic.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Skill: {selectedTopic.skill.name}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {selectedTopic.description || "No topic description provided."}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={loadPracticeQuestions}
                disabled={!selectedTopic || loadingQuestions}
                className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loadingQuestions ? "Loading practice set..." : "Load practice quiz"}
              </button>
            </>
          )}
        </section>

        <section className="space-y-5">
          <div className="surface-card rounded-[24px] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Practice set</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Answer the questions for revision. Short-answer items are open practice prompts.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                  Answered {totalAnswered}/{questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setAnswers({})}
                  disabled={questions.length === 0}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <RefreshCcw size={16} />
                    Reset
                  </span>
                </button>
              </div>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="surface-card rounded-[24px] p-8 text-sm text-[var(--muted)]">
              Select a topic and load questions to start practicing.
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question._id} className="surface-card rounded-[24px] p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">
                      Practice Question {index + 1}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold">{question.questionText}</h4>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                    {question.skill?.name || "Skill"} | {question.marks} marks
                  </span>
                </div>

                <p className="mt-3 text-sm text-[var(--muted)]">
                  Topic: {question.topicTitle} | Difficulty: {question.difficulty}
                </p>

                <div className="mt-5 space-y-3">
                  {question.type === "short_answer" ? (
                    <textarea
                      value={answers[question._id]?.answerText || ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question._id]: {
                            answerText: event.target.value,
                            selectedOptionIds: [],
                          },
                        }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
                      placeholder="Write your practice answer"
                    />
                  ) : (
                    question.options.map((option) => (
                      <label
                        key={option._id}
                        className="flex items-start gap-3 rounded-2xl border border-[var(--border)] px-4 py-4"
                      >
                        <input
                          type="radio"
                          name={`practice-question-${question._id}`}
                          checked={(answers[question._id]?.selectedOptionIds || []).includes(option._id)}
                          onChange={() => {
                            setAnswers((current) => ({
                              ...current,
                              [question._id]: {
                                selectedOptionIds: [option._id],
                                answerText: "",
                              },
                            }));
                          }}
                        />
                        <span className="text-sm">{option.text}</span>
                      </label>
                    ))
                  )}
                </div>

                {question.explanation ? (
                  <div className="mt-5 rounded-[20px] bg-[var(--accent)]/8 p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                      <BookOpenCheck size={16} />
                      Explanation
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{question.explanation}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
