import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>;
}

export function Pill({
  children,
  className = "",
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`pill ${className} disabled:opacity-40 disabled:pointer-events-none`}>
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  color = "var(--color-violet)",
  className = "",
  height = 8,
}: {
  value: number; // 0..100
  color?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/8 ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-muted ${className}`}>
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  sub,
  className = "",
}: {
  children: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-6 gap-y-1 ${className}`}>
      <h2 className="headline text-2xl sm:text-3xl lg:text-4xl">{children}</h2>
      {sub && <p className="pb-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}
