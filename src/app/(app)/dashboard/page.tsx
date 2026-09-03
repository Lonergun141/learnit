import type { Metadata } from "next";
import Link from "next/link";

import { Blueprint } from "@/components/ui/blueprint";
import { HeroBand } from "@/components/ui/hero-band";
import { SheetSection } from "@/components/ui/sheet-section";
import { getDashboardData, getIntegrationSettings } from "@/lib/learning/queries";
import { formatDateTime } from "@/lib/utils/format";

import { PlaylistSync } from "../settings/integrations/components/playlist-sync";
import { MetricStrip } from "./components/metric-strip";
import { RecentItems } from "./components/recent-items";
import { SaveLinkForm } from "./components/save-link-form";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [data, integrations] = await Promise.all([getDashboardData(), getIntegrationSettings()]);
  const { settings } = integrations;
  const playlistReady = Boolean(settings.youtube_capture_enabled && settings.youtube_playlist_id);

  return (
    <div>
      <HeroBand
        eyebrow="Overview"
        figure="orbit"
        title={
          <>
            Learning <span className="accent-italic text-signal">network</span>
          </>
        }
        meta={
          <div className="mono-label flex gap-5 sm:block">
            <span className="block text-ink-soft">
              {String(data.counts.total).padStart(2, "0")} sources
            </span>
            <span className="block sm:mt-2">
              {String(data.counts.topics).padStart(2, "0")} topics
            </span>
          </div>
        }
      />

      <MetricStrip counts={data.counts} />

      <SheetSection index="01" label="Capture" flush>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="border-b border-line px-6 py-8 sm:px-10 sm:py-10 lg:border-b-0 lg:border-r lg:px-14">
            <div className="max-w-xl">
              <SaveLinkForm />
            </div>
          </div>

          <div className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-10">
            <Blueprint
              variant="orbit"
              className="pointer-events-none absolute -right-20 bottom-0 h-40 w-72 text-signal/[0.08]"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <p className="mono-label">Playlist capture</p>
                <span
                  className={`mono-label ${playlistReady ? "text-signal" : "text-ink-faint"}`}
                >
                  {playlistReady ? "Armed" : "Off"}
                </span>
              </div>

              {playlistReady ? (
                <>
                  <p className="mt-5 break-all font-mono text-[0.8125rem] text-ink-soft">
                    {settings.youtube_playlist_id}
                  </p>
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <dt className="mono-label">Daily limit</dt>
                      <dd className="mt-2 font-mono text-[0.75rem] tabular-nums text-ink-muted">
                        {settings.daily_item_limit}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono-label">Last poll</dt>
                      <dd className="mt-2 font-mono text-[0.75rem] text-ink-muted">
                        {formatDateTime(settings.youtube_last_polled_at)}
                      </dd>
                    </div>
                  </dl>
                  <PlaylistSync />
                </>
              ) : (
                <>
                  <p className="mt-5 max-w-xs text-sm leading-7 text-ink-muted">
                    Point LearnIT at a YouTube playlist and it polls hourly.
                  </p>
                  <Link className="bracket-link mt-6" href="/settings/integrations">
                    Configure
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetSection>

      <SheetSection
        index="02"
        label="Completed"
        action={
          <Link className="bracket-link" href="/library">
            All
          </Link>
        }
        flush
      >
        <RecentItems
          items={data.recentCompleted.map((item) => ({
            ...item,
            status: item.status,
            date: item.built_at,
            topicName: item.topics?.name,
          }))}
          emptyTitle="Nothing ready yet"
          emptyDescription="Finished materials land here."
        />
      </SheetSection>

      <SheetSection
        index="03"
        label="Intake"
        action={
          <Link className="bracket-link" href="/library">
            All
          </Link>
        }
        flush
      >
        <RecentItems
          items={data.recentAdded.map((item) => ({
            ...item,
            status: item.status,
            date: item.added_at,
            topicName: item.topics?.name,
          }))}
          emptyTitle="Intake is empty"
          emptyDescription="Save a link to begin."
        />
      </SheetSection>
    </div>
  );
}
