"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoredWorkspaces } from "@/features/auth/services/auth";
import type { Workspace } from "@/features/workspaces/services/workspaces";

const SELECTED_KEY = "selectedWorkspaceId";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // localStorage isn't available during SSR, so we must read it on the client
  // after mount — not in a useState initializer, which would freeze the
  // server-side empty value through hydration.
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pathname = usePathname();

  // Workspaces are persisted at login. Because the provider lives in the root
  // layout, it mounts before login and stays mounted across the client-side
  // navigation to the app — so we re-read on every route change to pick up the
  // list once login has stored it.
  useEffect(() => {
    const stored = getStoredWorkspaces();
    setWorkspaces(stored);
    if (stored.length === 0) return;
    const savedId = localStorage.getItem(SELECTED_KEY);
    const valid = stored.find((w) => w.id === savedId);
    setSelectedId((prev) => prev ?? (valid ? valid.id : stored[0]!.id));
  }, [pathname]);

  const setCurrentWorkspaceId = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_KEY, id);
    }
  };

  const value = useMemo<WorkspaceContextType>(() => {
    const currentWorkspace =
      workspaces.find((w) => w.id === selectedId) ?? workspaces[0] ?? null;
    return { workspaces, currentWorkspace, setCurrentWorkspaceId };
  }, [workspaces, selectedId]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
