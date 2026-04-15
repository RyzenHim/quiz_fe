"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import {
  ConfirmDialog,
  EntityCard,
  EntitySection,
  InputField,
  Modal,
  PageHeader,
  TextareaField,
  Toast,
} from "../../../components/ui-kit";

const emptyForm = { name: "", description: "", topicsText: "" };

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

  const handleEdit = (skill) => {
    setEditingId(skill._id);
    setForm({
      name: skill.name || "",
      description: skill.description || "",
      topicsText: (skill.topics || []).map((topic) => topic.title).join(", "),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const topics = form.topicsText
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean)
        .map((title) => ({ title }));
      const payload = { name: form.name, description: form.description, topics };

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

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Skills"
          title="Shape topic libraries with softer, focused interactions"
          description="Skill creation now lives in a dedicated modal so the page itself can stay calm and readable while editing."
          action={
            <button type="button" className="neo-button-primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Add Skill
            </button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <EntitySection title="Active Skills" items={skills} emptyText="No active skills found.">
            {(skill) => (
              <EntityCard
                key={skill._id}
                title={skill.name}
                subtitle={(skill.topics || []).map((topic) => topic.title).join(", ") || "No topics"}
                meta={skill.description || "No description"}
                actions={
                  <>
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

          <EntitySection title="Deleted Skills" items={deletedSkills} emptyText="No deleted skills.">
            {(skill) => (
              <EntityCard
                key={skill._id}
                title={skill.name}
                subtitle={skill.description || "No description"}
                meta="Deleted records"
                actions={
                  <button
                    type="button"
                    className="neo-button-danger"
                    onClick={() => setDeleteState({ id: skill._id, type: "hard", label: skill.name })}
                  >
                    <Trash2 size={16} />
                    Delete Permanently
                  </button>
                }
              />
            )}
          </EntitySection>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit skill" : "Create skill"}
        subtitle="Define a skill and its topics in a single focused overlay."
        footer={
          <>
            <button type="button" className="neo-button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="skill-form" className="neo-button-primary">
              {editingId ? "Update Skill" : "Create Skill"}
            </button>
          </>
        }
      >
        <form id="skill-form" onSubmit={handleSubmit} className="grid gap-4">
          <InputField label="Skill Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(value) => setForm({ ...form, description: value })}
          />
          <TextareaField
            label="Topics (comma separated)"
            value={form.topicsText}
            onChange={(value) => setForm({ ...form, topicsText: value })}
          />
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
