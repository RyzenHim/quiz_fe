"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import {
  ConfirmDialog,
  DetailModal,
  EntityCard,
  EntitySection,
  InputField,
  Modal,
  PageHeader,
  SegmentedTabs,
  SelectField,
  TextareaField,
  Toast,
} from "../../../components/ui-kit";

const emptyForm = { batchName: "", batchCode: "", description: "", courses: [] };

export default function BatchesPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [batches, setBatches] = useState([]);
  const [deletedBatches, setDeletedBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState("active");
  const [selectedBatch, setSelectedBatch] = useState(null);

  const batchSections = selectedBatch
    ? [
        {
          title: "Batch Overview",
          items: [
            { label: "Batch Name", value: selectedBatch.batchName },
            { label: "Batch Code", value: selectedBatch.batchCode },
            { label: "Description", value: selectedBatch.description },
            { label: "Status", value: selectedBatch.isDeleted ? "Deleted" : "Active" },
          ],
        },
        {
          title: "Course Alignment",
          items: [
            {
              label: "Courses",
              value: (selectedBatch.courses || []).map((course) => course.title).join(", "),
            },
            { label: "Student Count", value: String((selectedBatch.students || []).length) },
            {
              label: "Created",
              value: selectedBatch.createdAt ? new Date(selectedBatch.createdAt).toLocaleString() : "",
            },
            { label: "Updated", value: selectedBatch.updatedAt ? new Date(selectedBatch.updatedAt).toLocaleString() : "" },
          ],
        },
      ]
    : [];

  const loadData = async () => {
    const [activeRes, deletedRes, coursesRes] = await Promise.all([
      api.get("/batches", { headers }),
      api.get("/batches?deleted=true", { headers }),
      api.get("/courses", { headers }),
    ]);
    setBatches(activeRes.data.batches || []);
    setDeletedBatches(deletedRes.data.batches || []);
    setCourses(coursesRes.data.courses || []);
  };

  useEffect(() => {
    if (!token) return;
    loadData().catch(() => null);
  }, [token]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (batch) => {
    setEditingId(batch._id);
    setForm({
      batchName: batch.batchName || "",
      batchCode: batch.batchCode || "",
      description: batch.description || "",
      courses: (batch.courses || []).map((course) => course._id),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/batches/${editingId}`, form, { headers });
        setToast({ variant: "success", title: "Batch updated" });
      } else {
        await api.post("/batches", form, { headers });
        setToast({ variant: "success", title: "Batch created" });
      }
      closeModal();
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to save batch",
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
        await api.delete(`/batches/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/batches/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Batch removed permanently" : "Batch moved to deleted",
      });
      setDeleteState(null);
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete batch.",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Batches"
          title="Organize students into polished cohort structures"
          description="Courses can be grouped into batches through a dedicated modal, and every delete action now pauses behind a warning confirmation."
          action={
            <button type="button" className="neo-button-primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Add Batch
            </button>
          }
        />

        <section className="neo-panel rounded-[30px] p-4 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Batch Views</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Keep deleted batches off the main working surface</h2>
            </div>
            <SegmentedTabs
              tabs={[
                { value: "active", label: "Active Batches", count: batches.length },
                { value: "deleted", label: "Deleted Batches", count: deletedBatches.length },
              ]}
              value={activePanel}
              onChange={setActivePanel}
            />
          </div>
        </section>

        {activePanel === "active" ? (
          <EntitySection title="Active Batches" items={batches} emptyText="No active batches found.">
            {(batch) => (
              <EntityCard
                key={batch._id}
                title={batch.batchName}
                subtitle={(batch.courses || []).map((course) => course.title).join(", ") || "No course"}
                meta={batch.batchCode || "No code"}
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedBatch(batch)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(batch)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: batch._id, type: "soft", label: batch.batchName })}
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
          <EntitySection title="Deleted Batches" items={deletedBatches} emptyText="No deleted batches.">
            {(batch) => (
              <EntityCard
                key={batch._id}
                title={batch.batchName}
                subtitle={batch.batchCode || "No code"}
                meta="Deleted records"
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedBatch(batch)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: batch._id, type: "hard", label: batch.batchName })}
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
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit batch" : "Create batch"}
        subtitle="Define the cohort, its code, and the course alignment in one modal."
        footer={
          <button type="submit" form="batch-form" className="neo-button-primary">
            {editingId ? "Update Batch" : "Create Batch"}
          </button>
        }
      >
        <form id="batch-form" onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Batch Name"
            value={form.batchName}
            onChange={(value) => setForm({ ...form, batchName: value })}
          />
          <InputField
            label="Batch Code"
            value={form.batchCode}
            onChange={(value) => setForm({ ...form, batchCode: value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
            />
          </div>
          <div className="md:col-span-2">
            <SelectField
              label="Courses"
              value={form.courses}
              multiple
              onChange={(event) =>
                setForm({
                  ...form,
                  courses: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </SelectField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete batch permanently?" : "Remove batch from active list?"}
        description={deleteState ? `${deleteState.label} is the batch affected by this action.` : ""}
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Batch"}
      />

      <DetailModal
        open={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch?.batchName || "Batch Details"}
        subtitle="A full batch view with neumorphism and blurred background treatment."
        sections={batchSections}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
