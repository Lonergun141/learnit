import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { getTopicsData } from "@/lib/learning/queries";

import { TopicList } from "./components/topic-list";

export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage() {
  const topics = await getTopicsData();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Topics"
        description="Your source library reorganized into reusable paths for deeper learning."
      />
      <p className="text-xs font-medium tabular-nums text-ink-faint">
        {topics.length} {topics.length === 1 ? "topic" : "topics"}
      </p>
      <TopicList topics={topics} />
    </div>
  );
}
