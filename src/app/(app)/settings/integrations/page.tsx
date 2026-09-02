import { Send, Video } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { getTelegramBotUsername } from "@/lib/env/server";
import { getIntegrationSettings } from "@/lib/learning/queries";
import { formatDateTime } from "@/lib/utils/format";

import { PreferencesForm } from "./components/preferences-form";
import { PlaylistSync } from "./components/playlist-sync";
import { TelegramConnect } from "./components/telegram-connect";
import { TelegramDisconnect } from "./components/telegram-disconnect";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const { settings, telegramConnection } = await getIntegrationSettings();
  const telegramName = telegramConnection
    ? telegramConnection.telegram_username
      ? `@${telegramConnection.telegram_username}`
      : [telegramConnection.telegram_first_name, telegramConnection.telegram_last_name].filter(Boolean).join(" ") || "Telegram account"
    : null;

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description="Control how sources enter your network and when finished work reaches you." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.62fr)]">
        <section className="rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)] sm:px-6 sm:py-6">
          <div className="mb-6 flex items-start gap-4 border-b border-line pb-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger"><Video size={20} /></span>
            <div>
              <h2 className="text-base font-semibold text-ink">Capture and delivery</h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">Playlist polling, daily limits, and local digest timing.</p>
            </div>
          </div>
          <PreferencesForm settings={settings} />
          {settings.youtube_capture_enabled && settings.youtube_playlist_id ? (
            <PlaylistSync />
          ) : null}
        </section>

        <section className="rounded-2xl bg-surface px-5 py-5 shadow-[0_8px_24px_rgba(20,34,31,0.05)] sm:px-6 sm:py-6">
          {telegramConnection ? (
            <div>
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success"><Send size={20} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-success">Connected</p>
                  <h2 className="mt-0.5 truncate text-base font-semibold text-ink">{telegramName}</h2>
                  <p className="mt-1 text-xs text-ink-muted">Since {formatDateTime(telegramConnection.connected_at)}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-ink-muted">Links sent to <strong className="font-semibold text-ink">@{getTelegramBotUsername()}</strong> are saved only to this LearnIT account.</p>
              <TelegramDisconnect />
            </div>
          ) : (
            <TelegramConnect />
          )}
        </section>
      </div>
    </div>
  );
}
