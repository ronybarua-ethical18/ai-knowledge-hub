import { isAxiosError } from "axios";

/**
 * Nest `HttpExceptionFilter` returns `{ response: { message: string | string[] } }`.
 * Plain axios errors may use `{ message: string }` at the top level of `data`.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          response?: { message?: string | string[] };
          message?: string | string[];
        }
      | undefined;

    const nested = data?.response?.message;
    if (Array.isArray(nested)) {
      return nested.join(", ");
    }
    if (typeof nested === "string" && nested.trim()) {
      return nested;
    }

    const top = data?.message;
    if (Array.isArray(top)) {
      return top.join(", ");
    }
    if (typeof top === "string" && top.trim()) {
      return top;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
