// RCLIP — Opportunity Workspace · tab/section registry (shared by LeftRail + Tabs).
import {
  LayoutGrid,
  Users,
  Layers,
  Building2,
  CheckSquare,
  FileText,
  History,
  MessageSquare,
  Wallet,
  IndianRupee,
  StickyNote,
  Sparkles,
  GitBranch,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "participants", label: "Participants", icon: Users },
  { id: "products", label: "Products", icon: Layers },
  { id: "institutions", label: "Institutions", icon: Building2 },
  { id: "workflow", label: "Workflow", icon: GitBranch },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "infosheet", label: "Info Sheet", icon: ScrollText },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "communications", label: "Communications", icon: MessageSquare },
  { id: "financials", label: "Financials", icon: Wallet },
  { id: "revenue", label: "Revenue", icon: IndianRupee },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "ai", label: "AI Summary", icon: Sparkles },
];
