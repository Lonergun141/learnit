import type { Metadata } from "next";

import { HeroBand } from "@/components/ui/hero-band";
import { SheetSection } from "@/components/ui/sheet-section";
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
    <div>
      <HeroBand eyebrow="Configuration" figure="node" title="Settings" />

      <SheetSection index="01" label="Capture">
        <div className="max-w-2xl">
          <PreferencesForm settings={settings} />
          {settings.youtube_capture_enabled && settings.youtube_playlist_id ? (
            <PlaylistSync />
          ) : null}
        </div>
      </SheetSection>

      <SheetSection
        index="02"
        label="Telegram"
        action={
          telegramConnection ? (
            <p className="mono-label text-signal">Connected</p>
          ) : (
            <p className="mono-label">Not linked</p>
          )
        }
      >
        <div className="max-w-2xl">
          {telegramConnection ? (
            <div>
              <p className="display text-[1.35rem] leading-tight">{telegramName}</p>
              <p className="mono-label mt-4">
                Since {formatDateTime(telegramConnection.connected_at)}
              </p>
              <p className="mt-8 max-w-md text-sm leading-7 text-ink-muted">
                Links sent to{" "}
                <strong className="font-semibold text-signal">
                  @{getTelegramBotUsername()}
                </strong>{" "}
                save to this account only.
              </p>
              <TelegramDisconnect />
            </div>
          ) : (
            <TelegramConnect />
          )}
        </div>
      </SheetSection>
    </div>
  );
}
