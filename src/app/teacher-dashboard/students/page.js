"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, RotateCcw, Trash2, Users, Layers3, Archive } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import { ButtonLoader } from "../../../components/loaders";
import {
  ConfirmDialog,
  DetailModal,
  InputField,
  Modal,
  PaginationControls,
  PageHeader,
  SearchField,
  SegmentedTabs,
  SelectField,
  StatCard,
  TextareaField,
  Toast,
} from "../../../components/ui-kit";

const emptyForm = {
  name: "",
  email: "",
  passwordMode: "email_random",
  batch: "",
  enrollmentNumber: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
};

const PAGE_SIZE = 8;

const emptyPagination = {
  page: 1,
  totalPages: 1,
  totalItems: 0,
  limit: PAGE_SIZE,
};

function buildStudentSections(student) {
  if (!student) {
    return [];
  }

  return [
    {
      title: "Student Profile",
      items: [
        { label: "Name", value: student.name },
        { label: "Email", value: student.email },
        { label: "Enrollment Number", value: student.enrollmentNumber },
        { label: "Phone", value: student.phone },
      ],
    },
    {
      title: "Academic Alignment",
      items: [
        { label: "Batch", value: student.batch?.batchName },
        { label: "Batch Code", value: student.batch?.batchCode },
        {
          label: "Courses",
          value: (student.batch?.courses || []).map((course) => course.title).join(", "),
        },
        { label: "Status", value: student.isDeleted ? "Deleted" : "Active" },
      ],
    },
    {
      title: "Family And Address",
      items: [
        { label: "Guardian Name", value: student.guardianName },
        { label: "Guardian Phone", value: student.guardianPhone },
        { label: "Address", value: student.address },
        {
          label: "Created",
          value: student.createdAt ? new Date(student.createdAt).toLocaleString() : "",
        },
      ],
    },
  ];
}

function StudentRowCard({ student, meta, actions }) {
  return (
    <article className="neo-soft rounded-[26px] p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold tracking-[-0.02em]">{student.name}</h3>
              <p className="mt-1 truncate text-sm text-[var(--muted)]">{student.email || "No email added"}</p>
            </div>
            <span className="w-fit rounded-full bg-[var(--accent)]/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {student.batch?.batchName || "No batch"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {meta.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[var(--border)]/60 bg-white/20 px-4 py-3 backdrop-blur-md dark:bg-white/5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">{item.label}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.value || "Not available"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
      </div>
    </article>
  );
}

function StudentListSection({
  title,
  eyebrow,
  description,
  items,
  pagination,
  actionsForStudent,
  emptyText,
  paginationLabel,
  onPageChange,
}) {
  return (
    <section className="neo-panel rounded-[32px] p-5 md:p-7">
      <div className="border-b border-[var(--border)]/70 pb-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">{eyebrow}</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">{description}</p>
          </div>
          <span className="neo-badge">{pagination.totalItems}</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-8 text-sm text-[var(--muted)]">
            {emptyText}
          </div>
        ) : (
          items.map((student) => (
            <StudentRowCard
              key={student._id}
              student={student}
              meta={[
                { label: "Enrollment", value: student.enrollmentNumber },
                { label: "Phone", value: student.phone },
                { label: "Guardian", value: student.guardianName },
              ]}
              actions={actionsForStudent(student)}
            />
          ))
        )}
      </div>

      <div className="mt-6">
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.limit}
          onPageChange={onPageChange}
          label={paginationLabel}
        />
      </div>
    </section>
  );
}

