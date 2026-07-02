/**
 * RCLIP service-layer result & error conventions.
 *
 * Every service function returns a discriminated `Result<T>` instead of throwing,
 * so callers (repositories, routes, loaders) handle success and failure uniformly.
 * Infrastructure faults (thrown exceptions) are normalized via `toAppError`.
 */

export type AppErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"
  | "internal";

export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Field-level validation messages, keyed by dotted field path. */
  fields?: Record<string, string>;
  /** Opaque cause for logging; never surfaced to end users. */
  cause?: unknown;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(
  code: AppErrorCode,
  message: string,
  extra?: Pick<AppError, "fields" | "cause">,
): Result<T> {
  return { ok: false, error: { code, message, ...extra } };
}

/** HTTP status mapping for route/loader boundaries. */
export function statusForError(code: AppErrorCode): number {
  switch (code) {
    case "validation":
      return 422;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "rate_limited":
      return 429;
    case "unavailable":
      return 503;
    case "internal":
      return 500;
  }
}

/** Normalize any thrown value into a stable AppError. */
export function toAppError(cause: unknown): AppError {
  if (cause && typeof cause === "object" && "code" in cause && "message" in cause) {
    const maybe = cause as { code: unknown; message: unknown };
    if (typeof maybe.code === "string" && typeof maybe.message === "string") {
      return { code: "internal", message: maybe.message, cause };
    }
  }
  const message = cause instanceof Error ? cause.message : "Unexpected error";
  return { code: "internal", message, cause };
}
