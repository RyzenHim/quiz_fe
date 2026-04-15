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
  Toast,
} from "../../../components/ui-kit";

const emptyForm = {
  title: "",
  code: "",
  category: "",
  level: "beginner",
  durationInWeeks: "",
  skills: [],
};

export default function CoursesPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [courses, setCourses] = useState([]);
  const [deletedCourses, setDeletedCourses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState("active");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courseSections = selectedCourse
    ? [
        {
          title: "Course Overview",
          items: [
            { label: "Title", value: selectedCourse.title },
            { label: "Code", value: selectedCourse.code },
            { label: "Category", value: selectedCourse.category },
            { label: "Level", value: selectedCourse.level },
          ],
        },
        {
          title: "Delivery Details",
          items: [
            { label: "Duration In Weeks", value: String(selectedCourse.durationInWeeks || "") },
            {
              label: "Skills",
              value: (selectedCourse.skills || []).map((skill) => skill.name).join(", "),
            },
            { label: "Status", value: selectedCourse.isDeleted ? "Deleted" : "Active" },
            {
              label: "Created",
              value: selectedCourse.createdAt ? new Date(selectedCourse.createdAt).toLocaleString() : "",
            },
          ],
        },
      ]
    : [];

  const loadData = async () => {
    const [activeRes, deletedRes, skillsRes] = await Promise.all([
      api.get("/courses", { headers }),
      api.get("/courses?deleted=true", { headers }),
      api.get("/skills", { headers }),
    ]);
    setCourses(activeRes.data.courses || []);
    setDeletedCourses(deletedRes.data.courses || []);
    setSkills(skillsRes.data.skills || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    loadData().catch(() => null);
  }, [token]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (course) => {
    setEditingId(course._id);
    setForm({
      title: course.title || "",
      code: course.code || "",
      category: course.category || "",
      level: course.level || "beginner",
      durationInWeeks: course.durationInWeeks || "",
      skills: (course.skills || []).map((skill) => skill._id),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      durationInWeeks: form.durationInWeeks ? Number(form.durationInWeeks) : undefined,
      status: "active",
    };

    try {
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload, { headers });
        setToast({ variant: "success", title: "Course updated" });
      } else {
        await api.post("/courses", payload, { headers });
        setToast({ variant: "success", title: "Course created" });
      }
      closeModal();
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to save course",
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
        await api.delete(`/courses/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/courses/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Course removed permanently" : "Course archived from active list",
      });
      setDeleteState(null);
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete course.",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Courses"
          title="Build aligned course structures"
          description="Skills and course metadata now sit behind a polished modal flow, with a clearer confirmation step before destructive actions."
          action={
            <button type="button" className="neo-button-primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Add Course
            </button>
          }
        />

        <section className="neo-panel rounded-[30px] p-4 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Course Views</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Keep active courses separate from deleted records</h2>
            </div>
            <SegmentedTabs
              tabs={[
                { value: "active", label: "Active Courses", count: courses.length },
                { value: "deleted", label: "Deleted Courses", count: deletedCourses.length },
              ]}
              value={activePanel}
              onChange={setActivePanel}
            />
          </div>
        </section>

        {activePanel === "active" ? (
          <EntitySection title="Active Courses" items={courses} emptyText="No active courses found.">
            {(course) => (
              <EntityCard
                key={course._id}
                title={course.title}
                subtitle={`${course.category || "General"} | ${(course.skills || []).map((skill) => skill.name).join(", ") || "No skills"}`}
                meta={`${course.level || "beginner"} level`}
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedCourse(course)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(course)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: course._id, type: "soft", label: course.title })}
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
          <EntitySection title="Deleted Courses" items={deletedCourses} emptyText="No deleted courses.">
            {(course) => (
              <EntityCard
                key={course._id}
                title={course.title}
                subtitle={course.category || "General"}
                meta="Deleted records"
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedCourse(course)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: course._id, type: "hard", label: course.title })}
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
        title={editingId ? "Edit course" : "Create course"}
        subtitle="Map course structure, level, and linked skills in one focused modal."
        footer={
          <button type="submit" form="course-form" className="neo-button-primary">
            {editingId ? "Update Course" : "Create Course"}
          </button>
        }
      >
        <form id="course-form" onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <InputField label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <InputField label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
          <InputField
            label="Category"
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
          />
          <InputField
            label="Duration In Weeks"
            type="number"
            value={form.durationInWeeks}
            onChange={(value) => setForm({ ...form, durationInWeeks: value })}
          />
          <SelectField
            label="Level"
            value={form.level}
            onChange={(event) => setForm({ ...form, level: event.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </SelectField>
          <SelectField
            label="Skills"
            value={form.skills}
            multiple
            onChange={(event) =>
              setForm({
                ...form,
                skills: Array.from(event.target.selectedOptions, (option) => option.value),
              })
            }
          >
            {skills.map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </SelectField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete course permanently?" : "Remove course from active list?"}
        description={deleteState ? `${deleteState.label} is the course affected by this action.` : ""}
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Course"}
      />

      <DetailModal
        open={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse?.title || "Course Details"}
        subtitle="Full course information with the same blurred neumorphic treatment."
        sections={courseSections}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
