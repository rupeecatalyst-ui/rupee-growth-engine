// RCLIP — Create Opportunity Wizard · reusable debounced party search.
// Used for client (contact/entity), institutions and coverage members. It never
// touches Supabase; it takes a React Query search hook and renders results.
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, UserRound, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PartyOption } from "@/lib/repositories/opportunity-repository";

interface PartySearchProps {
  useSearch: (query: string) => {
    data?: PartyOption[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  };
  onSelect: (party: PartyOption) => void;
  placeholder?: string;
  excludeIds?: string[];
  autoFocus?: boolean;
  "aria-label"?: string;
}

export function PartySearch({
  useSearch,
  onSelect,
  placeholder = "Search…",
  excludeIds = [],
  autoFocus,
  "aria-label": ariaLabel,
}: PartySearchProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const excludeKey = excludeIds.join(",");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching, isError } = useSearch(debounced);

  const results = useMemo(
    () => (data ?? []).filter((p) => !excludeIds.includes(p.id)),
    // excludeKey keeps the memo honest without depending on array identity.
    [data, excludeKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const active = debounced.trim().length >= 2;
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          className="pl-9"
        />
        {isFetching && active && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {active && (
        <div className="overflow-hidden rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : isError ? (
            <div className="px-3 py-3 text-sm text-destructive">Search failed. Try again.</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">No matches found.</div>
          ) : (
            <ul ref={listRef} className="max-h-64 divide-y overflow-y-auto">
              {results.map((p) => (
                <li key={`${p.kind}-${p.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      setQuery("");
                      setDebounced("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm outline-none transition-colors",
                      "hover:bg-muted focus-visible:bg-muted",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {p.kind === "entity" ? (
                        <Building2 className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      {p.sublabel && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.sublabel}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {p.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
