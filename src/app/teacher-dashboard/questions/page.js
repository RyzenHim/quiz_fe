"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Link2,
  SquarePen,
  CopyPlus,
} from "lucide-react";
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

const PAGE_SIZE = 8;
const emptyPagination = { page: 1, totalPages: 1, totalItems: 0, limit: PAGE_SIZE };

const createManualRow = () => ({
  questionText: "",
  type: "mcq",
  marks: "1",
  difficulty: "medium",
  explanation: "",
  optionsText: "Option 1|true, Option 2|false",
  correctAnswerText: "",
});

const emptyEditForm = {
  skill: "",
  topicId: "",
  type: "mcq",
  questionText: "",
  marks: "1",
  difficulty: "medium",
  explanation: "",
  optionsText: "Option 1|true, Option 2|false",
  correctAnswerText: "",
};

export default function QuestionsPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [questions, setQuestions] = useState([]);
  const [deletedQuestions, setDeletedQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [activePagination, setActivePagination] = useState(emptyPagination);
  const [deletedPagination, setDeletedPagination] = useState(emptyPagination);
  const [activeFilters, setActiveFilters] = useState({
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });
  const [deletedFilters, setDeletedFilters] = useState({
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [createMode, setCreateMode] = useState("manual");
  const [sharedContext, setSharedContext] = useState({ skill: "", topicId: "" });
  const [manualRows, setManualRows] = useState([createManualRow()]);
  const [spreadsheetLink, setSpreadsheetLink] = useState("");
  const [importFile, setImportFile] = useState(null);

  const loadSkills = async () => {
    const response = await api.get("/skills", { headers });
    setSkills(response.data.skills || []);
  };

  const loadQuestions = async (filters = activeFilters) => {
    const response = await api.get("/questions", {
      headers,
      params: {
        ...filters,
        limit: PAGE_SIZE,
      },
    });

    setQuestions(response.data.questions || []);
    setActivePagination(response.data.pagination || emptyPagination);
  };

  const loadDeletedQuestions = async (filters = deletedFilters) => {
    const response = await api.get("/questions", {
      headers,
      params: {
        ...filters,
        deleted: true,
        limit: PAGE_SIZE,
      },
    });

    setDeletedQuestions(response.data.questions || []);
    setDeletedPagination(response.data.pagination || emptyPagination);
  };

  useEffect(() => {
    if (!token) return;
    loadSkills().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadQuestions(activeFilters).catch(() => null);
  }, [token, activeFilters]);

  useEffect(() => {
    if (!token) return;
    loadDeletedQuestions(deletedFilters).catch(() => null);
  }, [token, deletedFilters]);

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill._id === (editingId ? editForm.skill : sharedContext.skill)),
    [editForm.skill, editingId, sharedContext.skill, skills]
  );

  const buildSingleQuestionPayload = (form) => {
    const options =
      form.type === "short_answer"
        ? []
        : form.optionsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
              const [text, flag] = item.split("|").map((part) => part.trim());
              return { text, isCorrect: flag === "true" };
            });

    return {
      skill: form.skill,
      topicId: form.topicId,
      type: form.type,
      questionText: form.questionText,
      marks: Number(form.marks),
      difficulty: form.difficulty,
      explanation: form.explanation,
      options,
      correctAnswerText: form.type === "short_answer" ? form.correctAnswerText : undefined,
    };
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setEditForm(emptyEditForm);
    setCreateMode("manual");
    setSharedContext({ skill: "", topicId: "" });
    setManualRows([createManualRow()]);
    setSpreadsheetLink("");
    setImportFile(null);
  };

  const openCreateModal = () => {
    closeModal();
    setModalOpen(true);
  };

  const refreshLists = async () => {
    await Promise.all([loadQuestions(activeFilters), loadDeletedQuestions(deletedFilters)]);
  };

  const handleEdit = (question) => {
    setEditingId(question._id);
    setEditForm({
      skill: question.skill?._id || "",
      topicId: question.topicId || "",
      type: question.type || "mcq",
      questionText: question.questionText || "",
      marks: String(question.marks || 1),
      difficulty: question.difficulty || "medium",
      explanation: question.explanation || "",
      optionsText: (question.options || [])
        .map((option) => `${option.text}|${option.isCorrect ? "true" : "false"}`)
        .join(", "),
      correctAnswerText: question.correctAnswerText || "",
    });
    setModalOpen(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.put(`/questions/${editingId}`, buildSingleQuestionPayload(editForm), { headers });
      setToast({ variant: "success", title: "Question updated" });
      closeModal();
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to save question",
        description: error.response?.data?.message || "Please review the form and try again.",
      });
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!sharedContext.skill || !sharedContext.topicId) {
        throw new Error("Select both skill and topic before importing questions");
      }

      if (createMode === "manual") {
        const questionsPayload = manualRows.map((row) =>
          buildSingleQuestionPayload({
            ...row,
            skill: sharedContext.skill,
            topicId: sharedContext.topicId,
          })
        );

        await api.post(
          "/questions/import/manual",
          {
            skill: sharedContext.skill,
            topicId: sharedContext.topicId,
            questions: questionsPayload,
          },
          { headers }
        );
      } else if (createMode === "file") {
        if (!importFile) {
          throw new Error("Choose an Excel file before importing");
        }

        const formData = new FormData();
        formData.append("skill", sharedContext.skill);
        formData.append("topicId", sharedContext.topicId);
        formData.append("file", importFile);

        await api.post("/questions/import/file", formData, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post(
          "/questions/import/spreadsheet-link",
          {
            skill: sharedContext.skill,
            topicId: sharedContext.topicId,
            spreadsheetLink,
          },
          { headers }
        );
      }

      setToast({
        variant: "success",
        title:
          createMode === "manual"
            ? "Questions added manually"
            : createMode === "file"
              ? "Questions imported from Excel"
              : "Questions imported from spreadsheet link",
      });
      closeModal();
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to import questions",
        description: error.response?.data?.message || error.message || "Please try again.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteState) {
      return;
    }
    try {
      if (deleteState.type === "hard") {
        await api.delete(`/questions/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/questions/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Question removed permanently" : "Question moved to deleted",
      });
      setDeleteState(null);
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete question.",
      });
    }
  };

  const restoreQuestion = async (id) => {
    try {
      await api.patch(`/questions/restore/${id}`, {}, { headers });
      setToast({ variant: "success", title: "Question restored" });
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to restore question",
        description: error.response?.data?.message || "Please try again.",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/questions/template/download", {
        headers,
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "question-import-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to download template",
        description: "Please try again.",
      });
    }
  };

  const renderSharedContext = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField
        label="Skill"
        value={sharedContext.skill}
        onChange={(event) =>
          setSharedContext({
            skill: event.target.value,
            topicId: "",
          })
        }
      >
        <option value="">Select skill</option>
        {skills.map((skill) => (
          <option key={skill._id} value={skill._id}>
            {skill.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Topic"
        value={sharedContext.topicId}
        onChange={(event) =>
          setSharedContext((current) => ({
            ...current,
            topicId: event.target.value,
          }))
        }
      >
        <option value="">Select topic</option>
        {(selectedSkill?.topics || []).map((topic) => (
          <option key={topic._id} value={topic._id}>
            {topic.title}
          </option>
        ))}
      </SelectField>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Questions"
          title="Add, import, restore, and search questions from the backend"
          description="Questions now support backend search, sorting, pagination, restore for deleted records, and a downloadable import template alongside manual, file, and spreadsheet-link entry."
          action={
            <div className="flex flex-wrap gap-3">
              <button type="button" className="neo-button" onClick={downloadTemplate}>
                <Download size={18} />
                Template
              </button>
              <button type="button" className="neo-button-primary" onClick={openCreateModal}>
                <Plus size={18} />
                Add Questions
              </button>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <EntitySection
            title="Active Questions"
            items={questions}
            count={activePagination.totalItems}
            emptyText="No active questions found."
            controls={
              <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <SearchField
                  value={activeFilters.search}
                  onChange={(value) => setActiveFilters((current) => ({ ...current, search: value, page: 1 }))}
                  placeholder="Search question, topic, difficulty"
                />
                <SelectField
                  label="Sort By"
                  value={activeFilters.sortBy}
                  onChange={(event) =>
                    setActiveFilters((current) => ({ ...current, sortBy: event.target.value, page: 1 }))
                  }
                >
                  <option value="createdAt">Newest</option>
                  <option value="questionText">Question</option>
                  <option value="topicTitle">Topic</option>
                  <option value="marks">Marks</option>
                  <option value="difficulty">Difficulty</option>
                </SelectField>
                <SelectField
                  label="Order"
                  value={activeFilters.sortOrder}
                  onChange={(event) =>
                    setActiveFilters((current) => ({ ...current, sortOrder: event.target.value, page: 1 }))
                  }
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </SelectField>
              </div>
            }
          >
            {(question) => (
              <EntityCard
                key={question._id}
                title={question.questionText}
                subtitle={`${question.skill?.name || "Skill"} | ${question.topicTitle} | ${question.marks} marks`}
                meta={question.difficulty || "medium"}
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => handleEdit(question)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: question._id, type: "soft", label: question.questionText })}
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
            title="Deleted Questions"
            items={deletedQuestions}
            count={deletedPagination.totalItems}
            emptyText="No deleted questions."
            controls={
              <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <SearchField
                  value={deletedFilters.search}
                  onChange={(value) => setDeletedFilters((current) => ({ ...current, search: value, page: 1 }))}
                  placeholder="Search deleted questions"
                />
                <SelectField
                  label="Sort By"
                  value={deletedFilters.sortBy}
                  onChange={(event) =>
                    setDeletedFilters((current) => ({ ...current, sortBy: event.target.value, page: 1 }))
                  }
                >
                  <option value="createdAt">Newest</option>
                  <option value="questionText">Question</option>
                  <option value="topicTitle">Topic</option>
                  <option value="marks">Marks</option>
                  <option value="difficulty">Difficulty</option>
                </SelectField>
                <SelectField
                  label="Order"
                  value={deletedFilters.sortOrder}
                  onChange={(event) =>
                    setDeletedFilters((current) => ({ ...current, sortOrder: event.target.value, page: 1 }))
                  }
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </SelectField>
              </div>
            }
          >
            {(question) => (
              <EntityCard
                key={question._id}
                title={question.questionText}
                subtitle={question.topicTitle}
                meta="Deleted records"
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => restoreQuestion(question._id)}>
                      <RotateCcw size={16} />
                      Restore
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: question._id, type: "hard", label: question.questionText })}
                    >
                      <Trash2 size={16} />
                      Delete Permanently
                    </button>
                  </>
                }
              />
            )}
          </EntitySection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PaginationControls
            page={activePagination.page}
            totalPages={activePagination.totalPages}
            totalItems={activePagination.totalItems}
            pageSize={activePagination.limit}
            onPageChange={(page) => setActiveFilters((current) => ({ ...current, page }))}
            label="questions"
          />
          <PaginationControls
            page={deletedPagination.page}
            totalPages={deletedPagination.totalPages}
            totalItems={deletedPagination.totalItems}
            pageSize={deletedPagination.limit}
            onPageChange={(page) => setDeletedFilters((current) => ({ ...current, page }))}
            label="deleted questions"
          />
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit question" : "Create / import questions"}
        subtitle={
          editingId
            ? "Update a single question."
            : "Choose how you want to add questions for the selected topic. Supported spreadsheet columns: questionText, type, options, correctAnswerText, marks, difficulty, explanation."
        }
        size="wide"
        footer={
          <>
            <button type="button" className="neo-button" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              form={editingId ? "question-edit-form" : "question-create-form"}
              className="neo-button-primary"
            >
              {editingId ? "Update Question" : "Submit"}
            </button>
          </>
        }
      >
        {editingId ? (
          <form id="question-edit-form" onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Skill"
              value={editForm.skill}
              onChange={(event) => setEditForm({ ...editForm, skill: event.target.value, topicId: "" })}
            >
              <option value="">Select skill</option>
              {skills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Topic"
              value={editForm.topicId}
              onChange={(event) => setEditForm({ ...editForm, topicId: event.target.value })}
            >
              <option value="">Select topic</option>
              {(selectedSkill?.topics || []).map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.title}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Type"
              value={editForm.type}
              onChange={(event) => setEditForm({ ...editForm, type: event.target.value })}
            >
              <option value="mcq">MCQ</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
            </SelectField>
            <InputField
              label="Marks"
              type="number"
              value={editForm.marks}
              onChange={(value) => setEditForm({ ...editForm, marks: value })}
            />
            <div className="md:col-span-2">
              <TextareaField
                label="Question Text"
                value={editForm.questionText}
                onChange={(value) => setEditForm({ ...editForm, questionText: value })}
              />
            </div>
            <SelectField
              label="Difficulty"
              value={editForm.difficulty}
              onChange={(event) => setEditForm({ ...editForm, difficulty: event.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </SelectField>
            {editForm.type === "short_answer" ? (
              <InputField
                label="Correct Answer Text"
                value={editForm.correctAnswerText}
                onChange={(value) => setEditForm({ ...editForm, correctAnswerText: value })}
              />
            ) : (
              <InputField
                label="Options (text|true, text|false)"
                value={editForm.optionsText}
                onChange={(value) => setEditForm({ ...editForm, optionsText: value })}
              />
            )}
            <div className="md:col-span-2">
              <TextareaField
                label="Explanation"
                value={editForm.explanation}
                onChange={(value) => setEditForm({ ...editForm, explanation: value })}
              />
            </div>
          </form>
        ) : (
          <form id="question-create-form" onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <button type="button" className={createMode === "manual" ? "neo-button-primary" : "neo-button"} onClick={() => setCreateMode("manual")}>
                <SquarePen size={16} />
                Manual
              </button>
              <button type="button" className={createMode === "file" ? "neo-button-primary" : "neo-button"} onClick={() => setCreateMode("file")}>
                <Upload size={16} />
                Excel File
              </button>
              <button type="button" className={createMode === "link" ? "neo-button-primary" : "neo-button"} onClick={() => setCreateMode("link")}>
                <Link2 size={16} />
                Spreadsheet Link
              </button>
              <button type="button" className="neo-button" onClick={downloadTemplate}>
                <Download size={16} />
                Download Template
              </button>
            </div>

            {renderSharedContext()}

            {createMode === "manual" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">Add one or more questions manually for this topic.</p>
                  <button
                    type="button"
                    className="neo-button"
                    onClick={() => setManualRows((current) => [...current, createManualRow()])}
                  >
                    <CopyPlus size={16} />
                    Add Row
                  </button>
                </div>

                {manualRows.map((row, index) => (
                  <div key={index} className="neo-soft rounded-[24px] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Question Row {index + 1}</h4>
                      {manualRows.length > 1 ? (
                        <button
                          type="button"
                          className="neo-button-danger"
                          onClick={() =>
                            setManualRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
                          }
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="Type"
                        value={row.type}
                        onChange={(event) =>
                          setManualRows((current) =>
                            current.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, type: event.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="mcq">MCQ</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                      </SelectField>
                      <InputField
                        label="Marks"
                        type="number"
                        value={row.marks}
                        onChange={(value) =>
                          setManualRows((current) =>
                            current.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, marks: value } : item
                            )
                          )
                        }
                      />
                      <div className="md:col-span-2">
                        <TextareaField
                          label="Question Text"
                          value={row.questionText}
                          onChange={(value) =>
                            setManualRows((current) =>
                              current.map((item, rowIndex) =>
                                rowIndex === index ? { ...item, questionText: value } : item
                              )
                            )
                          }
                        />
                      </div>
                      <SelectField
                        label="Difficulty"
                        value={row.difficulty}
                        onChange={(event) =>
                          setManualRows((current) =>
                            current.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, difficulty: event.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </SelectField>
                      {row.type === "short_answer" ? (
                        <InputField
                          label="Correct Answer Text"
                          value={row.correctAnswerText}
                          onChange={(value) =>
                            setManualRows((current) =>
                              current.map((item, rowIndex) =>
                                rowIndex === index ? { ...item, correctAnswerText: value } : item
                              )
                            )
                          }
                        />
                      ) : (
                        <InputField
                          label="Options (text|true, text|false)"
                          value={row.optionsText}
                          onChange={(value) =>
                            setManualRows((current) =>
                              current.map((item, rowIndex) =>
                                rowIndex === index ? { ...item, optionsText: value } : item
                              )
                            )
                          }
                        />
                      )}
                      <div className="md:col-span-2">
                        <TextareaField
                          label="Explanation"
                          value={row.explanation}
                          onChange={(value) =>
                            setManualRows((current) =>
                              current.map((item, rowIndex) =>
                                rowIndex === index ? { ...item, explanation: value } : item
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {createMode === "file" ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">
                  Upload an `.xlsx` file from the system. The first sheet should include columns:
                  `questionText`, `type`, `options`, `correctAnswerText`, `marks`, `difficulty`,
                  and `explanation`.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                  className="neo-input"
                />
              </div>
            ) : null}

            {createMode === "link" ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">
                  Paste a spreadsheet link. Google Sheets links are supported and will be fetched by
                  the backend as an Excel export.
                </p>
                <InputField
                  label="Spreadsheet Link"
                  value={spreadsheetLink}
                  onChange={setSpreadsheetLink}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>
            ) : null}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete question permanently?" : "Remove question from active list?"}
        description={deleteState ? `${deleteState.label} is the question affected by this action.` : ""}
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Question"}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
