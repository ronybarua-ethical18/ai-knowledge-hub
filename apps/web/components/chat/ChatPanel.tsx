"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, FileText, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAiChat } from "@/features/ai/hooks/useAIChat";

interface Reference {
  content: string;
  source?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
}

// Distinct source files cited in an answer, in first-seen order.
const distinctSources = (refs: Reference[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of refs) {
    const s = r.source?.trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
};

function SourceCitations({ references }: { references: Reference[] }) {
  const [open, setOpen] = useState(false);
  const sources = distinctSources(references);
  if (references.length === 0) return null;

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          Sources:
        </span>
        {sources.length > 0 ? (
          sources.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-300"
              title={s}
            >
              <FileText className="h-3 w-3 text-gray-400 dark:text-gray-500" />
              <span className="max-w-[140px] truncate">{s}</span>
            </span>
          ))
        ) : (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {references.length} passage{references.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {open ? "Hide" : "Show"} cited passages
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {references.map((ref, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-[11.5px] leading-relaxed text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
            >
              <p>
                {ref.content.length > 220
                  ? `${ref.content.slice(0, 220)}…`
                  : ref.content}
              </p>
              {ref.source && (
                <p className="mt-1 font-medium text-indigo-600 dark:text-indigo-400">
                  {ref.source}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  workspaceId,
  workspaceName,
  readyCount,
}: {
  workspaceId?: string;
  workspaceName?: string;
  readyCount: number;
}) {
  const { mutate: chatWithAI, isPending } = useAiChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (!workspaceId) {
      toast.error("Select a workspace before chatting.");
      return;
    }

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatWithAI(
      { message: text, workspaceId, limit: 5 },
      {
        onSuccess: (data) =>
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-a`,
              role: "assistant",
              content: data.response,
              references: data.references,
            },
          ]),
        onError: () =>
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-a`,
              role: "assistant",
              content:
                "Sorry, I couldn’t process that request. Please try again.",
            },
          ]),
      },
    );
  };

  const aiAvatar = (
    <div className="grid h-6 w-6 flex-none place-items-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
      AI
    </div>
  );

  return (
    <aside className="flex w-[380px] flex-col border-l border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">
            AI Assistant
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            RAG active
            {workspaceName ? ` · ${workspaceName}` : ""}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex gap-2.5">
            {aiAvatar}
            <div className="rounded-xl rounded-tl-sm border border-gray-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              Ask anything about the {readyCount} indexed document
              {readyCount === 1 ? "" : "s"} in this workspace. Answers are
              grounded in your files and cite their sources.
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex flex-row-reverse gap-2.5">
              <div className="grid h-6 w-6 flex-none place-items-center rounded-md bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                You
              </div>
              <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-indigo-600 px-3 py-2.5 text-[13px] leading-relaxed text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              {aiAvatar}
              <div className="min-w-0 max-w-[85%]">
                <div className="rounded-xl rounded-tl-sm border border-gray-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.references && (
                    <SourceCitations references={m.references} />
                  )}
                </div>
              </div>
            </div>
          ),
        )}

        {isPending && (
          <div className="flex gap-2.5">
            {aiAvatar}
            <div className="flex items-center gap-2 rounded-xl rounded-tl-sm border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500 dark:border-gray-700 dark:border-t-indigo-400" />
              Searching your documents…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-3.5 pr-1.5 focus-within:border-indigo-400 dark:border-gray-800 dark:bg-gray-900 dark:focus-within:border-indigo-500">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your documents…"
            className="flex-1 bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isPending}
            aria-label="Send"
            className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-gray-400 dark:text-gray-500">
          Answers cite their sources. Verify important information.
        </p>
      </div>
    </aside>
  );
}
