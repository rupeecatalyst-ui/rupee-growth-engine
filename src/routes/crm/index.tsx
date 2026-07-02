import Layout from "@/components/crm/Layout";
import StatCard from "@/components/crm/StatCard";
import { Users, IndianRupee, Briefcase, CheckCircle } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/")({
  component: CRMDashboard,
});

function CRMDashboard() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value="0" icon={<Users />} />

        <StatCard title="Pipeline" value="₹0" icon={<Briefcase />} />

        <StatCard title="Revenue" value="₹0" icon={<IndianRupee />} />

        <StatCard title="Completed" value="0" icon={<CheckCircle />} />
      </div>
    </Layout>
  );
}
