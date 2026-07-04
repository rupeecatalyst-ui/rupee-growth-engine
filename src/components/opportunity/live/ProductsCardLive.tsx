// RCLIP — Products (LIVE). Resolves the opportunity id from the code, then
// fetches its products and renders the frozen ProductsCard.
import { Layers } from "lucide-react";
import { ProductsCard } from "@/components/opportunity/ProductsCard";
import { useOpportunity, useProducts } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <Layers className="size-4" />;

export function ProductsCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const products = useProducts(core.data?.id);
  const live = combineLive(core, products);

  if (live.isLoading) return <CardSkeleton title="Products" icon={ICON} />;
  if (live.isError || !products.data)
    return <CardError title="Products" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <ProductsCard products={products.data} />;
}
