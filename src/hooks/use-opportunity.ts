// RCLIP — Opportunity data hooks (Sprint 4.2, READ-ONLY).
// ----------------------------------------------------------------------------
// Thin React Query wrappers over OpportunityRepository. Components consume these
// and never touch Supabase directly. Query keys are keyed by opportunity so the
// Header, Client Summary, and the tab/overview cards share a single fetch.
import { useQuery } from "@tanstack/react-query";
import { OpportunityRepository } from "@/lib/repositories/opportunity-repository";

const STALE_TIME = 60_000;

/** Header + Client Summary. `idOrCode` may be a UUID or an RC-OPP business code. */
export function useOpportunity(idOrCode: string | undefined) {
  return useQuery({
    queryKey: ["opportunity", idOrCode],
    queryFn: () => OpportunityRepository.getOpportunityById(idOrCode as string),
    enabled: Boolean(idOrCode),
    staleTime: STALE_TIME,
  });
}

export function useProducts(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-products", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityProducts(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useInstitutionTracks(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-institution-tracks", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityInstitutionTracks(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useReadiness(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-readiness", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityReadiness(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityTasks(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-tasks", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityTasks(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityTimeline(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-timeline", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityTimeline(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityCommunications(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-communications", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityCommunications(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityDocuments(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-documents", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityDocuments(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityStageHistory(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-stage-history", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityStageHistory(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}

export function useOpportunityInformationSheet(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ["opportunity-information-sheet", opportunityId],
    queryFn: () => OpportunityRepository.getOpportunityInformationSheet(opportunityId as string),
    enabled: Boolean(opportunityId),
    staleTime: STALE_TIME,
  });
}
