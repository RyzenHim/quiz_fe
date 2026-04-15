"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import {
  ConfirmDialog,
  EntityCard,
  EntitySection,
  InputField,
  Modal,
  PaginationControls,
  PageHeader,
  SearchField,
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

  const loadData = async () => {
    const [coursesRes, batchesRes, questionsRes, quizzesRes, deletedRes] = await Promise.all([
      api.get("/courses", { headers }),
      api.get("/batches", { headers }),
      api.get("/questions", { headers }),
      api.get("/quiz-assignments", { headers }),
      api.get("/quiz-assignments?deleted=true", { headers }),
    ]);
    setCourses(coursesRes.data.courses || []);
    setBatches(batchesRes.data.batches || []);
    setQuestions(questionsRes.data.questions || []);
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
  const eligibleSkillIds = useMemo(
    () => new Set((selectedCourse?.skills || []).map((skill) => skill._id)),
    [selectedCourse]
  );
  const eligibleQuestions = useMemo(
    () => (!selectedCourse ? [] : questions.filter((question) => eligibleSkillIds.has(question.skill?._id))),
    [eligibleSkillIds, questions, selectedCourse]
  );
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

  const handleEdit = (quiz) => {
    setEditingId(quiz._id);
    setForm({
      title: quiz.title || "",
      description: quiz.description || "",
      instructions: quiz.instructions || "",
      course: quiz.course?._id || "",
      batch: quiz.batch?._id || "",
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

        <div className="grid gap-6 xl:grid-cols-2">
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
                  <button
                    type="button"
                    className="neo-button-danger"
                    onClick={() => setDeleteState({ id: quiz._id, type: "hard", label: quiz.title })}
                  >
                    <Trash2 size={16} />
                    Delete Permanently
                  </button>
                }
              />
            )}
          </EntitySection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PaginationControls
            page={activePagination.page}
            totalPages={activePagination.totalPages}
            totalItems={filteredQuizzes.length}
            pageSize={PAGE_SIZE}
            onPageChange={setActivePage}
            label="quizzes"
          />
          <PaginationControls
            page={deletedPagination.page}
            totalPages={deletedPagination.totalPages}
            totalItems={filteredDeletedQuizzes.length}
            pageSize={PAGE_SIZE}
            onPageChange={setDeletedPage}
            label="deleted quizzes"
          />
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit quiz" : "Create quiz"}
        subtitle="Course alignment, question selection, schedule, and student targeting are all grouped into one flow."
        size="wide"
        footer={
          <>
            <button type="button" className="neo-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="quiz-form" className="neo-button-primary">
              {editingId ? "Update Quiz" : "Create Quiz"}
            </button>
          </>
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
              onChange={(value) => setForm({ ...form, description: value })}
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
              setForm({ ...form, course: event.target.value, batch: "", studentIds: [], questionIds: [] })
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
            onChange={(event) => setForm({ ...form, batch: event.target.value, studentIds: [] })}
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

          {!form.assignToAllStudents ? (
            <div className="md:col-span-2">
              <SelectField
                label="Students"
                value={form.studentIds}
                multiple
                disabled={!form.batch}
                onChange={(event) =>
                  setForm({
                    ...form,
                    studentIds: Array.from(event.target.selectedOptions, (option) => option.value),
                  })
                }
              >
                {eligibleStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.enrollmentNumber})
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <SelectField
              label="Questions"
              value={form.questionIds}
              multiple
              disabled={!form.course}
              onChange={(event) =>
                setForm({
                  ...form,
                  questionIds: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
            >
              {eligibleQuestions.map((question) => (
                <option key={question._id} value={question._id}>
                  {question.questionText} | {question.topicTitle} | {question.marks} marks
                </option>
              ))}
            </SelectField>
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
