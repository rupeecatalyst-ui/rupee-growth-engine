import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Download } from "lucide-react";
import Layout from "@/components/crm/Layout";
import StatusBadge from "@/components/crm/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Panel } from "@/components/crm/ui-bits";
import { leads } from "../../data/leads";

export const Route = createFileRoute("/crm/loans")({
  component: LeadsPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function LeadsPage() {
  return (
    <Layout title="Leads">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">{leads.length} intake records from all channels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search leads…"
              className="h-9 w-56 rounded-lg border bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" /> Add Lead
          </Button>
        </div>
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 text-left font-medium">Lead ID</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Product</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                <th scope="col" className="hidden px-4 py-3 text-left font-medium lg:table-cell">Source</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Executive</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.customer}</div>
                    <div className="text-xs text-muted-foreground">{lead.mobile}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.product}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    ₹{lead.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="text-sm">{lead.source}</div>
                    <div className="text-xs text-muted-foreground">{lead.sourceType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">{initials(lead.executive)}</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">{lead.executive}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Layout>
  );
}
