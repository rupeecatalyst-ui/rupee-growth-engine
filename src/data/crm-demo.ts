// RCLIP — CRM demo dataset (mocked JSON only). Powers the Command Center and
// Deal Pipeline. No backend, no API — purely for the executive browser demo.
import type { HealthStatus, PriorityCode } from "@/components/opportunity/types";

export interface DemoKpi {
  key: string;
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  trend: number[];
  accent: "royal" | "emerald" | "cta" | "sky";
}

export const kpis: DemoKpi[] = [
  {
    key: "pipeline",
    label: "Active Pipeline",
    value: "₹1,284 Cr",
    delta: 12.4,
    deltaLabel: "vs last quarter",
    trend: [42, 48, 45, 58, 62, 70, 78, 84],
    accent: "royal",
  },
  {
    key: "revenue",
    label: "Revenue Realised (YTD)",
    value: "₹38.6 Cr",
    delta: 8.9,
    deltaLabel: "vs target",
    trend: [12, 18, 22, 28, 30, 34, 36, 39],
    accent: "emerald",
  },
  {
    key: "deals",
    label: "Live Opportunities",
    value: "142",
    delta: 5.2,
    deltaLabel: "24 this month",
    trend: [90, 96, 104, 110, 118, 124, 132, 142],
    accent: "sky",
  },
  {
    key: "winrate",
    label: "Win Rate",
    value: "64%",
    delta: -2.1,
    deltaLabel: "trailing 90d",
    trend: [68, 70, 66, 65, 67, 66, 65, 64],
    accent: "cta",
  },
];

export interface RevenuePoint {
  month: string;
  projected: number;
  realised: number;
}
export const revenueSeries: RevenuePoint[] = [
  { month: "Aug", projected: 2.8, realised: 2.4 },
  { month: "Sep", projected: 3.1, realised: 2.9 },
  { month: "Oct", projected: 3.6, realised: 3.4 },
  { month: "Nov", projected: 4.0, realised: 3.7 },
  { month: "Dec", projected: 4.6, realised: 4.3 },
  { month: "Jan", projected: 4.2, realised: 4.0 },
  { month: "Feb", projected: 4.8, realised: 4.5 },
  { month: "Mar", projected: 5.4, realised: 5.1 },
  { month: "Apr", projected: 5.0, realised: 4.6 },
  { month: "May", projected: 5.7, realised: 5.2 },
  { month: "Jun", projected: 6.2, realised: 5.6 },
  { month: "Jul", projected: 6.8, realised: 3.1 },
];

export interface StageBar {
  stage: string;
  count: number;
  value: number; // ₹ Cr
}
export const pipelineByStage: StageBar[] = [
  { stage: "Qualification", count: 38, value: 512 },
  { stage: "Analysis", count: 29, value: 428 },
  { stage: "Proposal", count: 24, value: 386 },
  { stage: "Credit Review", count: 18, value: 274 },
  { stage: "Sanction", count: 12, value: 198 },
  { stage: "Documentation", count: 9, value: 142 },
  { stage: "Disbursement", count: 12, value: 168 },
];

export interface ProductSlice {
  name: string;
  value: number;
  color: string;
}
export const productMix: ProductSlice[] = [
  { name: "Construction Finance", value: 34, color: "var(--royal)" },
  { name: "Working Capital", value: 22, color: "var(--emerald)" },
  { name: "LAP", value: 18, color: "oklch(0.62 0.16 240)" },
  { name: "Project Finance", value: 15, color: "var(--cta)" },
  { name: "Debt Syndication", value: 11, color: "oklch(0.65 0.15 300)" },
];

