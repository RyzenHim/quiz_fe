"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "../../../components/app-provider";
import api from "../../../lib/api";
import { InputField, Modal, PageHeader, TextareaField, Toast } from "../../../components/ui-kit";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
};

export default function StudentProfilePage() {
  const { auth, updateAuthUser } = useAppContext();
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    dateOfBirth: "",
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = auth?.user;
    if (!user) {
      return;
    }

    setProfileForm({
      name: user.name || "",
      phone: user.phone || "",
      guardianName: user.guardianName || "",
      guardianPhone: user.guardianPhone || "",
      address: user.address || "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "",
    });
  }, [auth?.user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!auth?.token) {
      return;
    }

    try {
      const response = await api.patch("/student/profile", profileForm, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      updateAuthUser(response.data.student);
      setProfileModalOpen(false);
      setToast({ variant: "success", title: "Profile updated" });
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to update profile",
        description: error.response?.data?.message || "Please try again.",
      });
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!auth?.token) {
      return;
    }

    try {
      const response = await api.patch("/student/profile/password", passwordForm, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordModalOpen(false);
      setToast({ variant: "success", title: response.data.message || "Password updated" });
    } catch (error) {
      setToast({
        variant: "error",
        title: "Unable to update password",
        description: error.response?.data?.message || "Please try again.",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Profile"
          title="Manage your student account without leaving the page"
          description="Profile edits and password resets open in focused modals with blur, while your email remains read-only."
          action={
            <div className="flex flex-wrap gap-3">
              <button type="button" className="neo-button" onClick={() => setProfileModalOpen(true)}>
                Edit Profile
              </button>
              <button
                type="button"
                className="neo-button-primary"
                onClick={() => setPasswordModalOpen(true)}
              >
                Reset Password
              </button>
            </div>
          }
        />

        <section className="neo-panel rounded-[30px] p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--muted)]">Name</p>
              <p className="mt-2 text-2xl font-semibold">{auth?.user?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Email</p>
              <p className="mt-2 text-2xl font-semibold">{auth?.user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Enrollment Number</p>
              <p className="mt-2 text-2xl font-semibold">{auth?.user?.enrollmentNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Batch</p>
              <p className="mt-2 text-2xl font-semibold">{auth?.user?.batch?.batchName || "N/A"}</p>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Edit student profile"
        subtitle="Your email stays locked, but you can update the rest of your account details here."
        footer={
          <>
            <button type="button" className="neo-button" onClick={() => setProfileModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="student-profile-form" className="neo-button-primary">
              Save Profile
            </button>
          </>
        }
      >
        <form id="student-profile-form" onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Name"
            value={profileForm.name}
            onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))}
          />
          <InputField label="Email" value={auth?.user?.email || ""} onChange={() => {}} disabled />
          <InputField
            label="Phone"
            value={profileForm.phone}
            onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))}
          />
          <InputField
            label="Date of Birth"
            type="date"
            value={profileForm.dateOfBirth}
            onChange={(value) => setProfileForm((current) => ({ ...current, dateOfBirth: value }))}
          />
          <InputField
            label="Guardian Name"
            value={profileForm.guardianName}
            onChange={(value) => setProfileForm((current) => ({ ...current, guardianName: value }))}
          />
          <InputField
            label="Guardian Phone"
            value={profileForm.guardianPhone}
            onChange={(value) =>
              setProfileForm((current) => ({ ...current, guardianPhone: value }))
            }
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Address"
              value={profileForm.address}
              onChange={(value) => setProfileForm((current) => ({ ...current, address: value }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Reset password"
        subtitle="Use your current password, then choose a new one with at least 6 characters."
        footer={
          <>
            <button type="button" className="neo-button" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="student-password-form" className="neo-button-primary">
              Update Password
            </button>
          </>
        }
      >
        <form id="student-password-form" onSubmit={savePassword} className="grid gap-4">
          <InputField
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) =>
              setPasswordForm((current) => ({ ...current, currentPassword: value }))
            }
          />
          <InputField
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
          />
        </form>
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
