import type { FileStatus, FileType } from "./services/files";

export interface StatusMeta {
  label: string;
  // Tailwind classes for the status pill (bg + text).
  pill: string;
  // Tailwind class for the small status dot.
  dot: string;
  pulse: boolean;
}

export const STATUS_META: Record<FileStatus, StatusMeta> = {
  UPLOADED: {
    label: "Queued",
    pill: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
    dot: "bg-slate-400",
    pulse: false,
  },
  PROCESSING: {
    label: "Processing",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    pulse: true,
  },
  PROCESSED: {
    label: "Ready",
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    pulse: false,
  },
  FAILED: {
    label: "Failed",
    pill: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    dot: "bg-red-500",
    pulse: false,
  },
};

export const FILE_ICON_STYLE: Record<FileType, string> = {
  PDF: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  DOCX: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  TXT: "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-300",
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// "Added" column — relative for recent, absolute otherwise.
export const formatAdded = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
