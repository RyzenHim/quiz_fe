"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import {
  ConfirmDialog,
  DetailModal,
  EntityCard,
  EntitySection,
  InputField,
  Modal,
  PaginationControls,
  PageHeader,
  SearchField,
  SegmentedTabs,
  SelectField,
  TextareaField,
  Toast,
} from "../../../components/ui-kit";

const initialForm = {
  title: "",
  description: "",
  instructions: "",
  course: "",
  batch: "",
  skillId: "",
  topicId: "",
  questionCount: "10",
  assignToAllStudents: true,
  studentIds: [],
  questionIds: [],
  durationInMinutes: "30",
  passMarks: "0",
  startAt: "",
  endAt: "",
  status: "published",
};

const PAGE_SIZE = 6;
const QUESTION_COUNT_OPTIONS = ["5", "10", "20", "30", "40", "50"];

const filterQuizzes = (items, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((quiz) =>
    [quiz.title, quiz.status, quiz.course?.title, quiz.batch?.batchName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
};

const paginate = (items, page) => {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;

  return {
    page: safePage,
    totalPages,
    items: items.slice(startIndex, startIndex + PAGE_SIZE),
  };
};

export default function QuizzesPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [deletedQuizzes, setDeletedQuizzes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [deletedQuery, setDeletedQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [activePanel, setActivePanel] = useState("active");
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const loadQuestionCatalog = async () => {
    const firstResponse = await api.get("/questions", {
      headers,
      params: {
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });

    const firstQuestions = firstResponse.data.questions || [];
    const pagination = firstResponse.data.pagination || {};
    const totalPages = pagination.totalPages || 1;

    if (totalPages <= 1) {
      return firstQuestions;
    }

    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        api.get("/questions", {
          headers,
          params: {
            page: index + 2,
            limit: 100,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        })
      )
    );

    return [
      ...firstQuestions,
      ...remainingResponses.flatMap((response) => response.data.questions || []),
    ];
  };

  const loadData = async () => {
    const [coursesRes, batchesRes, questionCatalog, quizzesRes, deletedRes] = await Promise.all([
      api.get("/courses", { headers }),
      api.get("/batches", { headers }),
      loadQuestionCatalog(),
      api.get("/quiz-assignments", { headers }),
      api.get("/quiz-assignments?deleted=true", { headers }),
    ]);
    setCourses(coursesRes.data.courses || []);
    setBatches(batchesRes.data.batches || []);
    setQuestions(questionCatalog || []);
    setQuizzes(quizzesRes.data.quizAssignments || []);
    setDeletedQuizzes(deletedRes.data.quizAssignments || []);
  };

  useEffect(() => {
    if (!token) return;
    loadData().catch(() => null);
  }, [token]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === form.course),
    [courses, form.course]
  );
  const eligibleBatches = useMemo(
    () =>
      !form.course
        ? []
        : batches.filter((batch) => (batch.courses || []).some((course) => course._id === form.course)),
    [batches, form.course]
  );
  const selectedBatch = useMemo(
    () => eligibleBatches.find((batch) => batch._id === form.batch),
    [eligibleBatches, form.batch]
  );
  const eligibleStudents = useMemo(() => selectedBatch?.students || [], [selectedBatch]);
  const alignedSkills = useMemo(() => selectedCourse?.skills || [], [selectedCourse]);
  const selectedSkill = useMemo(
    () => alignedSkills.find((skill) => skill._id === form.skillId),
    [alignedSkills, form.skillId]
  );
  const alignedTopics = useMemo(() => selectedSkill?.topics || [], [selectedSkill]);
  const requestedQuestionCount = Number(form.questionCount || 0);
  const alignedQuestions = useMemo(
    () =>
      !selectedCourse
        ? []
        : questions.filter((question) =>
            (selectedCourse.skills || []).some((skill) => skill._id === question.skill?._id)
          ),
    [questions, selectedCourse]
  );
  const topicQuestions = useMemo(
    () =>
      !form.skillId || !form.topicId
        ? []
        : alignedQuestions.filter(
            (question) =>
              question.skill?._id === form.skillId && String(question.topicId) === String(form.topicId)
          ),
    [alignedQuestions, form.skillId, form.topicId]
  );
  const selectedQuestions = useMemo(
    () =>
      form.questionIds
        .map((questionId) => questions.find((question) => question._id === questionId))
        .filter(Boolean),
    [form.questionIds, questions]
  );
  const generatedDescription = useMemo(() => {
    if (!selectedQuestions.length) {
      return "";
    }

    const grouped = selectedQuestions.reduce((accumulator, question) => {
      const skillName = question.skill?.name || "Skill";
      const topicName = question.topicTitle || "Topic";
      if (!accumulator[skillName]) {
        accumulator[skillName] = new Set();
      }
      accumulator[skillName].add(topicName);
      return accumulator;
    }, {});

    const scopeSummary = Object.entries(grouped)
      .map(([skillName, topics]) => `${skillName}: ${Array.from(topics).join(", ")}`)
      .join(" | ");

    return `This quiz consists of ${selectedQuestions.length} selected questions from ${scopeSummary}.`;
  }, [selectedQuestions]);
  const selectedQuestionCount = form.questionIds.length;
  const selectedStudentCount = form.assignToAllStudents
    ? eligibleStudents.length
    : form.studentIds.length;
  const filteredQuizzes = useMemo(() => filterQuizzes(quizzes, activeQuery), [quizzes, activeQuery]);
  const filteredDeletedQuizzes = useMemo(
    () => filterQuizzes(deletedQuizzes, deletedQuery),
    [deletedQuizzes, deletedQuery]
  );
  const activePagination = useMemo(
    () => paginate(filteredQuizzes, activePage),
    [filteredQuizzes, activePage]
  );
  const deletedPagination = useMemo(
    () => paginate(filteredDeletedQuizzes, deletedPage),
    [filteredDeletedQuizzes, deletedPage]
  );
  const quizSections = selectedQuiz
    ? [
        {
          title: "Quiz Overview",
          items: [
            { label: "Title", value: selectedQuiz.title },
            { label: "Status", value: selectedQuiz.status },
            { label: "Course", value: selectedQuiz.course?.title },
            { label: "Batch", value: selectedQuiz.batch?.batchName },
          ],
        },
        {
          title: "Assignment Setup",
          items: [
            { label: "Duration", value: `${selectedQuiz.durationInMinutes || 0} minutes` },
            { label: "Pass Marks", value: String(selectedQuiz.passMarks || 0) },
            { label: "Students", value: String((selectedQuiz.students || []).length) },
            { label: "Questions", value: String((selectedQuiz.questions || []).length) },
          ],
        },
        {
          title: "Schedule And Content",
          items: [
            { label: "Description", value: selectedQuiz.description },
            { label: "Instructions", value: selectedQuiz.instructions },
            { label: "Start At", value: selectedQuiz.startAt ? new Date(selectedQuiz.startAt).toLocaleString() : "" },
            { label: "End At", value: selectedQuiz.endAt ? new Date(selectedQuiz.endAt).toLocaleString() : "" },
          ],
        },
      ]
    : [];

  useEffect(() => {
    setActivePage(1);
  }, [activeQuery]);

  useEffect(() => {
    setDeletedPage(1);
  }, [deletedQuery]);

  useEffect(() => {
    if (activePage > activePagination.totalPages) {
      setActivePage(activePagination.totalPages);
    }
  }, [activePage, activePagination.totalPages]);

  useEffect(() => {
    if (deletedPage > deletedPagination.totalPages) {
      setDeletedPage(deletedPagination.totalPages);
    }
  }, [deletedPage, deletedPagination.totalPages]);

  const closeModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
  };

  useEffect(() => {
    setForm((current) => {
      if (current.description === generatedDescription) {
        return current;
      }
      return {
        ...current,
        description: generatedDescription,
      };
    });
  }, [generatedDescription]);

  const handleEdit = (quiz) => {
    setEditingId(quiz._id);
    setForm({
      title: quiz.title || "",
      description: quiz.description || "",
      instructions: quiz.instructions || "",
      course: quiz.course?._id || "",
      batch: quiz.batch?._id || "",
      skillId: "",
      topicId: "",
      questionCount: String((quiz.questions || []).length || 10),
      assignToAllStudents: Boolean(quiz.assignToAllStudents),
      studentIds: (quiz.students || []).map((student) => student._id),
      questionIds: (quiz.questions || []).map((question) => question._id),
      durationInMinutes: String(quiz.durationInMinutes || 30),
      passMarks: String(quiz.passMarks || 0),
      startAt: quiz.startAt ? new Date(quiz.startAt).toISOString().slice(0, 16) : "",
      endAt: quiz.endAt ? new Date(quiz.endAt).toISOString().slice(0, 16) : "",
      status: quiz.status || "published",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (requestedQuestionCount > 0 && form.questionIds.length !== requestedQuestionCount) {
      setToast({
        variant: "error",
        title: "Question count mismatch",
        description: `Select exactly ${requestedQuestionCount} questions before creating the quiz.`,
      });
      return;
    }

    const payload = {
      ...form,
      durationInMinutes: Number(form.durationInMinutes),
      passMarks: Number(form.passMarks || 0),
      studentIds: form.assignToAllStudents ? [] : form.studentIds,
      startAt: form.startAt || undefined,
      endAt: form.endAt || undefined,
    };

    try {
      if (editingId) {
        await api.put(`/quiz-assignments/${editingId}`, payload, { headers });
        setToast({ variant: "success", title: "Quiz updated" });
      } else {
        await api.post("/quiz-assignments", payload, { headers });
        setToast({ variant: "success", title: "Quiz created" });
      }

      closeModal();
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to save quiz",
        description: error.response?.data?.message || "Please review the quiz form and try again.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteState) {
      return;
    }

    try {
      if (deleteState.type === "hard") {
        await api.delete(`/quiz-assignments/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/quiz-assignments/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Quiz removed permanently" : "Quiz moved to deleted",
      });
      setDeleteState(null);
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete quiz.",
      });
    }
  };

  const addQuestionToQuiz = (question) => {
    if (form.questionIds.includes(question._id)) {
      return;
    }

    if (requestedQuestionCount > 0 && form.questionIds.length >= requestedQuestionCount) {
      setToast({
        variant: "warning",
        title: "Question limit reached",
        description: `You selected ${requestedQuestionCount} as the maximum number of questions for this quiz.`,
      });
      return;
    }

    setForm((current) => ({
      ...current,
      questionIds: [...current.questionIds, question._id],
    }));
  };

  const removeQuestionFromQuiz = (questionId) => {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.filter((id) => id !== questionId),
    }));
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quizzes"
          title="Publish assignments with less clutter"
          description="Quiz creation now happens in a single modal with course, batch, student, and question alignment while warnings handle risky deletes."
          action={
            <button type="button" className="neo-button-primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Add Quiz
            </button>
          }
        />

        <section className="neo-panel rounded-[30px] p-4 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Quiz Views</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Stay focused on active quizzes and open deleted ones only in their own panel</h2>
            </div>
            <SegmentedTabs
              tabs={[
                { value: "active", label: "Active Quizzes", count: filteredQuizzes.length },
                { value: "deleted", label: "Deleted Quizzes", count: filteredDeletedQuizzes.length },
              ]}
              value={activePanel}
              onChange={setActivePanel}
            />
          </div>
        </section>

        {activePanel === "active" ? (
          <EntitySection
            title="Active Quizzes"
            items={activePagination.items}
            count={filteredQuizzes.length}
            emptyText="No active quizzes found."
            controls={
              <SearchField
                value={activeQuery}
                onChange={setActiveQuery}
                placeholder="Search by title, course, batch, or status"
              />
            }
          >
            {(quiz) => (
              <EntityCard
                key={quiz._id}
                title={quiz.title}
                subtitle={`${quiz.course?.title || "No course"} | ${quiz.batch?.batchName || "No batch"} | Students: ${quiz.students?.length || 0}`}
                meta={quiz.status}
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedQuiz(quiz)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(quiz)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: quiz._id, type: "soft", label: quiz.title })}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                }
              />
            )}
          </EntitySection>
        ) : null}

        {activePanel === "deleted" ? (
          <EntitySection
            title="Deleted Quizzes"
            items={deletedPagination.items}
            count={filteredDeletedQuizzes.length}
            emptyText="No deleted quizzes."
            controls={
              <SearchField
                value={deletedQuery}
                onChange={setDeletedQuery}
                placeholder="Search deleted quizzes"
              />
            }
          >
            {(quiz) => (
              <EntityCard
                key={quiz._id}
                title={quiz.title}
                subtitle={quiz.course?.title || "No course"}
                meta="Deleted records"
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedQuiz(quiz)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: quiz._id, type: "hard", label: quiz.title })}
                    >
                      <Trash2 size={16} />
                      Delete Permanently
                    </button>
                  </>
                }
              />
            )}
          </EntitySection>
        ) : null}

        <div className="grid gap-6">
          {activePanel === "active" ? (
          <PaginationControls
            page={activePagination.page}
            totalPages={activePagination.totalPages}
            totalItems={filteredQuizzes.length}
            pageSize={PAGE_SIZE}
            onPageChange={setActivePage}
            label="quizzes"
          />
          ) : null}
          {activePanel === "deleted" ? (
          <PaginationControls
            page={deletedPagination.page}
            totalPages={deletedPagination.totalPages}
            totalItems={filteredDeletedQuizzes.length}
            pageSize={PAGE_SIZE}
            onPageChange={setDeletedPage}
            label="deleted quizzes"
          />
          ) : null}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit quiz" : "Create quiz"}
        subtitle="Course alignment, question selection, schedule, and student targeting are all grouped into one flow."
        size="wide"
        footer={
          <button type="submit" form="quiz-form" className="neo-button-primary">
            {editingId ? "Update Quiz" : "Create Quiz"}
          </button>
        }
      >
        <form id="quiz-form" onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <InputField label="Quiz Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <InputField
            label="Duration In Minutes"
            type="number"
            value={form.durationInMinutes}
            onChange={(value) => setForm({ ...form, durationInMinutes: value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Description"
              value={form.description}
              onChange={() => {}}
              placeholder="Description is generated from your selected questions."
            />
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label="Instructions"
              value={form.instructions}
              onChange={(value) => setForm({ ...form, instructions: value })}
            />
          </div>

          <SelectField
            label="Course"
            value={form.course}
            onChange={(event) =>
              setForm({
                ...form,
                course: event.target.value,
                batch: "",
                skillId: "",
                topicId: "",
                studentIds: [],
                questionIds: [],
              })
            }
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Batch"
            value={form.batch}
            disabled={!form.course}
            onChange={(event) =>
              setForm({
                ...form,
                batch: event.target.value,
                skillId: "",
                topicId: "",
                studentIds: [],
                questionIds: [],
              })
            }
          >
            <option value="">Select batch</option>
            {eligibleBatches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </SelectField>

          <label className="neo-soft rounded-[22px] p-4 md:col-span-2">
            <span className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.assignToAllStudents}
                onChange={(event) =>
                  setForm({ ...form, assignToAllStudents: event.target.checked, studentIds: [] })
                }
              />
              Assign to all students from the selected batch
            </span>
          </label>

          <section className="neo-soft rounded-[24px] p-5 md:col-span-2">
            <div className="flex flex-col gap-4 border-b border-[var(--border)]/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Student Delivery</p>
                <h4 className="mt-2 text-xl font-semibold">Choose who receives this quiz</h4>
              </div>
              <span className="neo-badge">{selectedStudentCount}</span>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              {form.batch
                ? form.assignToAllStudents
                  ? `All ${eligibleStudents.length} students from the selected batch will receive this quiz.`
                  : "Pick specific students from the selected batch."
                : "Choose a batch first to view eligible students."}
            </p>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {!form.batch ? (
                <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
                  No batch selected yet.
                </div>
              ) : eligibleStudents.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
                  No students are linked to this batch.
                </div>
              ) : (
                eligibleStudents.map((student) => {
                  const isSelected = form.assignToAllStudents || form.studentIds.includes(student._id);
                  return (
                    <label
                      key={student._id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[20px] border px-4 py-4 transition ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[var(--border)]/70 bg-white/15 dark:bg-white/5"
                      } ${form.assignToAllStudents ? "opacity-80" : ""}`}
                    >
                      <input
                        type="checkbox"
                        disabled={form.assignToAllStudents}
                        checked={isSelected}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            studentIds: event.target.checked
                              ? [...current.studentIds, student._id]
                              : current.studentIds.filter((id) => id !== student._id),
                          }))
                        }
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{student.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {student.enrollmentNumber || "No enrollment"} | {student.email || "No email"}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <div className="md:col-span-2 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="neo-soft rounded-[24px] p-5">
              <div className="flex flex-col gap-4 border-b border-[var(--border)]/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Question Flow</p>
                  <h4 className="mt-2 text-xl font-semibold">Course to skill to topic to questions</h4>
                </div>
                <div className="w-full max-w-[12rem]">
                  <SelectField
                    label="Questions Required"
                    value={form.questionCount}
                    onChange={(event) =>
                      setForm((current) => {
                        const nextCount = Number(event.target.value);
                        const nextQuestionIds = current.questionIds.slice(0, nextCount);
                        return {
                          ...current,
                          questionCount: event.target.value,
                          questionIds: nextQuestionIds,
                        };
                      })
                    }
                  >
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count} Questions
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Aligned Skill"
                  value={form.skillId}
                  disabled={!form.batch}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      skillId: event.target.value,
                      topicId: "",
                    }))
                  }
                >
                  <option value="">Select skill</option>
                  {alignedSkills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Aligned Topic"
                  value={form.topicId}
                  disabled={!form.skillId}
                  onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}
                >
                  <option value="">Select topic</option>
                  {alignedTopics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </SelectField>
              </div>

              <p className="mt-4 text-sm text-[var(--muted)]">
                {!form.batch
                  ? "Select course and batch first, then you can drill into aligned skills and topics."
                  : !form.skillId
                    ? "Select a skill to reveal its topics."
                    : !form.topicId
                      ? "Select a topic to view its aligned questions."
                      : `${topicQuestions.length} questions available for ${selectedSkill?.name || "this skill"} / ${
                          alignedTopics.find((topic) => topic._id === form.topicId)?.title || "topic"
                        }.`}
              </p>

              <div className="mt-4 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                {!form.batch || !form.skillId || !form.topicId ? (
                  <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-10 text-sm text-[var(--muted)]">
                    Questions will appear here after you choose a skill and topic.
                  </div>
                ) : topicQuestions.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-10 text-sm text-[var(--muted)]">
                    No questions found for this topic yet.
                  </div>
                ) : (
                  topicQuestions.map((question) => {
                    const isSelected = form.questionIds.includes(question._id);
                    const limitReached =
                      requestedQuestionCount > 0 && form.questionIds.length >= requestedQuestionCount && !isSelected;

                    return (
                      <article
                        key={question._id}
                        className={`rounded-[20px] border px-4 py-4 transition ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)]/70 bg-white/15 dark:bg-white/5"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white/35 px-2 py-1 text-xs text-[var(--muted)]">
                                {question.marks} marks
                              </span>
                              <span className="rounded-full bg-white/35 px-2 py-1 text-xs text-[var(--muted)]">
                                {question.difficulty}
                              </span>
                              <span className="rounded-full bg-white/35 px-2 py-1 text-xs text-[var(--muted)]">
                                {question.type}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-medium leading-6">{question.questionText}</p>
                          </div>
                          <button
                            type="button"
                            className={isSelected ? "neo-button" : "neo-button-primary"}
                            onClick={() => (isSelected ? removeQuestionFromQuiz(question._id) : addQuestionToQuiz(question))}
                            disabled={limitReached}
                          >
                            {isSelected ? "Remove" : "Add"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section className="neo-soft rounded-[24px] p-5">
              <div className="flex flex-col gap-3 border-b border-[var(--border)]/70 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Selected Questions</p>
                  <h4 className="mt-2 text-xl font-semibold">Live quiz list</h4>
                </div>
                <span className="neo-badge">
                  {selectedQuestionCount}/{requestedQuestionCount}
                </span>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Selected questions appear here in real time. By default this list stays empty until you add questions.
              </p>
              <div className="mt-4 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                {selectedQuestions.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
                    No questions selected yet.
                  </div>
                ) : (
                  selectedQuestions.map((question, index) => (
                    <article key={question._id} className="rounded-[20px] border border-[var(--border)]/70 bg-white/15 px-4 py-4 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                            Question {index + 1}
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6">{question.questionText}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                            {question.skill?.name || "Skill"} | {question.topicTitle} | {question.marks} marks
                          </p>
                        </div>
                        <button
                          type="button"
                          className="neo-button"
                          onClick={() => removeQuestionFromQuiz(question._id)}
                        >
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <InputField
            label="Pass Marks"
            type="number"
            value={form.passMarks}
            onChange={(value) => setForm({ ...form, passMarks: value })}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </SelectField>
          <InputField
            label="Start At"
            type="datetime-local"
            value={form.startAt}
            onChange={(value) => setForm({ ...form, startAt: value })}
          />
          <InputField
            label="End At"
            type="datetime-local"
            value={form.endAt}
            onChange={(value) => setForm({ ...form, endAt: value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete quiz permanently?" : "Remove quiz from active list?"}
        description={deleteState ? `${deleteState.label} is the quiz affected by this action.` : ""}
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Quiz"}
      />

      <DetailModal
        open={Boolean(selectedQuiz)}
        onClose={() => setSelectedQuiz(null)}
        title={selectedQuiz?.title || "Quiz Details"}
        subtitle="A fuller quiz summary in the same soft-blur modal pattern."
        sections={quizSections}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
