"use client";

import { SharedButton, SharedInput } from "ui-design";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="mt-2 text-gray-600">Join JobBoard today</p>
        </div>

        <form className="space-y-6">
          <SharedInput placeholder="Full name" className="w-full" />
          <SharedInput
            placeholder="Email address"
            type="email"
            className="w-full"
          />
          <SharedInput
            placeholder="Password"
            type="password"
            className="w-full"
          />
          <SharedInput
            placeholder="Confirm password"
            type="password"
            className="w-full"
          />
          <SharedButton title="Create Account" className="w-full" />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
