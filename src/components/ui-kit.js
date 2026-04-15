"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="neo-panel rounded-[24px] p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-[2rem]">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="neo-panel rounded-[20px] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{value}</p>
          {hint ? <p className="mt-1.5 text-sm text-[var(--muted)]">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="neo-icon">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EntitySection({ title, items, emptyText, children, controls, count }) {
  return (
    <section className="neo-panel rounded-[22px] p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
          <span className="neo-badge">{typeof count === "number" ? count : items.length}</span>
        </div>
        {controls ? <div className="w-full lg:w-auto">{controls}</div> : null}
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-[var(--muted)]">{emptyText}</p> : items.map(children)}
      </div>
    </section>
  );
}

export function EntityCard({ title, subtitle, meta, actions }) {
  return (
    <div className="neo-soft rounded-[18px] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
          {subtitle ? <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p> : null}
          {meta ? <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">{meta}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SegmentedTabs({ tabs, value, onChange, className = "" }) {
  return (
    <div className={`neo-tab-strip ${className}`.trim()}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={active ? "neo-tab-button neo-tab-button-active" : "neo-tab-button"}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? <span className="neo-tab-count">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function DetailList({ items = [], columns = 2 }) {
  return (
    <div className={`grid gap-3 ${columns === 1 ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
      {items.map((item) => (
        <div key={item.label} className="neo-soft rounded-[18px] p-3.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{item.value || "Not available"}</p>
        </div>
      ))}
    </div>
  );
}

export function DetailModal({ open, title, subtitle, sections = [], onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size="wide">
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2.5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{section.title}</p>
              {section.description ? (
                <p className="mt-1.5 text-sm text-[var(--muted)]">{section.description}</p>
              ) : null}
            </div>
            <DetailList items={section.items} columns={section.columns} />
          </section>
        ))}
      </div>
    </Modal>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  size = "default",
  headerActions,
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frameId = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`modal-backdrop ${visible ? "modal-backdrop-open" : "modal-backdrop-close"}`}
      onClick={onClose}
    >
      <div
        className={`modal-card ${size === "wide" ? "max-w-4xl" : "max-w-2xl"} ${
          visible ? "modal-card-open" : "modal-card-close"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Form Modal</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <button type="button" className="neo-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = "Search..." }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">Search</span>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="neo-input pl-11"
      />
    </label>
  );
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = "items",
}) {
  const pages = useMemo(() => {
    if (totalPages <= 1) {
      return [1];
    }

    const values = new Set([1, totalPages, page - 1, page, page + 1]);
    return Array.from(values).filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[var(--border)]/60 bg-white/20 p-3.5 backdrop-blur-md dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-[var(--muted)]">
        Showing page {totalPages === 0 ? 0 : page} of {totalPages} for {totalItems} {label}
        {pageSize ? `, ${pageSize} per page` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="neo-button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        {pages.map((value) => (
          <button
            key={value}
            type="button"
            className={value === page ? "neo-button-primary" : "neo-button"}
            onClick={() => onPageChange(value)}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          className="neo-button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "danger",
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      subtitle={description}
      footer={
        <button
          type="button"
          className={tone === "danger" ? "neo-button-danger" : "neo-button-primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      }
    >
      <div className="rounded-[18px] border border-[var(--border)]/60 bg-white/20 p-3.5 text-sm text-[var(--muted)] backdrop-blur-md dark:bg-white/5">
        This action cannot be undone without recreating the item.
      </div>
    </Modal>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(onClose, toast.duration || 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] max-w-sm">
      <div className={`neo-toast ${toast.variant || "info"}`}>
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm text-[var(--muted)]">{toast.description}</p> : null}
      </div>
    </div>
  );
}

export function InputField({ label, type = "text", value, onChange, disabled, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="neo-input"
      />
    </label>
  );
}

export function TextareaField({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="neo-input"
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, children, multiple = false, disabled }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        value={value}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className={`neo-input ${multiple ? "min-h-36" : ""}`}
      >
        {children}
      </select>
    </label>
  );
}
