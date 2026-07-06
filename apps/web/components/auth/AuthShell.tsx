"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, Check, Eye, EyeOff, FileText } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

/**
 * Split-screen auth layout: form on the left, product showcase on the right.
 * Shared by the sign-in and sign-up pages so the two stay visually identical.
 * The brand panel collapses on small screens, leaving a full-width form.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40 lg:min-h-[42rem] lg:grid-cols-[1fr_1.12fr]">
        {/* Form side */}
        <div className="flex flex-col px-7 py-8 sm:px-12 sm:py-10">
          <div className="flex items-center justify-between">
            <Brand />
            <ThemeToggle />
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {footer}
            </p>
          </div>
        </div>

        {/* Showcase side */}
        <ShowcasePanel />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-blue-600/30">
        AI
      </div>
      <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
        AI Knowledge <span className="font-semibold text-blue-600">Hub</span>
      </span>
    </div>
  );
}

function ShowcasePanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#111c34] to-[#0b1120] px-12 py-10 lg:flex lg:flex-col lg:justify-center">
      {/* accent glow + grid texture */}
      <div className="pointer-events-none absolute right-0 top-0 h-2/3 w-2/3 rounded-full bg-blue-600/25 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(80%_80%_at_70%_30%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 max-w-md">
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-white">
          Turn your documents into answers you can cite.
        </h2>
        <p className="mt-3.5 max-w-[34ch] text-[15px] text-slate-300/80">
          Upload once. Ask anything. Every answer points back to the source it
          came from.
        </p>

        {/* mini product demo */}
        <div className="mt-8 flex max-w-sm flex-col gap-2.5">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-semibold text-slate-100">
              Master_Services_Agreement.pdf
              <span className="block text-[11.5px] font-medium text-slate-400">
                2.5 MB · PDF
              </span>
            </span>
            <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              Indexed
            </span>
          </div>

          <ArrowDown className="mx-auto h-4 w-4 text-slate-500" />

          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
            <p className="text-[13.5px] font-semibold text-white">
              What&apos;s the termination notice period?
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300/90">
              Either party may terminate with{" "}
              <span className="font-semibold text-white">
                30 days&apos; written notice
              </span>
              ; fees already paid are non-refundable.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Cite>MSA · §9.2</Cite>
              <Cite>Onboarding_Handbook</Cite>
            </div>
          </div>
        </div>

        <ul className="mt-9 space-y-3">
          <Prop>Scoped to your workspace &amp; teammates</Prop>
          <Prop>Grounded answers with source citations</Prop>
          <Prop>Live indexing status for every file</Prop>
        </ul>
      </div>
    </div>
  );
}

function Cite({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-blue-400/25 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
      ◆ {children}
    </span>
  );
}

function Prop({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[13.5px] text-slate-300/80">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

/* ---------- shared form primitives ---------- */

const fieldClasses =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-[14.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:placeholder:text-gray-500";

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldClasses}
      />
    </div>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder = "••••••••••",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${fieldClasses} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AuthSubmit({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="h-11 w-full rounded-xl bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
