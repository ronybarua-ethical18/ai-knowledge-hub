"use client";

import React from "react";
import {
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useFiles, useDeleteFile } from "@/features/files/hooks/useFiles";
import type { FileStatus, UserFile } from "@/features/files/services/files";

const STATUS_META: Record<
  FileStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  UPLOADED: {
    label: "Queued",
    className: "bg-gray-100 text-gray-600",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  PROCESSED: {
    label: "Ready",
    className: "bg-green-50 text-green-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

function StatusBadge({ status }: { status: FileStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.UPLOADED;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function DocumentRow({
  file,
  onDelete,
  isDeleting,
}: {
  file: UserFile;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div className="min-w-0">
            <p
              className="truncate text-sm font-medium text-gray-900"
              title={file.originalName}
            >
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(file.id)}
          disabled={isDeleting}
          className="flex-shrink-0 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
          aria-label={`Delete ${file.originalName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <StatusBadge status={file.status} />
      </div>

      {file.status === "FAILED" && file.errorMessage && (
        <p className="mt-2 text-xs text-red-600" title={file.errorMessage}>
          {file.errorMessage}
        </p>
      )}
    </div>
  );
}

export default function DocumentSidebar({
  workspaceId,
}: {
  workspaceId?: string;
}) {
  const { data: files, isLoading, isError } = useFiles(workspaceId);
  const { mutate: removeFile, isPending: isDeleting } =
    useDeleteFile(workspaceId);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Your Documents</h3>
        {files && files.length > 0 && (
          <span className="text-xs text-gray-400">{files.length}</span>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading documents…</p>}

      {isError && (
        <p className="text-sm text-red-600">Couldn’t load documents.</p>
      )}

      {!isLoading && !isError && (!files || files.length === 0) && (
        <p className="text-sm text-gray-500">
          No documents yet. Upload one to start asking questions.
        </p>
      )}

      <div className="space-y-2">
        {files?.map((file) => (
          <DocumentRow
            key={file.id}
            file={file}
            onDelete={removeFile}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </div>
  );
}
