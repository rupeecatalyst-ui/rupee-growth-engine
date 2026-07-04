// RCLIP — Workspace Infrastructure · single import surface.
// One place to pull every shared workspace primitive:
//   Empty / Error / Loading states · Toasts · Global retry · Formatters ·
//   Avatar · Status chip · Entity & Institution badges.

// Unified state components (empty / error / loading skeleton).
export { EmptyState, StatusChip, type Tone } from "../primitives";
export { CardSkeleton, CardError, HeaderSkeleton, HeaderError } from "../live/states";

// Shared formatters.
export {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatTime,
  formatDayLabel,
  formatRelative,
} from "../format";

// Read-only toasts + global retry pattern.
export { notify, type Notify } from "./toast";
export { combineLive, type LiveState } from "./live-query";

// Shared avatar + party badges.
export { InitialsAvatar, initialsFromName } from "./Avatar";
export { EntityBadge, InstitutionBadge } from "./badges";
