import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { getDashboardData } from "@/lib/learning/queries";

import { MetricStrip } from "./components/metric-strip";
import { RecentItems } from "./components/recent-items";
import { SaveLinkForm } from "./components/save-link-form";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Learning network"
        description="Capture a source, follow its progress, and return when the materials are ready."
      />
      <MetricStrip counts={data.counts} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
        <section className="rounded-2xl bg-surface px-5 py-5 shadow-[0_10px_30px_rgba(20,34,31,0.06)] sm:px-6">
          <h2 className="text-base font-semibold text-ink">Save a link</h2>
          <p className="mb-5 mt-1 text-xs leading-5 text-ink-muted">
            YouTube videos and articles are supported.
          </p>
          <SaveLinkForm />
        </section>
        <div className="grid min-w-0 gap-6 2xl:grid-cols-2">
          <RecentItems
            title="Recently completed"
            description="Materials ready for review."
            items={data.recentCompleted.map((item) => ({
              ...item,
              status: item.status,
              date: item.built_at,
              topicName: item.topics?.name,
            }))}
          />
          <RecentItems
            title="Recently added"
            description="The latest sources entering your network."
            items={data.recentAdded.map((item) => ({
              ...item,
              status: item.status,
              date: item.added_at,
              topicName: item.topics?.name,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