export interface ActivityItem {
  id: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  time: string;
  tone: "royal" | "emerald" | "amber" | "sky" | "violet";
}
export const activityFeed: ActivityItem[] = [
  { id: "a1", actor: "HDFC Bank", initials: "HD", action: "raised credit queries on", target: "Skyline Infra — CF", time: "12m ago", tone: "amber" },
  { id: "a2", actor: "A. Kulkarni", initials: "AK", action: "moved to Sanction", target: "Orbit Retail — Working Capital", time: "48m ago", tone: "emerald" },
  { id: "a3", actor: "System", initials: "SY", action: "generated Information Sheet for", target: "Marvel Estates — LRD", time: "1h ago", tone: "royal" },
  { id: "a4", actor: "R. Nair", initials: "RN", action: "added ICICI Bank track to", target: "Nexus Logistics — Project Finance", time: "2h ago", tone: "sky" },
  { id: "a5", actor: "Kotak Mahindra", initials: "KM", action: "sanctioned ₹18 Cr for", target: "Vertex Pharma — Term Loan", time: "3h ago", tone: "emerald" },
  { id: "a6", actor: "S. Iyer", initials: "SI", action: "flagged missing documents on", target: "Skyline Infra — CF", time: "4h ago", tone: "violet" },
];

export interface DealRow {
  code: string;
  client: string;
  product: string;
  value: string;
  stage: string;
  stageTone: "sky" | "violet" | "amber" | "emerald" | "blue";
  health: HealthStatus;
  owner: string;
  ownerInitials: string;
  probability: number;
}
export const topOpportunities: DealRow[] = [
  { code: "RC-OPP-000418", client: "Skyline Infra Developers", product: "Construction Finance +2", value: "₹64.5 Cr", stage: "Proposal", stageTone: "amber", health: "watch", owner: "A. Kulkarni", ownerInitials: "AK", probability: 62 },
  { code: "RC-OPP-000392", client: "Orbit Retail Pvt Ltd", product: "Working Capital", value: "₹28.0 Cr", stage: "Sanction", stageTone: "emerald", health: "healthy", owner: "R. Nair", ownerInitials: "RN", probability: 84 },
  { code: "RC-OPP-000377", client: "Nexus Logistics", product: "Project Finance", value: "₹112.0 Cr", stage: "Credit Review", stageTone: "violet", health: "healthy", owner: "S. Iyer", ownerInitials: "SI", probability: 71 },
  { code: "RC-OPP-000361", client: "Marvel Estates", product: "Lease Rental Discounting", value: "₹42.0 Cr", stage: "Qualification", stageTone: "sky", health: "at_risk", owner: "P. Desai", ownerInitials: "PD", probability: 38 },
  { code: "RC-OPP-000355", client: "Vertex Pharma", product: "Term Loan", value: "₹18.0 Cr", stage: "Sanction", stageTone: "emerald", health: "healthy", owner: "A. Kulkarni", ownerInitials: "AK", probability: 88 },
  { code: "RC-OPP-000340", client: "Helios Energy", product: "Structured Debt", value: "₹95.0 Cr", stage: "Analysis", stageTone: "blue", health: "watch", owner: "R. Nair", ownerInitials: "RN", probability: 55 },
];

export interface ProviderRow {
  name: string;
  initials: string;
  liveDeals: number;
  sanctioned: string;
  avgTat: string;
  rating: number;
}
export const capitalProviders: ProviderRow[] = [
  { name: "HDFC Bank", initials: "HD", liveDeals: 18, sanctioned: "₹214 Cr", avgTat: "9 days", rating: 4.8 },
  { name: "ICICI Bank", initials: "IC", liveDeals: 14, sanctioned: "₹186 Cr", avgTat: "11 days", rating: 4.6 },
  { name: "Kotak Mahindra", initials: "KM", liveDeals: 11, sanctioned: "₹142 Cr", avgTat: "8 days", rating: 4.7 },
  { name: "Bajaj Housing", initials: "BH", liveDeals: 9, sanctioned: "₹98 Cr", avgTat: "13 days", rating: 4.3 },
  { name: "Axis Bank", initials: "AX", liveDeals: 7, sanctioned: "₹76 Cr", avgTat: "12 days", rating: 4.2 },
];

