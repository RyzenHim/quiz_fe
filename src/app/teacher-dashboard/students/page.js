"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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

const emptyForm = {
  name: "",
  email: "",
  password: "",
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
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
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
    const [coursesRes, batchesRes] = await Promise.all([
      api.get("/courses", { headers }),
      api.get("/batches", { headers }),
    ]);
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

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
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
      password: "",
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
    const payload = editingId && !form.password ? { ...form, password: undefined } : form;

    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, payload, { headers });
        setToast({ variant: "success", title: "Student updated" });
      } else {
        await api.post("/students", payload, { headers });
        setToast({ variant: "success", title: "Student created" });
      }

      closeModal();
      await refreshLists();
    } catch (error) {
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

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Students"
          title="View students by alignment and across the full system"
          description="The left column filters students by course and aligned batches from the backend, while the right column gives you the complete searchable and sortable student list with server-side pagination."
          action={
            <button type="button" className="neo-button-primary" onClick={openCreateModal}>
              <Plus size={18} />
              Add Student
            </button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <EntitySection
              title="Students By Course / Batch"
              items={filteredStudents}
              count={filteredPagination.totalItems}
              emptyText="No students found for this course/batch combination."
              controls={
                <div className="grid gap-3 md:grid-cols-2">
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
              }
            >
              {(student) => (
                <EntityCard
                  key={student._id}
                  title={student.name}
                  subtitle={`${student.batch?.batchName || "No batch"} | ${student.enrollmentNumber}`}
                  meta={student.email}
                  actions={
                    <>
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
                  }
                />
              )}
            </EntitySection>

            <PaginationControls
              page={filteredPagination.page}
              totalPages={filteredPagination.totalPages}
              totalItems={filteredPagination.totalItems}
              pageSize={filteredPagination.limit}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              label="filtered students"
            />
          </div>

          <div className="space-y-6">
            <EntitySection
              title="All Students"
              items={allStudents}
              count={allPagination.totalItems}
              emptyText="No students found."
              controls={
                <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                  <SearchField
                    value={allFilters.search}
                    onChange={(value) =>
                      setAllFilters((current) => ({
                        ...current,
                        search: value,
                        page: 1,
                      }))
                    }
                    placeholder="Search name, email, enrollment, phone"
                  />
                  <SelectField
                    label="Sort By"
                    value={allFilters.sortBy}
                    onChange={(event) =>
                      setAllFilters((current) => ({
                        ...current,
                        sortBy: event.target.value,
                        page: 1,
                      }))
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
                      setAllFilters((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </SelectField>
                </div>
              }
            >
              {(student) => (
                <EntityCard
                  key={student._id}
                  title={student.name}
                  subtitle={`${student.email} | ${student.batch?.batchName || "No batch"} | ${student.enrollmentNumber}`}
                  meta={student.phone || "No phone provided"}
                  actions={
                    <>
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
                  }
                />
              )}
            </EntitySection>

            <PaginationControls
              page={allPagination.page}
              totalPages={allPagination.totalPages}
              totalItems={allPagination.totalItems}
              pageSize={allPagination.limit}
              onPageChange={(page) => setAllFilters((current) => ({ ...current, page }))}
              label="students"
            />

            <EntitySection
              title="Deleted Students"
              items={deletedStudents}
              count={deletedPagination.totalItems}
              emptyText="No deleted students."
              controls={
                <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                  <SearchField
                    value={deletedFilters.search}
                    onChange={(value) =>
                      setDeletedFilters((current) => ({
                        ...current,
                        search: value,
                        page: 1,
                      }))
                    }
                    placeholder="Search deleted students"
                  />
                  <SelectField
                    label="Sort By"
                    value={deletedFilters.sortBy}
                    onChange={(event) =>
                      setDeletedFilters((current) => ({
                        ...current,
                        sortBy: event.target.value,
                        page: 1,
                      }))
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
                      setDeletedFilters((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </SelectField>
                </div>
              }
            >
              {(student) => (
                <EntityCard
                  key={student._id}
                  title={student.name}
                  subtitle={`${student.email} | ${student.enrollmentNumber}`}
                  meta="Deleted records"
                  actions={
                    <>
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
                        Delete
                      </button>
                    </>
                  }
                />
              )}
            </EntitySection>

            <PaginationControls
              page={deletedPagination.page}
              totalPages={deletedPagination.totalPages}
              totalItems={deletedPagination.totalItems}
              pageSize={deletedPagination.limit}
              onPageChange={(page) => setDeletedFilters((current) => ({ ...current, page }))}
              label="deleted students"
            />
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit student" : "Add student"}
        subtitle="Add or update a student, and let the backend enforce batch alignment."
        footer={
          <>
            <button type="button" className="neo-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="student-form" className="neo-button-primary">
              {editingId ? "Update Student" : "Create Student"}
            </button>
          </>
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
          <InputField
            label={editingId ? "Password (optional)" : "Password"}
            type="password"
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
          />
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
            <TextareaField
              label="Address"
              value={form.address}
              onChange={(value) => setForm({ ...form, address: value })}
            />
          </div>
        </form>
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
