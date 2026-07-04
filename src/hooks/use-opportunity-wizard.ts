// RCLIP — Create Opportunity Wizard hooks (Sprint 4.8, WRITE path).
// ----------------------------------------------------------------------------
// React Query wrappers over the wizard read (catalogs + party search) and the
// single write (`createOpportunity`). Components consume these and never touch
// Supabase directly. Catalogs are cached long; party search is debounced by the
// caller and only enabled once a meaningful query is present.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  OpportunityRepository,
  type CreateOpportunityInput,
} from "@/lib/repositories/opportunity-repository";

const CATALOG_STALE_TIME = 5 * 60_000;
const SEARCH_STALE_TIME = 30_000;
const MIN_QUERY_LENGTH = 2;

export function useOpportunityTypes() {
  return useQuery({
    queryKey: ["catalog", "opportunity-types"],
    queryFn: () => OpportunityRepository.listOpportunityTypes(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useOpportunityPriorities() {
  return useQuery({
    queryKey: ["catalog", "opportunity-priorities"],
    queryFn: () => OpportunityRepository.listPriorities(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useEngagementTypes() {
  return useQuery({
    queryKey: ["catalog", "engagement-types"],
    queryFn: () => OpportunityRepository.listEngagementTypes(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useObjectives() {
  return useQuery({
    queryKey: ["catalog", "objectives"],
    queryFn: () => OpportunityRepository.listObjectives(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useTeamRoles() {
  return useQuery({
    queryKey: ["catalog", "team-roles"],
    queryFn: () => OpportunityRepository.listTeamRoles(),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useProductCatalog() {
  return useQuery({
    queryKey: ["catalog", "products"],
    queryFn: () => OpportunityRepository.listProducts(),
    staleTime: CATALOG_STALE_TIME,
  });
}

/** Search individuals (Contact master). Pass a debounced query. */
export function useContactSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", "contacts", q],
    queryFn: () => OpportunityRepository.searchContacts(q),
    enabled: q.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}

/** Search organizations / companies (Entity master). Pass a debounced query. */
export function useEntitySearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", "entities", q],
    queryFn: () => OpportunityRepository.searchEntities(q),
    enabled: q.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}

/** Search institutions (Entities with Entity Type = Institution). */
export function useInstitutionSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", "institutions", q],
    queryFn: () => OpportunityRepository.searchInstitutions(q),
    enabled: q.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOpportunityInput) => OpportunityRepository.createOpportunity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity"] });
    },
  });
}
