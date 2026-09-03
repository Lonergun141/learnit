import { BookCheck, Layers3, LibraryBig, Route } from "lucide-react";
import type { Metadata } from "next";

import { LiveRefresh } from "@/components/ui/live-refresh";
import { getDashboardData, getIntegrationSettings } from "@/lib/learning/queries";
import { hasWorkInFlight } from "@/lib/learning/statuses";

import { AttentionTile } from "./components/attention-tile";
import { CaptureTile } from "./components/capture-tile";
import { FeedTile } from "./components/feed-tile";
import { IdentityTile } from "./components/identity-tile";
import { PlaylistTile } from "./components/playlist-tile";
import { StatTile } from "./components/stat-tile";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [data, integrations] = await Promise.all([getDashboardData(), getIntegrationSettings()]);
  const { settings } = integrations;

  // Only the intake list can hold moving work; completed rows are settled by
  // definition. Polling follows what is on screen, so a stalled item elsewhere
  // in the library never keeps the timer alive.
  const intake = data.recentAdded.map((item) => ({
    ...item,
    failureStage: item.failure_stage,
    date: item.added_at,
    topicName: item.topics?.name,
  }));

  const completed = data.recentCompleted.map((item) => ({
    ...item,
    failureStage: item.failure_stage,
    date: item.built_at,
    topicName: item.topics?.name,
  }));

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <LiveRefresh active={hasWorkInFlight(intake)} />

      {/*
       * Twelve columns on desktop, two on small screens so the counters stay
       * paired instead of becoming a stack of full-width bars. Tiles are placed
       * by span alone — the capture cell's row-span is what opens the notch the
       * playlist tile settles into.
       */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-12">
        {data.counts.failed > 0 ? (
          <AttentionTile count={data.counts.failed} className="col-span-2 lg:col-span-12" />
        ) : null}

        <IdentityTile className="col-span-2 lg:col-span-6" />
        <StatTile label="Library" value={data.counts.total} icon={LibraryBig} className="lg:col-span-3" />
        <StatTile label="Topics" value={data.counts.topics} icon={Layers3} className="lg:col-span-3" />

        <CaptureTile className="col-span-2 lg:col-span-6 lg:row-span-2" />
        <StatTile label="In transit" value={data.counts.processing} icon={Route} className="lg:col-span-3" />
        <StatTile label="Ready" value={data.counts.completed} icon={BookCheck} className="lg:col-span-3" />

        <PlaylistTile
          className="col-span-2 lg:col-span-6"
          enabled={settings.youtube_capture_enabled}
          playlistId={settings.youtube_playlist_id}
          dailyLimit={settings.daily_item_limit}
          lastPolledAt={settings.youtube_last_polled_at}
        />

        <FeedTile
          className="col-span-2 lg:col-span-6"
          label="In transit"
          items={intake}
          emptyTitle="Nothing in transit"
          emptyDescription="Save a link to begin."
        />
        <FeedTile
          className="col-span-2 lg:col-span-6"
          label="Ready to study"
          items={completed}
          emptyTitle="Nothing ready yet"
          emptyDescription="Finished materials land here."
        />
      </div>
    </div>
  );
}
