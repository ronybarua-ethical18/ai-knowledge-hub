"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiClient } from "@/lib/react-query/api-client";
import { getApiErrorMessage } from "@/lib/api-errors";
import { queryKeys } from "@/constants/queryKeys";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = searchParams.get("token")?.trim() ?? "";
  const hasToken = token.length > 0;

  const { mutate, ...verifyMutation } = useMutation({
    mutationFn: (verificationToken: string) =>
      apiClient.post("/auth/verify-email", { token: verificationToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.AUTH] });
    },
  });

  useEffect(() => {
    if (!hasToken) return;
    mutate(token);
  }, [hasToken, token, mutate]);

  if (!hasToken) {
    return (
      <VerifyEmailCard
        tone="error"
        icon={<XCircle className="h-6 w-6" />}
        title="Invalid link"
        description="This page needs a verification token. Open the link from your email, or sign in and request a new one."
        action={{ href: "/login", label: "Back to sign in" }}
      />
    );
  }

  if (
    verifyMutation.isPending ||
    (!verifyMutation.isSuccess && !verifyMutation.isError)
  ) {
    return (
      <VerifyEmailCard
        tone="pending"
        icon={<Loader2 className="h-6 w-6 animate-spin" />}
        title="Verifying your email…"
        description="Hang tight while we confirm your link."
      />
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <VerifyEmailCard
        tone="success"
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Email verified"
        description="Your account is ready. Jump into your workspace."
        action={{ href: "/", label: "Continue to app" }}
      />
    );
  }

  return (
    <VerifyEmailCard
      tone="error"
      icon={<XCircle className="h-6 w-6" />}
      title="Verification failed"
      description={getApiErrorMessage(
        verifyMutation.error,
        "We could not verify your email. Try requesting a new link.",
      )}
      action={{ href: "/login", label: "Back to sign in" }}
    />
  );
}

const TONE_STYLES = {
  pending: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  error: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
} as const;

function VerifyEmailCard({
  tone,
  icon,
  title,
  description,
  action,
}: {
  tone: keyof typeof TONE_STYLES;
  icon: ReactNode;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl shadow-gray-900/10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-blue-600/30">
            AI
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
            AI Knowledge{" "}
            <span className="font-semibold text-blue-600">Hub</span>
          </span>
        </div>

        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${TONE_STYLES[tone]}`}
        >
          {icon}
        </div>

        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
          {title}
        </h1>
        <p
          className="mx-auto mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400"
          role={tone === "error" ? "alert" : undefined}
        >
          {description}
        </p>

        {action && (
          <Link
            href={action.href}
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