export default function StudentsPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [courses, setCourses] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [filteredPagination, setFilteredPagination] = useState(emptyPagination);
  const [allPagination, setAllPagination] = useState(emptyPagination);
  const [deletedPagination, setDeletedPagination] = useState(emptyPagination);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackPassword, setFallbackPassword] = useState(null);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({
    courseId: "",
    batchId: "",
    page: 1,
  });
  const [allFilters, setAllFilters] = useState({
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

  const loadCourses = async () => {
    const [coursesRes, batchesRes] = await Promise.all([api.get("/courses", { headers }), api.get("/batches", { headers })]);
    setCourses(coursesRes.data.courses || []);
    setAllBatches(batchesRes.data.batches || []);
  };

  const loadBatchOptions = async (courseId = "") => {
    const response = await api.get("/batches", {
      headers,
      params: courseId ? { courseId } : {},
    });
    setBatchOptions(response.data.batches || []);
  };

  const loadFilteredStudents = async (nextFilters = filters) => {
    const response = await api.get("/students", {
      headers,
      params: {
        page: nextFilters.page,
        limit: PAGE_SIZE,
        courseId: nextFilters.courseId || undefined,
        batchId: nextFilters.batchId || undefined,
      },
    });

    setFilteredStudents(response.data.students || []);
    setFilteredPagination(response.data.pagination || emptyPagination);
  };

  const loadAllStudents = async (nextFilters = allFilters) => {
    const response = await api.get("/students", {
      headers,
      params: {
        page: nextFilters.page,
        limit: PAGE_SIZE,
        search: nextFilters.search || undefined,
        sortBy: nextFilters.sortBy,
        sortOrder: nextFilters.sortOrder,
      },
    });

    setAllStudents(response.data.students || []);
    setAllPagination(response.data.pagination || emptyPagination);
  };

  const loadDeletedStudents = async (nextFilters = deletedFilters) => {
    const response = await api.get("/students", {
      headers,
      params: {
        page: nextFilters.page,
        limit: PAGE_SIZE,
        search: nextFilters.search || undefined,
        sortBy: nextFilters.sortBy,
        sortOrder: nextFilters.sortOrder,
        deleted: true,
      },
    });

    setDeletedStudents(response.data.students || []);
    setDeletedPagination(response.data.pagination || emptyPagination);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    Promise.all([loadCourses(), loadBatchOptions()]).catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadBatchOptions(filters.courseId).catch(() => null);
    loadFilteredStudents(filters).catch(() => null);
  }, [token, filters]);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadAllStudents(allFilters).catch(() => null);
  }, [token, allFilters]);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadDeletedStudents(deletedFilters).catch(() => null);
  }, [token, deletedFilters]);

  const studentTabs = useMemo(
    () => [
      { value: "all", label: "All Students", count: allPagination.totalItems },
      { value: "aligned", label: "By Course / Batch", count: filteredPagination.totalItems },
      { value: "deleted", label: "Deleted Students", count: deletedPagination.totalItems },
    ],
    [allPagination.totalItems, deletedPagination.totalItems, filteredPagination.totalItems]
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setIsSubmitting(false);
    setForm(emptyForm);
  };

  const refreshLists = async () => {
    await Promise.all([
      loadFilteredStudents(filters),
      loadAllStudents(allFilters),
      loadDeletedStudents(deletedFilters),
      loadBatchOptions(filters.courseId),
    ]);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setForm({
      name: student.name || "",
      email: student.email || "",
      passwordMode: "email_random",
      batch: student.batch?._id || "",
      enrollmentNumber: student.enrollmentNumber || "",
      phone: student.phone || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      address: student.address || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const payload = { ...form };

    if (editingId) {
      delete payload.passwordMode;
    }

    try {
      setIsSubmitting(true);

      if (editingId) {
        await api.put(`/students/${editingId}`, payload, { headers });
        setToast({ variant: "success", title: "Student updated" });
      } else {
        const response = await api.post("/students", payload, { headers });

        if (form.passwordMode === "manual_random" && response.data.temporaryPassword) {
          setFallbackPassword({
            studentName: response.data.student?.name || form.name,
            email: response.data.student?.email || form.email,
            password: response.data.temporaryPassword,
            mode: form.passwordMode,
          });
          setToast({
            variant: "success",
            title: "Student created with random password",
            description: "The generated password is shown in a separate modal so you can share it manually.",
          });
        } else {
          setToast({
            variant: "success",
            title: response.data.mailSent ? "Student created and password emailed" : "Student created",
          });
        }
      }

      closeModal();
      await refreshLists();
    } catch (error) {
      setIsSubmitting(false);
      setToast({
        variant: "error",
        title: "Unable to save student",
        description: error.response?.data?.message || "Please review the form and try again.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteState) {
      return;
    }

    try {
      if (deleteState.type === "hard") {
        await api.delete(`/students/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/students/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Student removed permanently" : "Student moved to deleted",
      });
      setDeleteState(null);
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete student.",
      });
    }
  };

  const restoreStudent = async (id) => {
    try {
      await api.patch(`/students/restore/${id}`, {}, { headers });
      setToast({ variant: "success", title: "Student restored" });
      await refreshLists();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to restore student",
        description: error.response?.data?.message || "Please try again.",
      });
    }
  };

  const summaryCards = [
    {
      label: "Visible Students",
      value:
        activePanel === "all"
          ? allPagination.totalItems
          : activePanel === "aligned"
            ? filteredPagination.totalItems
            : deletedPagination.totalItems,
      hint: "Count for the currently open section",
      icon: Users,
    },
    {
      label: "Available Batches",
      value: allBatches.length,
      hint: "Used while assigning students",
      icon: Layers3,
    },
    {
      label: "Deleted Records",
      value: deletedPagination.totalItems,
      hint: "Soft-deleted students ready for review",
      icon: Archive,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Students"
          title="Student management with cleaner sections and proper alignment"
          description="The page is split into a control rail and a focused work surface so search, filters, section switching, and student actions no longer fight each other."
          action={
            <button type="button" className="neo-button-primary" onClick={openCreateModal}>
              <Plus size={18} />
              Add Student
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} hint={card.hint} icon={card.icon} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="neo-panel rounded-[32px] p-5 md:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Sections</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Choose the student view</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Each section has its own clean workspace instead of mixing every state on one screen.
              </p>
              <div className="mt-5">
                <SegmentedTabs tabs={studentTabs} value={activePanel} onChange={setActivePanel} className="flex-col" />
              </div>
            </section>

            {activePanel === "all" ? (
              <section className="neo-panel rounded-[32px] p-5 md:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">All Students Filters</p>
                <div className="mt-5 space-y-4">
                  <SearchField
                    value={allFilters.search}
                    onChange={(value) => setAllFilters((current) => ({ ...current, search: value, page: 1 }))}
                    placeholder="Search name, email, enrollment, phone"
                  />
                  <SelectField
                    label="Sort By"
                    value={allFilters.sortBy}
                    onChange={(event) =>
                      setAllFilters((current) => ({ ...current, sortBy: event.target.value, page: 1 }))
                    }
                  >
                    <option value="createdAt">Newest</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="enrollmentNumber">Enrollment No.</option>
                  </SelectField>
                  <SelectField
                    label="Order"
                    value={allFilters.sortOrder}
                    onChange={(event) =>
                      setAllFilters((current) => ({ ...current, sortOrder: event.target.value, page: 1 }))
                    }
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </SelectField>
                </div>
              </section>
            ) : null}

            {activePanel === "aligned" ? (
              <section className="neo-panel rounded-[32px] p-5 md:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Alignment Filters</p>
                <div className="mt-5 space-y-4">
                  <SelectField
                    label="Course"
                    value={filters.courseId}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        courseId: event.target.value,
                        batchId: "",
                        page: 1,
                      }))
                    }
                  >
                    <option value="">All courses</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Batch"
                    value={filters.batchId}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        batchId: event.target.value,
                        page: 1,
                      }))
                    }
                    disabled={!batchOptions.length}
                  >
                    <option value="">All batches</option>
                    {batchOptions.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchName}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </section>
            ) : null}

            {activePanel === "deleted" ? (
              <section className="neo-panel rounded-[32px] p-5 md:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Deleted Filters</p>
                <div className="mt-5 space-y-4">
                  <SearchField
                    value={deletedFilters.search}
                    onChange={(value) => setDeletedFilters((current) => ({ ...current, search: value, page: 1 }))}
                    placeholder="Search deleted students"
                  />
                  <SelectField
                    label="Sort By"
                    value={deletedFilters.sortBy}
                    onChange={(event) =>
                      setDeletedFilters((current) => ({ ...current, sortBy: event.target.value, page: 1 }))
                    }
                  >
                    <option value="createdAt">Newest</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="enrollmentNumber">Enrollment No.</option>
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
              </section>
            ) : null}
          </aside>

          <div className="min-w-0">
            {activePanel === "all" ? (
              <StudentListSection
                title="All Students"
                eyebrow="Main Registry"
                description="The primary list for active students, with search and sorting isolated in the left rail for cleaner visual rhythm."
                items={allStudents}
                pagination={allPagination}
                emptyText="No students found."
                paginationLabel="students"
                onPageChange={(page) => setAllFilters((current) => ({ ...current, page }))}
                actionsForStudent={(student) => (
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedStudent(student)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(student)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: student._id, label: student.name, type: "soft" })}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              />
            ) : null}

            {activePanel === "aligned" ? (
              <StudentListSection
                title="Students By Course / Batch"
                eyebrow="Aligned View"
                description="Use this section when you need a tighter academic slice instead of the full registry."
                items={filteredStudents}
                pagination={filteredPagination}
                emptyText="No students found for this course and batch combination."
                paginationLabel="filtered students"
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                actionsForStudent={(student) => (
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedStudent(student)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(student)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: student._id, label: student.name, type: "soft" })}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              />
            ) : null}

            {activePanel === "deleted" ? (
              <StudentListSection
                title="Deleted Students"
                eyebrow="Archive"
                description="Deleted records are separated here so the main registry stays professional and easy to scan."
                items={deletedStudents}
                pagination={deletedPagination}
                emptyText="No deleted students."
                paginationLabel="deleted students"
                onPageChange={(page) => setDeletedFilters((current) => ({ ...current, page }))}
                actionsForStudent={(student) => (
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedStudent(student)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => restoreStudent(student._id)}>
                      <RotateCcw size={16} />
                      Restore
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: student._id, label: student.name, type: "hard" })}
                    >
                      <Trash2 size={16} />
                      Delete Permanently
                    </button>
                  </>
                )}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit student" : "Add student"}
        subtitle={
          editingId
            ? "Update student profile details here."
            : form.passwordMode === "manual_random"
              ? "A random password will be generated and shown to you for manual sharing."
              : "A secure random password will be generated automatically and emailed to the student."
        }
        footer={
          <button
            type="submit"
            form="student-form"
            disabled={isSubmitting}
            className="neo-button-primary"
          >
            {isSubmitting ? (
              <ButtonLoader label={editingId ? "Saving..." : "Creating..."} />
            ) : editingId ? (
              "Update Student"
            ) : (
              "Create Student"
            )}
          </button>
        }
        size="wide"
      >
        <form id="student-form" onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <InputField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
          />
          {!editingId ? (
            <div className="md:col-span-2">
              <p className="mb-2 block text-sm font-medium">Password Setup</p>
              <SegmentedTabs
                tabs={[
                  { value: "email_random", label: "Send Random Password" },
                  { value: "manual_random", label: "Manual Share Random Password" },
                ]}
                value={form.passwordMode}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    passwordMode: value,
                  }))
                }
              />
              <p className="mt-2 text-sm text-[var(--muted)]">
                {form.passwordMode === "manual_random"
                  ? "The server will generate a random password and show it to the teacher for manual sharing."
                  : "A random password will be generated by the server and sent to the student's email address."}
              </p>
            </div>
          ) : null}
          <InputField
            label="Enrollment Number"
            value={form.enrollmentNumber}
            onChange={(value) => setForm({ ...form, enrollmentNumber: value })}
          />
          <InputField label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <SelectField
            label="Batch"
            value={form.batch}
            onChange={(event) => setForm({ ...form, batch: event.target.value })}
          >
            <option value="">Select batch</option>
            {allBatches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Guardian Name"
            value={form.guardianName}
            onChange={(value) => setForm({ ...form, guardianName: value })}
          />
          <InputField
            label="Guardian Phone"
            value={form.guardianPhone}
            onChange={(value) => setForm({ ...form, guardianPhone: value })}
          />
          <div className="md:col-span-2">
            <TextareaField label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          </div>
        </form>
      </Modal>

      <DetailModal
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name || "Student Details"}
        subtitle="Full student information in the same blurred neumorphic overlay."
        sections={buildStudentSections(selectedStudent)}
      />

      <Modal
        open={Boolean(fallbackPassword)}
        onClose={() => setFallbackPassword(null)}
        title={
          fallbackPassword?.mode === "manual_random"
            ? "Share Random Password"
            : "Password Email Not Sent"
        }
        subtitle={
          fallbackPassword?.mode === "manual_random"
            ? "The student was created successfully and the generated random password is ready for manual sharing."
            : "The student was created successfully, but the random password could not be emailed from the server."
        }
        footer={
          <button type="button" className="neo-button-primary" onClick={() => setFallbackPassword(null)}>
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[var(--border)]/60 bg-white/20 p-4 text-sm backdrop-blur-md dark:bg-white/5">
            <p className="font-semibold">{fallbackPassword?.studentName || "Student"}</p>
            <p className="mt-1 text-[var(--muted)]">{fallbackPassword?.email || "No email available"}</p>
          </div>
          <div className="rounded-[18px] border border-amber-400/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">Temporary Password</p>
            <p className="mt-2 break-all font-mono text-base">{fallbackPassword?.password || ""}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Share this password manually with the student and ask them to change it after login.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete student permanently?" : "Move student to deleted?"}
        description={
          deleteState
            ? deleteState.type === "hard"
              ? `${deleteState.label} will be removed permanently.`
              : `${deleteState.label} will be removed from active student lists.`
            : ""
        }
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Student"}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
