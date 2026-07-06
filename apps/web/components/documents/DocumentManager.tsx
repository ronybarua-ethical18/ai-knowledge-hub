"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Upload,
  Plus,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useDeleteFile } from "@/features/files/hooks/useFiles";
import {
  STATUS_META,
  FILE_ICON_STYLE,
  formatSize,
  formatAdded,
} from "@/features/files/fileDisplay";
import type { FileStatus, UserFile } from "@/features/files/services/files";
import type { StatusFilter } from "@/components/layout/WorkspaceNav";

const ACCEPTED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Honest per-file sub-label — no fabricated chunk counts.
const subLabel = (file: UserFile): { text: string; danger?: boolean } => {
  switch (file.status) {
    case "FAILED":
      return {
        text: file.errorMessage || "Processing failed",
        danger: true,
      };
    case "PROCESSING":
      return { text: "Extracting & embedding…" };
    case "UPLOADED":
      return { text: "Queued for processing" };
    case "PROCESSED":
      return { text: `${file.fileType} · indexed` };
  }
};

function StatusPill({ status }: { status: FileStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${meta.pill}`}
    >
      {meta.pulse ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      )}
      {meta.label}
    </span>
  );
}

export default function DocumentManager({
  workspaceId,
  workspaceName,
  files,
  isLoading,
  isError,
  statusFilter,
}: {
  workspaceId?: string;
  workspaceName?: string;
  files: UserFile[];
  isLoading: boolean;
  isError: boolean;
  statusFilter: StatusFilter;
}) {
  const { mutate: uploadFile, isPending: isUploading } = useFileUpload();
  const { mutate: removeFile, isPending: isDeleting } =
    useDeleteFile(workspaceId);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () =>
      statusFilter === "ALL"
        ? files
        : files.filter((f) => f.status === statusFilter),
    [files, statusFilter],
  );
  const readyCount = files.filter((f) => f.status === "PROCESSED").length;

  const doUpload = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds the 10 MB limit.");
      return;
    }
    if (!workspaceId) {
      toast.error("Select a workspace before uploading.");
      return;
    }
    uploadFile(
      { file, workspaceId },
      {
        onSuccess: () =>
          toast.success("Uploaded — processing in the background…"),
      },
    );
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-3.5 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[13px] text-gray-400 dark:text-gray-500">
          <span className="truncate">{workspaceName ?? "Workspace"}</span>
          <span>/</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {statusFilter === "ALL"
              ? "Documents"
              : STATUS_META[statusFilter].label}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !workspaceId}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={onInputChange}
          disabled={isUploading}
        />
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
              : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/5"
          }`}
        >
          <div className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-300">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Drag &amp; drop or click to upload
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            PDF, DOCX or TXT · up to 10 MB · indexed automatically
          </p>
        </div>

        {/* Section header */}
        <div className="mt-6 mb-3 flex items-baseline justify-between">
          <h3 className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
            {statusFilter === "ALL"
              ? "Documents"
              : STATUS_META[statusFilter].label}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {files.length} files · {readyCount} ready to query
          </span>
        </div>

        {/* States */}
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Loading documents…
          </p>
        )}
        {isError && (
          <p className="flex items-center justify-center gap-2 py-8 text-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> Couldn’t load documents.
          </p>
        )}
        {!isLoading && !isError && files.length === 0 && (
          <div className="py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No documents yet. Upload one to start asking questions.
            </p>
          </div>
        )}
        {!isLoading && !isError && files.length > 0 && visible.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No {STATUS_META[statusFilter as FileStatus]?.label.toLowerCase()}{" "}
            documents.
          </p>
        )}

        {/* Table */}
        {visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="px-3 pb-2.5 font-semibold">File name</th>
                  <th className="px-3 pb-2.5 font-semibold">Status</th>
                  <th className="px-3 pb-2.5 font-semibold">Added</th>
                  <th className="px-3 pb-2.5 text-right font-semibold">Size</th>
                  <th className="w-8 px-3 pb-2.5" />
                </tr>
              </thead>
              <tbody>
                {visible.map((file) => {
                  const sub = subLabel(file);
                  return (
                    <tr
                      key={file.id}
                      className="group border-b border-gray-50 hover:bg-gray-50/70 dark:border-gray-800/50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                              FILE_ICON_STYLE[file.fileType]
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-medium text-gray-900 dark:text-gray-100"
                              title={file.originalName}
                            >
                              {file.originalName}
                            </p>
                            <p
                              className={`truncate text-[11.5px] ${
                                sub.danger
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                              title={sub.text}
                            >
                              {sub.text}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={file.status} />
                      </td>
                      <td className="px-3 py-3 text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
                        {formatAdded(file.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-gray-500 dark:text-gray-400">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => removeFile(file.id)}
                          disabled={isDeleting}
                          aria-label={`Delete ${file.originalName}`}
                          className="text-gray-300 transition-colors hover:text-red-600 disabled:opacity-50 group-hover:text-gray-400 dark:text-gray-600 dark:hover:text-red-400 dark:group-hover:text-gray-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
