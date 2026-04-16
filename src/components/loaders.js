"use client";

export function LoadingOrbit({ size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const dotSizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span className={`loading-orbit ${sizeClasses[size] || sizeClasses.md}`}>
      <span className={`loading-orbit-dot ${dotSizeClasses[size] || dotSizeClasses.md}`} />
      <span className={`loading-orbit-dot loading-orbit-dot-delay ${dotSizeClasses[size] || dotSizeClasses.md}`} />
      <span className="loading-orbit-ring" />
    </span>
  );
}

export function FullScreenLoader({
  eyebrow = "Loading",
  title = "Preparing your workspace",
  description = "Please wait while the app gets everything ready.",
}) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-xl rounded-[30px] p-8 text-center md:p-10">
        <div className="mx-auto flex w-fit items-center justify-center rounded-full bg-[var(--accent)]/10 p-5">
          <LoadingOrbit size="lg" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.32em] text-[var(--accent)]">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}

export function SectionLoader({
  title = "Loading data",
  description = "Fetching the latest information for this view.",
  compact = false,
}) {
  return (
    <div className={`surface-card rounded-[24px] ${compact ? "p-5" : "p-6"}`}>
      <div className={`flex ${compact ? "flex-row items-center gap-4" : "flex-col items-center text-center"} justify-center`}>
        <div className="rounded-full bg-[var(--accent)]/10 p-3">
          <LoadingOrbit size={compact ? "sm" : "md"} />
        </div>
        <div className={compact ? "" : "mt-4"}>
          <p className="text-lg font-semibold">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ButtonLoader({ label = "Loading..." }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="loading-button-spinner" />
      {label}
    </span>
  );
}
