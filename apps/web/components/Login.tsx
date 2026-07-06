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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoggingIn } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace to keep asking your documents."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-gray-600 dark:text-gray-400">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            Remember for 30 days
          </label>
          <Link
            href="/login"
            className="text-[13.5px] font-semibold text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </Link>
        </div>

        <AuthSubmit loading={isLoggingIn}>
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
