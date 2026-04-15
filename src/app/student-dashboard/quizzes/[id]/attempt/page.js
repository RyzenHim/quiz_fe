"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../../../components/app-provider";
import api from "../../../../../lib/api";

const formatTimer = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function StudentQuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { auth } = useAppContext();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const startedAtRef = useRef(new Date().toISOString());
  const autoSubmittedRef = useRef(false);

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

      const quizAssignment = response.data.quizAssignment;
      setQuiz(quizAssignment);
      setRemainingSeconds((quizAssignment.durationInMinutes || 0) * 60);
    };

    load().catch(() => setMessage("Unable to load quiz."));
  }, [auth, params?.id]);

  const submitQuiz = useCallback(async (force = false) => {
    if (!quiz || !auth?.token || submitting || autoSubmittedRef.current) {
      return;
    }

    if (force) {
      autoSubmittedRef.current = true;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const payloadAnswers = quiz.questions.map((question) => ({
        question: question._id,
        selectedOptionIds: answers[question._id]?.selectedOptionIds || [],
        answerText: answers[question._id]?.answerText || "",
      }));

      await api.post(
        "/student/quiz-attempts",
        {
          quizAssignmentId: quiz._id,
          startedAt: startedAtRef.current,
          answers: payloadAnswers,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      router.push("/student-dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to submit quiz.");
      autoSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [answers, auth?.token, quiz, router, submitting]);

  useEffect(() => {
    if (!quiz || quiz.alreadySubmitted) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          submitQuiz(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quiz, submitQuiz]);

  const totalAnswered = useMemo(() => {
    if (!quiz?.questions) {
      return 0;
    }

    return quiz.questions.filter((question) => {
      const currentAnswer = answers[question._id];
      if (!currentAnswer) {
        return false;
      }

      if (question.type === "short_answer") {
        return Boolean(currentAnswer.answerText?.trim());
      }

      return (currentAnswer.selectedOptionIds || []).length > 0;
    }).length;
  }, [answers, quiz]);

  if (!quiz) {
    return <div className="surface-card rounded-[24px] p-6">{message || "Loading quiz..."}</div>;
  }

  if (quiz.alreadySubmitted) {
    return (
      <div className="surface-card rounded-[24px] p-6">
        You have already attempted this quiz.
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
      <aside className="surface-card rounded-[24px] p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Live attempt</p>
        <h1 className="mt-3 text-3xl font-semibold">{quiz.title}</h1>
        <div className="mt-6 space-y-3 text-sm text-[var(--muted)]">
          <p>Course: {quiz.course?.title || "N/A"}</p>
          <p>Batch: {quiz.batch?.batchName || "N/A"}</p>
          <p>Assigned By: {quiz.teacher?.name || "Teacher"}</p>
          <p>Total Questions: {quiz.questions?.length || 0}</p>
          <p>Answered: {totalAnswered}</p>
        </div>

        <div className="mt-8 rounded-[20px] bg-[var(--accent)] px-5 py-6 text-white">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">Timer</p>
          <p className="mt-3 text-5xl font-semibold">{formatTimer(remainingSeconds)}</p>
        </div>

        {message ? (
          <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => submitQuiz(false)}
          disabled={submitting}
          className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit quiz"}
        </button>
      </aside>

      <section className="space-y-5">
        {quiz.questions.map((question, index) => (
          <div key={question._id} className="surface-card rounded-[24px] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">
                  Question {index + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{question.questionText}</h2>
              </div>
              <span className="rounded-full bg-[var(--accent)]/15 px-3 py-2 text-sm text-[var(--accent)]">
                {question.marks} marks
              </span>
            </div>

            <p className="mt-3 text-sm text-[var(--muted)]">
              {question.skill?.name || "Skill"} | {question.topicTitle}
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
                  placeholder="Write your answer"
                />
              ) : (
                question.options.map((option) => (
                  <label
                    key={option._id}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border)] px-4 py-4"
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
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
          </div>
        ))}
      </section>
    </div>
  );
}
