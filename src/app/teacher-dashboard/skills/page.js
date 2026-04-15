"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2, Layers3, BookText } from "lucide-react";
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
  StatCard,
  TextareaField,
  Toast,
} from "../../../components/ui-kit";

const createEmptyTopic = () => ({
  _id: undefined,
  title: "",
  description: "",
  isActive: true,
});

const emptyForm = { name: "", description: "", topics: [createEmptyTopic()] };

const sanitizeTopics = (topics = []) =>
  topics
    .map((topic) => ({
      _id: topic._id || undefined,
      title: String(topic.title || "").trim(),
      description: String(topic.description || "").trim(),
      isActive: topic.isActive !== false,
    }))
    .filter((topic) => topic.title);

export default function SkillsPage() {
  const { auth } = useAppContext();
  const token = auth?.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [skills, setSkills] = useState([]);
  const [deletedSkills, setDeletedSkills] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState("active");
  const [selectedSkill, setSelectedSkill] = useState(null);

  const skillSections = useMemo(() => {
    if (!selectedSkill) {
      return [];
    }

    const topicItems =
      (selectedSkill.topics || []).map((topic, index) => ({
        label: `Topic ${index + 1}`,
        value: topic.description ? `${topic.title} - ${topic.description}` : topic.title,
      })) || [];

    return [
      {
        title: "Skill Overview",
        items: [
          { label: "Name", value: selectedSkill.name },
          { label: "Description", value: selectedSkill.description },
          { label: "Topics Count", value: String((selectedSkill.topics || []).length) },
          { label: "Status", value: selectedSkill.isDeleted ? "Deleted" : "Active" },
        ],
      },
      {
        title: "Topics",
        description: "Each topic can carry its own description so questions and quizzes can align more clearly.",
        items: topicItems.length ? topicItems : [{ label: "Topic List", value: "No topics added" }],
        columns: 1,
      },
    ];
  }, [selectedSkill]);

  const loadData = async () => {
    const [activeRes, deletedRes] = await Promise.all([
      api.get("/skills", { headers }),
      api.get("/skills?deleted=true", { headers }),
    ]);
    setSkills(activeRes.data.skills || []);
    setDeletedSkills(deletedRes.data.skills || []);
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

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleEdit = (skill) => {
    setEditingId(skill._id);
    setForm({
      name: skill.name || "",
      description: skill.description || "",
      topics:
        (skill.topics || []).length > 0
          ? skill.topics.map((topic) => ({
              _id: topic._id,
              title: topic.title || "",
              description: topic.description || "",
              isActive: topic.isActive !== false,
            }))
          : [createEmptyTopic()],
    });
    setModalOpen(true);
  };

  const updateTopic = (index, field, value) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, [field]: value } : topic
      ),
    }));
  };

  const addTopicRow = () => {
    setForm((current) => ({
      ...current,
      topics: [...current.topics, createEmptyTopic()],
    }));
  };

  const removeTopicRow = (index) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.length === 1
        ? [createEmptyTopic()]
        : current.topics.filter((_, topicIndex) => topicIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        topics: sanitizeTopics(form.topics),
      };

      if (editingId) {
        await api.put(`/skills/${editingId}`, payload, { headers });
        setToast({ variant: "success", title: "Skill updated" });
      } else {
        await api.post("/skills", payload, { headers });
        setToast({ variant: "success", title: "Skill created" });
      }
      closeModal();
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to save skill",
        description: error.response?.data?.message || "Please review the skill and topic details, then try again.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteState) {
      return;
    }
    try {
      if (deleteState.type === "hard") {
        await api.delete(`/skills/hard-delete/${deleteState.id}`, { headers });
      } else {
        await api.delete(`/skills/soft-delete/${deleteState.id}`, { headers });
      }
      setToast({
        variant: "warning",
        title: deleteState.type === "hard" ? "Skill removed permanently" : "Skill moved to deleted",
      });
      setDeleteState(null);
      await loadData();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Delete failed",
        description: error.response?.data?.message || "Unable to delete skill.",
      });
    }
  };

  const topicCount = skills.reduce((sum, skill) => sum + (skill.topics || []).length, 0);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Skills"
          title="Manage skills and their topic libraries"
          description="Teachers can now add topics one by one, keep topic descriptions aligned, and safely preserve topic wiring for questions and quiz creation."
          action={
            <button type="button" className="neo-button-primary" onClick={openCreateModal}>
              <Plus size={18} />
              Add Skill
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active Skills" value={skills.length} hint="Current teacher skill library" icon={Layers3} />
          <StatCard label="Total Topics" value={topicCount} hint="Topics stored inside active skills" icon={BookText} />
          <StatCard label="Deleted Skills" value={deletedSkills.length} hint="Archived skill records" icon={Trash2} />
        </div>

        <section className="neo-panel rounded-[30px] p-4 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Skill Views</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Browse active skills without deleted noise on the same screen
              </h2>
            </div>
            <SegmentedTabs
              tabs={[
                { value: "active", label: "Active Skills", count: skills.length },
                { value: "deleted", label: "Deleted Skills", count: deletedSkills.length },
              ]}
              value={activePanel}
              onChange={setActivePanel}
            />
          </div>
        </section>

        {activePanel === "active" ? (
          <EntitySection title="Active Skills" items={skills} emptyText="No active skills found.">
            {(skill) => (
              <EntityCard
                key={skill._id}
                title={skill.name}
                subtitle={
                  (skill.topics || []).length
                    ? (skill.topics || []).map((topic) => topic.title).join(", ")
                    : "No topics added yet"
                }
                meta={skill.description || "No description"}
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedSkill(skill)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button type="button" className="neo-button" onClick={() => handleEdit(skill)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: skill._id, type: "soft", label: skill.name })}
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
          <EntitySection title="Deleted Skills" items={deletedSkills} emptyText="No deleted skills.">
            {(skill) => (
              <EntityCard
                key={skill._id}
                title={skill.name}
                subtitle={skill.description || "No description"}
                meta="Deleted records"
                actions={
                  <>
                    <button type="button" className="neo-button" onClick={() => setSelectedSkill(skill)}>
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      type="button"
                      className="neo-button-danger"
                      onClick={() => setDeleteState({ id: skill._id, type: "hard", label: skill.name })}
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
        title={editingId ? "Edit skill and topics" : "Create skill and topics"}
        subtitle="Define a skill, then manage each topic as its own structured row so questions can align safely."
        size="wide"
        footer={
          <button type="submit" form="skill-form" className="neo-button-primary">
            {editingId ? "Update Skill" : "Create Skill"}
          </button>
        }
      >
        <form id="skill-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Skill Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <div className="md:col-span-1">
              <TextareaField
                label="Skill Description"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                rows={3}
              />
            </div>
          </div>

          <section className="neo-soft rounded-[26px] p-5">
            <div className="flex flex-col gap-4 border-b border-[var(--border)]/70 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Topic Manager</p>
                <h4 className="mt-2 text-xl font-semibold">Add topics one by one</h4>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Topic IDs are preserved on edit, and topics already used by questions cannot be removed accidentally.
                </p>
              </div>
              <button type="button" className="neo-button" onClick={addTopicRow}>
                <Plus size={16} />
                Add Topic
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {form.topics.map((topic, index) => (
                <div key={topic._id || `topic-${index}`} className="rounded-[22px] border border-[var(--border)]/70 bg-white/18 p-4 backdrop-blur-md dark:bg-white/5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Topic {index + 1}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {topic._id ? `Saved Topic ID: ${topic._id}` : "New topic"}
                      </p>
                    </div>
                    <button type="button" className="neo-button-danger" onClick={() => removeTopicRow(index)}>
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Topic Title"
                      value={topic.title}
                      onChange={(value) => updateTopic(index, "title", value)}
                      placeholder="useState"
                    />
                    <TextareaField
                      label="Topic Description"
                      value={topic.description}
                      onChange={(value) => updateTopic(index, "description", value)}
                      rows={3}
                      placeholder="State management basics in React components"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteState)}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={deleteState?.type === "hard" ? "Delete skill permanently?" : "Remove skill from active list?"}
        description={deleteState ? `${deleteState.label} is the skill affected by this action.` : ""}
        confirmLabel={deleteState?.type === "hard" ? "Delete Permanently" : "Delete Skill"}
      />

      <DetailModal
        open={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.name || "Skill Details"}
        subtitle="Expanded skill information, including topic descriptions, inside the same blur-backed modal system."
        sections={skillSections}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
