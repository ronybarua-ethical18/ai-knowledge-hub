"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { useAuthContext } from "../contexts/AuthContext";
import AuthShell, {
  AuthField,
  PasswordField,
  AuthSubmit,
} from "./auth/AuthShell";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, isRegistering } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeToTerms) {
      setError("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }

    setError(null);
    register({ fullName, email, password });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your account to start uploading and asking."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Full name"
          value={fullName}
          onChange={setFullName}
          placeholder="Jordan Rivera"
          autoComplete="name"
        />

        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        <label className="flex cursor-pointer items-start gap-2 text-[13.5px] text-gray-600 dark:text-gray-400">
          <Checkbox
            className="mt-0.5"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
          />
          <span>
            I agree to the{" "}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Terms &amp; Privacy Policy
            </a>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <AuthSubmit loading={isRegistering}>
          {isRegistering ? "Creating account…" : "Create account"}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
