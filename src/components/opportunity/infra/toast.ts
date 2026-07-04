// RCLIP — Workspace Infrastructure · read-only toast notifications.
// These are informational only (no mutating actions) to stay within the
// read-only mandate. Sonner's <Toaster /> is already mounted at the app root.
import { toast } from "sonner";

export const notify = {
  info: (message: string, description?: string) => toast.info(message, { description }),
  success: (message: string, description?: string) => toast.success(message, { description }),
  error: (message = "Something went wrong", description?: string) => toast.error(message, { description }),
  offline: (message = "You appear to be offline") =>
    toast.warning(message, { description: "We'll keep retrying — check your connection." }),
  retry: (label = "Refreshing…") => toast.info(label),
};

export type Notify = typeof notify;
