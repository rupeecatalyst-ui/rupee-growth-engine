/**
 * Shared Zod primitives reused across every RCLIP engine.
 * Keeps field-level validation consistent with the database CHECK constraints
 * and the Relationship Engine normalization rules (E.164 phone, lowercased email).
 */
import { z } from "zod";

export const uuid = z.string().uuid();

/** Business/config codes: lowercase snake or hyphen, machine-safe. */
export const code = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_.-]*$/, "Use lowercase letters, digits, '_', '.', or '-'");

export const nonEmpty = z.string().trim().min(1);

/** Money stored as numeric(15,2): non-negative, max 13 integer digits. */
export const money = z
  .number()
  .nonnegative()
  .max(9_999_999_999_999.99, "Amount exceeds numeric(15,2) range");

export const email = z
  .string()
  .trim()
  .email()
  .transform((v) => v.toLowerCase());

/** Indian mobile / phone reduced to digits (E.164-friendly, matches rc_normalize_phone). */
export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 8 && v.length <= 15, "Enter a valid phone number");

export const pincode = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");

/** ISO date string (YYYY-MM-DD) used for effective dating. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/**
 * Effective-dating pair used on every rule/rate table. `effective_to` must not
 * precede `effective_from` (mirrors the DB chk_*_dates constraints).
 */
export const effectiveDates = z
  .object({ effective_from: isoDate, effective_to: isoDate.nullish() })
  .refine((v) => !v.effective_to || v.effective_to >= v.effective_from, {
    message: "End date cannot be before start date",
    path: ["effective_to"],
  });