/* ---- Deal Pipeline board ---- */
export interface PipelineCard {
  code: string;
  title: string;
  client: string;
  value: string;
  product: string;
  health: HealthStatus;
  priority: PriorityCode;
  owner: string;
  ownerInitials: string;
  updated: string;
  tracks: number;
}
export interface PipelineColumn {
  id: string;
  label: string;
  accent: string;
  cards: PipelineCard[];
}

export const pipelineBoard: PipelineColumn[] = [
  {
    id: "qualification",
    label: "Qualification",
    accent: "oklch(0.62 0.16 240)",
    cards: [
      { code: "RC-OPP-000361", title: "LRD Facility", client: "Marvel Estates", value: "₹42.0 Cr", product: "Lease Rental Discounting", health: "at_risk", priority: "medium", owner: "P. Desai", ownerInitials: "PD", updated: "2h ago", tracks: 2 },
      { code: "RC-OPP-000420", title: "Acquisition Funding", client: "Zenith Foods", value: "₹56.0 Cr", product: "Acquisition Finance", health: "healthy", priority: "high", owner: "R. Nair", ownerInitials: "RN", updated: "5h ago", tracks: 1 },
    ],
  },
  {
    id: "analysis",
    label: "Financial Analysis",
    accent: "oklch(0.65 0.15 300)",
    cards: [
      { code: "RC-OPP-000340", title: "Solar Portfolio", client: "Helios Energy", value: "₹95.0 Cr", product: "Structured Debt", health: "watch", priority: "high", owner: "R. Nair", ownerInitials: "RN", updated: "1h ago", tracks: 3 },
      { code: "RC-OPP-000410", title: "Fleet Expansion", client: "TransCore Ltd", value: "₹31.0 Cr", product: "Equipment Finance", health: "healthy", priority: "medium", owner: "S. Iyer", ownerInitials: "SI", updated: "1d ago", tracks: 2 },
    ],
  },
  {
    id: "proposal",
    label: "Proposal",
    accent: "var(--cta)",
    cards: [
      { code: "RC-OPP-000418", title: "Construction Finance +2", client: "Skyline Infra", value: "₹64.5 Cr", product: "Construction Finance", health: "watch", priority: "high", owner: "A. Kulkarni", ownerInitials: "AK", updated: "12m ago", tracks: 5 },
    ],
  },
  {
    id: "credit_review",
    label: "Credit Review",
    accent: "oklch(0.6 0.16 280)",
    cards: [
      { code: "RC-OPP-000377", title: "Warehouse Network", client: "Nexus Logistics", value: "₹112.0 Cr", product: "Project Finance", health: "healthy", priority: "critical", owner: "S. Iyer", ownerInitials: "SI", updated: "3h ago", tracks: 4 },
    ],
  },
  {
    id: "sanction",
    label: "Sanction",
    accent: "var(--emerald)",
    cards: [
      { code: "RC-OPP-000392", title: "Working Capital Line", client: "Orbit Retail", value: "₹28.0 Cr", product: "Working Capital", health: "healthy", priority: "high", owner: "R. Nair", ownerInitials: "RN", updated: "48m ago", tracks: 2 },
      { code: "RC-OPP-000355", title: "Expansion Term Loan", client: "Vertex Pharma", value: "₹18.0 Cr", product: "Term Loan", health: "healthy", priority: "medium", owner: "A. Kulkarni", ownerInitials: "AK", updated: "6h ago", tracks: 1 },
    ],
  },
  {
    id: "disbursement",
    label: "Disbursement",
    accent: "oklch(0.6 0.14 162)",
    cards: [
      { code: "RC-OPP-000318", title: "Retail Chain Rollout", client: "Prime Mart", value: "₹24.0 Cr", product: "Business Loan", health: "healthy", priority: "low", owner: "P. Desai", ownerInitials: "PD", updated: "1d ago", tracks: 1 },
    ],
  },
];
