import type { Metadata } from "next";

import { HeroBand } from "@/components/ui/hero-band";
import { SheetSection } from "@/components/ui/sheet-section";
import { getTopicsData } from "@/lib/learning/queries";

import { TopicList } from "./components/topic-list";

export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage() {
  const topics = await getTopicsData();

  return (
    <div>
      <HeroBand
        eyebrow="Map"
        figure="burst"
        title={
          <>
            Topic <span className="accent-italic text-signal">routes</span>
          </>
        }
        meta={
          <div className="flex items-baseline gap-3 sm:block">
            <p className="display text-[1.75rem] leading-none tabular-nums">
              {String(topics.length).padStart(2, "0")}
            </p>
            <p className="mono-label sm:mt-2">{topics.length === 1 ? "Route" : "Routes"}</p>
          </div>
        }
      />

      <SheetSection index="01" label="Routes" flush>
        <TopicList topics={topics} />
      </SheetSection>
    </div>
  );
}
