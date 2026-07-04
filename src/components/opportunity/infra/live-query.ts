// RCLIP — Workspace Infrastructure · Global Retry Pattern.
// Combines one or more React Query results into a single unified state used by
// every live section: one loading flag, one error flag, one retry handler.
// Retry refetches whatever errored (or everything if nothing is flagged) and
// surfaces a read-only toast, so the retry UX is identical everywhere.
import { notify } from "./toast";

interface QueryLike {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}

export interface LiveState {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

export function combineLive(...queries: QueryLike[]): LiveState {
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const isFetching = queries.some((q) => q.isFetching);

  const onRetry = () => {
    const errored = queries.filter((q) => q.isError);
    const targets = errored.length > 0 ? errored : queries;
    for (const q of targets) void q.refetch();
    notify.retry();
  };

  return { isLoading, isError, isFetching, onRetry };
}
