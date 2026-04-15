"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, CircleX, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../components/app-provider";
import api from "../../lib/api";

function StudentPracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isReady } = useAppContext();
  const [questions, setQuestions] = useState([]);
  const [scope, setScope] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState({
    selectedOptionIds: [],
    answerText: "",
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState("");

  const practiceParams = useMemo(
    () => ({
      courseId: searchParams.get("courseId") || "",
      skillId: searchParams.get("skillId") || "",
      topicId: searchParams.get("topicId") || "",
    }),
    [searchParams]
  );

  const currentQuestion = questions[currentIndex] || null;
  const isComplete = questions.length > 0 && currentIndex >= questions.length;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!auth?.token) {
      router.replace("/login");
    }
  }, [auth?.token, isReady, router]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!auth?.token || !practiceParams.courseId) {
        setLoading(false);
        if (!practiceParams.courseId) {
          setMessage("Select a course from the practice page before starting a session.");
        }
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const response = await api.get("/student/practice/questions", {
          params: practiceParams,
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        setQuestions(response.data.questions || []);
        setScope(response.data.scope || null);
        setCurrentIndex(0);
        setFeedback(null);
        setCurrentAnswer({
          selectedOptionIds: [],
          answerText: "",
        });

        if ((response.data.questions || []).length === 0) {
          setMessage("No practice questions were found for this selection.");
        }
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load practice questions.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [auth?.token, practiceParams]);

  useEffect(() => {
    setCurrentAnswer({
      selectedOptionIds: [],
      answerText: "",
    });
    setFeedback(null);
  }, [currentIndex]);

  const canSubmit = useMemo(() => {
    if (!currentQuestion) {
      return false;
    }

    if (currentQuestion.type === "short_answer") {
      return Boolean(currentAnswer.answerText.trim());
    }

    return currentAnswer.selectedOptionIds.length > 0;
  }, [currentAnswer, currentQuestion]);

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !canSubmit || evaluating || !auth?.token) {
      return;
    }

    setEvaluating(true);
    setMessage("");

    try {
      const response = await api.post(
        "/student/practice/evaluate",
        {
          ...practiceParams,
          questionId: currentQuestion._id,
          selectedOptionIds: currentAnswer.selectedOptionIds,
          answerText: currentAnswer.answerText,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setFeedback(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to evaluate this answer.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentIndex((current) => current + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setMessage("");
    setCurrentAnswer({
      selectedOptionIds: [],
      answerText: "",
    });
    setFeedback(null);
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl p-6">Loading practice session...</div>;
  }

  if (isComplete) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="surface-card rounded-[28px] p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Practice Complete</p>
          <h1 className="mt-3 text-4xl font-semibold">You reached the end of this practice set</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {scope?.summary || "This practice session used your selected course filters."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 font-medium"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Restart session
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/student-dashboard/practice")}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
            >
              Back to practice filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="surface-card rounded-[28px] p-8">
          <h1 className="text-3xl font-semibold">Practice session unavailable</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {message || "No question is available for this practice session."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/student-dashboard/practice")}
            className="mt-6 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
          >
            Back to practice filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <section className="surface-card rounded-[28px] p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Practice Session</p>
            <h1 className="mt-3 text-3xl font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              {scope?.summary || "Practice questions are loaded from your selected learning scope."}
            </p>
          </div>

          <div className="rounded-[22px] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]">
            <p>Course: {scope?.course?.title || "N/A"}</p>
            <p className="mt-1">Skill: {scope?.skill?.name || "Any aligned skill"}</p>
            <p className="mt-1">Topic: {scope?.topic?.title || "Any aligned topic"}</p>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-[var(--border)] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
                {currentQuestion.type === "short_answer" ? "Short Answer" : "Choose One Option"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{currentQuestion.questionText}</h2>
            </div>
            <span className="rounded-full bg-[var(--accent)]/12 px-3 py-2 text-sm text-[var(--accent)]">
              {currentQuestion.skill?.name || "Skill"} | {currentQuestion.topicTitle}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {currentQuestion.type === "short_answer" ? (
              <textarea
                value={currentAnswer.answerText}
                onChange={(event) =>
                  setCurrentAnswer({
                    answerText: event.target.value,
                    selectedOptionIds: [],
                  })
                }
                rows={5}
                disabled={Boolean(feedback)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 disabled:opacity-70"
                placeholder="Write your answer here"
              />
            ) : (
              currentQuestion.options.map((option) => (
                <label
                  key={option._id}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${
                    currentAnswer.selectedOptionIds.includes(option._id)
                      ? "border-[var(--accent)] bg-[var(--accent)]/8"
                      : "border-[var(--border)]"
                  } ${feedback ? "opacity-80" : ""}`}
                >
                  <input
                    type="radio"
                    name={`practice-${currentQuestion._id}`}
                    checked={currentAnswer.selectedOptionIds.includes(option._id)}
                    disabled={Boolean(feedback)}
                    onChange={() =>
                      setCurrentAnswer({
                        selectedOptionIds: [option._id],
                        answerText: "",
                      })
                    }
                  />
                  <span className="text-sm">{option.text}</span>
                </label>
              ))
            )}
          </div>

          {message ? (
            <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {message}
            </p>
          ) : null}

          {feedback ? (
            <div
              className={`mt-6 rounded-[22px] p-5 ${
                feedback.isCorrect
                  ? "border border-emerald-400/30 bg-emerald-500/10"
                  : "border border-amber-400/30 bg-amber-500/10"
              }`}
            >
              <p
                className={`inline-flex items-center gap-2 text-sm font-semibold ${
                  feedback.isCorrect ? "text-emerald-600" : "text-amber-700"
                }`}
              >
                {feedback.isCorrect ? <CheckCircle2 size={18} /> : <CircleX size={18} />}
                {feedback.isCorrect ? "Good job. Your answer is correct." : "That answer is not correct."}
              </p>

              {!feedback.isCorrect ? (
                <>
                  <p className="mt-3 text-sm text-[var(--foreground)]">
                    Correct answer: {feedback.correctAnswerText}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {feedback.explanation || "No explanation was provided for this question."}
                  </p>
                </>
              ) : null}

              <button
                type="button"
                onClick={handleNextQuestion}
                className="mt-5 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
              >
                <span className="inline-flex items-center gap-2">
                  {currentIndex === questions.length - 1 ? "Finish practice" : "Next question"}
                  <ChevronRight size={16} />
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={!canSubmit || evaluating}
              className="mt-6 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {evaluating ? "Submitting answer..." : "Submit answer"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default function StudentPracticeSessionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl p-6">Loading practice session...</div>}>
      <StudentPracticeSessionContent />
    </Suspense>
  );
}
