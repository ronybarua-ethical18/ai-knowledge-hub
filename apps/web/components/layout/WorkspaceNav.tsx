"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@workspace/ui/components/dropdown-menu";
import {
  FileText,
  MessagesSquare,
  ChevronsUpDown,
  Check,
  Settings,
  LogOut,
  Boxes,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/useWorkspaceMembers";
import { STATUS_META } from "@/features/files/fileDisplay";
import ThemeToggle from "@/components/layout/ThemeToggle";
import type { FileStatus, UserFile } from "@/features/files/services/files";
import type { WorkspaceRole } from "@/features/workspaces/services/workspaces";

export type StatusFilter = FileStatus | "ALL";

const FILTERABLE: FileStatus[] = ["PROCESSED", "PROCESSING", "FAILED"];

// Deterministic avatar color from a string, so members keep a stable color.
const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];
const colorFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const isOwner = role === "OWNER";
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isOwner
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          : "border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
      }`}
    >
      {role.toLowerCase()}
    </span>
  );
}

export default function WorkspaceNav({
  files,
  statusFilter,
  onStatusFilterChange,
}: {
  files: UserFile[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
}) {
  const { user, logout, isLoggingOut } = useAuthContext();
  const { workspaces, currentWorkspace, setCurrentWorkspaceId } =
    useWorkspace();
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id);

  const counts = FILTERABLE.reduce<Record<string, number>>((acc, s) => {
    acc[s] = files.filter((f) => f.status === s).length;
    return acc;
  }, {});

  const navItem = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
      active
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    }`;
  const sectionLabel =
    "px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <Boxes className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Knowledge Hub
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-indigo-50 text-[13px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {initials(currentWorkspace?.name ?? "?")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                  {currentWorkspace?.name ?? "No workspace"}
                </span>
                <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                  {members?.length ?? "—"} members · {files.length} docs
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs text-gray-400">
              Switch workspace
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                className="cursor-pointer"
                onClick={() => setCurrentWorkspaceId(ws.id)}
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {initials(ws.name)}
                </span>
                <span className="truncate">{ws.name}</span>
                {ws.id === currentWorkspace?.id && (
                  <Check className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </DropdownMenuItem>
            ))}
            {workspaces.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-gray-400">
                No workspaces yet
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav sections (scrollable) */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className={sectionLabel}>Workspace</p>
        <button
          onClick={() => onStatusFilterChange("ALL")}
          className={navItem(statusFilter === "ALL")}
        >
          <FileText className="h-4 w-4" />
          Documents
          <span className="ml-auto text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
            {files.length}
          </span>
        </button>
        <div className="mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-400 dark:text-gray-500">
          <MessagesSquare className="h-4 w-4" />
          Chat
          <span className="ml-auto text-[10px] font-semibold uppercase text-gray-300 dark:text-gray-600">
            live
          </span>
        </div>

        {/* Status filters */}
        <p className={`${sectionLabel} pt-5`}>Filter by status</p>
        {FILTERABLE.map((s) => {
          const meta = STATUS_META[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => onStatusFilterChange(active ? "ALL" : s)}
              className={navItem(active)}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
              <span className="ml-auto text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}

        {/* Members */}
        <p className={`${sectionLabel} pt-5`}>Members</p>
        {members?.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5">
            {m.user.avatarUrl ? (
              <img
                src={m.user.avatarUrl}
                alt={m.user.fullName}
                className="h-6 w-6 flex-none rounded-full object-cover"
              />
            ) : (
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full text-[10px] font-bold text-white ${colorFor(
                  m.user.email,
                )}`}
              >
                {initials(m.user.fullName)}
              </span>
            )}
            <span className="truncate text-[12.5px] font-medium text-gray-700 dark:text-gray-300">
              {m.user.fullName}
            </span>
            <RoleBadge role={m.role} />
          </div>
        ))}
        {members && members.length === 0 && (
          <p className="px-2 text-xs text-gray-400 dark:text-gray-500">
            No members yet.
          </p>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 flex-none rounded-full object-cover"
                />
              ) : (
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 text-[11px] font-bold text-white">
                  {initials(user?.fullName ?? "U")}
                </span>
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[12.5px] font-semibold text-gray-900 dark:text-gray-100">
                  {user?.fullName ?? "User"}
                </span>
                <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                  {user?.email ?? "user@example.com"}
                </span>
              </span>
              <Settings className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.fullName ?? "User"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
