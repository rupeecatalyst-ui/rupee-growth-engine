import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/crm/Layout";
import StatusBadge from "@/components/crm/StatusBadge";
import { leads } from "../../data/leads";

export const Route = createFileRoute("/crm/loans")({
  component: LoansPage,
});

function LoansPage() {
  const activeStatuses = [
    "Raw Lead",
    "Documents Pending",
    "Login Done",
    "Credit WIP",
    "Soft Approval",
    "Sanctioned",
    "Disbursed",
    "Invoice Raised",
  ];

  const activeLeads = leads.filter((lead) => activeStatuses.includes(lead.status));

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">All Leads</h1>

        <button className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white transition hover:bg-emerald-500">
          + Add Lead
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full">
          <thead className="bg-slate-800 text-sm text-slate-300">
            <tr>
              <th className="p-4 text-left">Lead ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Loan Amount</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Executive</th>
            </tr>
          </thead>

          <tbody>
            {activeLeads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-800 transition hover:bg-slate-800">
                <td className="p-4 font-medium text-white">{lead.id}</td>

                <td className="p-4">
                  <div className="font-medium text-white">{lead.customer}</div>

                  <div className="text-sm text-slate-400">{lead.mobile}</div>
                </td>

                <td className="p-4 text-white">{lead.product}</td>

                <td className="p-4 text-white">₹{lead.amount.toLocaleString("en-IN")}</td>

                <td className="p-4">
                  <StatusBadge status={lead.status} />
                </td>

                <td className="p-4 text-white">{lead.executive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
