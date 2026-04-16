"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlarmClock, CheckCircle2, CircleAlert } from "lucide-react";
import { useAppContext } from "../../../../../components/app-provider";
import { ButtonLoader, SectionLoader } from "../../../../../components/loaders";
import api, { clearApiCache } from "../../../../../lib/api";

const formatTimeRemaining = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export default function StudentQuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { auth } = useAppContext();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const startedAtRef = useRef(new Date().toISOString());
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!auth?.token || !params?.id) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const response = await api.get(`/student/quizzes/${params.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const nextQuiz = response.data.quizAssignment;
      setQuiz(nextQuiz);
      setRemainingSeconds((nextQuiz.durationInMinutes || 0) * 60);
      setLoading(false);

      if (nextQuiz.alreadySubmitted) {
        router.replace(`/student-dashboard/quizzes/${nextQuiz._id}/result`);
      }
    };

    load().catch((error) => {
      setErrorMessage(error.response?.data?.message || "Unable to load quiz attempt.");
      setLoading(false);
    });
  }, [auth?.token, params?.id, router]);

  useEffect(() => {
    if (!quiz || quiz.alreadySubmitted || remainingSeconds === null || submitting) {
      return;
    }

    if (remainingSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) {
          return current;
        }

        return current > 0 ? current - 1 : 0;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [quiz, remainingSeconds, submitting]);

  const questionProgress = useMemo(() => {
    if (!quiz?.questions?.length) {
      return { answered: 0, total: 0 };
    }

    const answered = quiz.questions.reduce((count, question) => {
      const answer = answers[question._id];

      if (!answer) {
        return count;
      }

      if (question.type === "short_answer") {
        return answer.answerText?.trim() ? count + 1 : count;
      }

      return answer.selectedOptionIds?.length ? count + 1 : count;
    }, 0);

    return {
      answered,
      total: quiz.questions.length,
    };
  }, [answers, quiz]);

  const submitAttempt = useCallback(
    async (isAutomatic = false) => {
      if (!quiz || submitting || !auth?.token) {
        return;
      }

      if (isAutomatic && autoSubmittedRef.current) {
        return;
      }

      if (isAutomatic) {
        autoSubmittedRef.current = true;
      }

      setSubmitting(true);
      setErrorMessage("");

      try {
        const payload = {
          quizAssignmentId: quiz._id,
          startedAt: startedAtRef.current,
          answers: quiz.questions.map((question) => {
            const answer = answers[question._id];

            if (question.type === "short_answer") {
              return {
                question: question._id,
                answerText: answer?.answerText?.trim() || "",
              };
            }

            return {
              question: question._id,
              selectedOptionIds: answer?.selectedOptionIds || [],
            };
          }),
        };

        await api.post("/student/quiz-attempts", payload, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        clearApiCache((key) =>
          key.includes("/student/dashboard") ||
          key.includes("/student/quizzes") ||
          key.includes("/student/results") ||
          key.includes("/student/quiz-attempts")
        );

        router.replace(`/student-dashboard/quizzes/${quiz._id}/result`);
      } catch (error) {
        if (isAutomatic) {
          autoSubmittedRef.current = false;
        }

        setSubmitting(false);
        setErrorMessage(error.response?.data?.message || "Unable to submit quiz.");
      }
    },
    [answers, auth, quiz, router, submitting]
  );

  useEffect(() => {
    if (!quiz || quiz.alreadySubmitted || remainingSeconds !== 0 || submitting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      submitAttempt(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [quiz, remainingSeconds, submitAttempt, submitting]);

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        selectedOptionIds: [optionId],
      },
    }));
  };

  const handleShortAnswerChange = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        answerText: value,
      },
    }));
  };

  if (loading) {
    return (
      <SectionLoader
        title="Loading quiz attempt"
        description="Preparing your questions, timer, and answer sheet."
      />
    );
  }

  if (!quiz) {
    return (
      <div className="surface-card rounded-[24px] p-6">
        <p className="text-lg font-semibold">Quiz attempt could not be opened.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{errorMessage || "Please return to the dashboard and try again."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[28px] p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Quiz Attempt</p>
            <h1 className="mt-3 text-4xl font-semibold">{quiz.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
              {quiz.instructions || "Answer all questions carefully and submit before the timer runs out."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--muted)]">Answered</p>
              <p className="mt-2 text-2xl font-semibold">
                {questionProgress.answered}/{questionProgress.total}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <AlarmClock size={16} className="text-[var(--accent)]" />
                Time Left
              </p>
              <p className="mt-2 text-2xl font-semibold">{formatTimeRemaining(remainingSeconds || 0)}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/student-dashboard/quizzes/${quiz._id}`}
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-center text-sm font-medium"
              >
                Back to quiz
              </Link>
              <button
                type="button"
                onClick={() => submitAttempt(false)}
                disabled={submitting}
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <ButtonLoader label="Submitting..." /> : "Submit quiz"}
              </button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}
      </section>

      <div className="space-y-4">
        {quiz.questions?.map((question, index) => {
          const currentAnswer = answers[question._id];

          return (
            <article key={question._id} className="surface-card rounded-[24px] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Question {index + 1}</p>
                  <h2 className="mt-2 text-xl font-semibold">{question.questionText}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {question.skill?.name || "Skill"} | {question.topicTitle} | {question.marks} marks
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
                  <CheckCircle2 size={16} />
                  {question.type === "short_answer"
                    ? currentAnswer?.answerText?.trim()
                      ? "Answered"
                      : "Pending"
                    : currentAnswer?.selectedOptionIds?.length
                      ? "Answered"
                      : "Pending"}
                </span>
              </div>

              <div className="mt-5">
                {question.type === "short_answer" ? (
                  <textarea
                    value={currentAnswer?.answerText || ""}
                    onChange={(event) => handleShortAnswerChange(question._id, event.target.value)}
                    rows={5}
                    placeholder="Write your answer here"
                    className="min-h-[140px] w-full rounded-[18px] border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                ) : (
                  <div className="grid gap-3">
                    {(question.options || []).map((option, optionIndex) => {
                      const isSelected = (currentAnswer?.selectedOptionIds || []).some(
                        (selectedOptionId) => String(selectedOptionId) === String(option._id)
                      );

                      return (
                        <button
                          key={option._id}
                          type="button"
                          onClick={() => handleOptionSelect(question._id, option._id)}
                          className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-4 text-left text-sm transition ${
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--border)] hover:border-[var(--accent)]/50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                              isSelected
                                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                : "border-[var(--border)]"
                            }`}
                          >
                            {String.fromCharCode(65 + (optionIndex % 26))}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
