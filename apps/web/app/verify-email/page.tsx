"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      <VerifyEmailLayout>
        <h1 className="text-xl font-semibold text-gray-900">Invalid link</h1>
        <p className="text-gray-600 mt-2 text-sm">
          This page needs a verification token. Open the link from your email,
          or sign in and request a new verification email.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700"
        >
          Sign in
        </Link>
      </VerifyEmailLayout>
    );
  }

  if (
    verifyMutation.isPending ||
    (!verifyMutation.isSuccess && !verifyMutation.isError)
  ) {
    return (
      <VerifyEmailLayout>
        <p className="text-gray-600 mt-6">Verifying your email…</p>
      </VerifyEmailLayout>
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <VerifyEmailLayout>
        <h1 className="text-xl font-semibold text-gray-900 mt-6">
          You&apos;re verified
        </h1>
        <p className="text-gray-600 mt-2">
          Your email has been verified. You can continue using the app.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700"
        >
          Continue to app
        </Link>
      </VerifyEmailLayout>
    );
  }

  return (
    <VerifyEmailLayout>
      <h1 className="text-xl font-semibold text-gray-900 mt-6">
        Verification failed
      </h1>
      <p className="text-red-600 mt-2 text-sm" role="alert">
        {getApiErrorMessage(
          verifyMutation.error,
          "We could not verify your email. Try requesting a new link.",
        )}
      </p>
      <div className="mt-6 flex flex-col gap-3 items-center">
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          Back to sign in
        </Link>
      </div>
    </VerifyEmailLayout>
  );
}

function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="mb-2 flex justify-center gap-2 items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            AI
          </div>
          <span className="text-xl font-bold text-blue-900">
            AI Knowledge Hub
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
