"use client";

import React, { useState } from "react";
import WorkspaceNav, {
  type StatusFilter,
} from "@/components/layout/WorkspaceNav";
import DocumentManager from "@/components/documents/DocumentManager";
import ChatPanel from "@/components/chat/ChatPanel";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useFiles } from "@/features/files/hooks/useFiles";

export default function AppShell() {
  const { currentWorkspace } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const {
    data: files = [],
    isLoading,
    isError,
  } = useFiles(currentWorkspace?.id);

  const readyCount = files.filter((f) => f.status === "PROCESSED").length;

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <WorkspaceNav
        files={files}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <DocumentManager
        workspaceId={currentWorkspace?.id}
        workspaceName={currentWorkspace?.name}
        files={files}
        isLoading={isLoading}
        isError={isError}
        statusFilter={statusFilter}
      />
      <ChatPanel
        workspaceId={currentWorkspace?.id}
        workspaceName={currentWorkspace?.name}
        readyCount={readyCount}
      />
    </div>
  );
}
