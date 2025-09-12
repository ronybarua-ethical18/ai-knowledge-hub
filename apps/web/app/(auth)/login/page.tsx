"use client";

import { SharedButton, SharedInput } from "ui-design";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-2 text-gray-600">Welcome back to JobBoard</p>
        </div>

        <form className="space-y-6">
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
          <SharedButton title="Sign In" className="w-full" />
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
