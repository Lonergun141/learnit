"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";

import { updatePreferencesAction } from "../actions";
import type { PreferencesActionState } from "../lib/settings-schema";

interface PreferencesFormProps {
  settings: {
    digest_enabled: boolean;
    digest_hour: number;
    timezone: string;
    youtube_playlist_id: string | null;
    youtube_capture_enabled: boolean;
    daily_item_limit: number;
  };
}

const timezones = ["UTC", "Asia/Shanghai", "Asia/Manila", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles"];

const toggleClassName =
  "mt-0.5 size-4 shrink-0 accent-[#c3eda1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

export function PreferencesForm({ settings }: PreferencesFormProps) {
  const [state, action, pending] = useActionState<PreferencesActionState, FormData>(
    updatePreferencesAction,
    {},
  );
  const timezoneOptions = timezones.includes(settings.timezone)
    ? timezones
    : [settings.timezone, ...timezones];

  return (
    <form action={action} className="grid gap-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField label="Timezone" name="timezone" defaultValue={settings.timezone}>
          {timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
        </SelectField>
        <SelectField label="Digest hour" name="digestHour" defaultValue={String(settings.digest_hour)}>
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>
          ))}
        </SelectField>
      </div>

      <label className="flex cursor-pointer items-start gap-4 border-l-2 border-line py-1 pl-5 transition-colors hover:border-signal">
        <input className={toggleClassName} type="checkbox" name="digestEnabled" defaultChecked={settings.digest_enabled} />
        <span>
          <span className="block font-display text-[0.8rem] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Daily digest
          </span>
          <span className="mt-2 block text-xs leading-5 text-ink-faint">
            Sent at the selected local hour.
          </span>
        </span>
      </label>

      <div className="border-t border-line pt-10">
        <p className="mono-label">Playlist capture</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_9rem]">
          <InputField
            label="Playlist ID"
            name="youtubePlaylistId"
            placeholder="PL…"
            defaultValue={settings.youtube_playlist_id ?? ""}
            error={state.fieldErrors?.youtubePlaylistId?.[0]}
          />
          <InputField
            label="Daily limit"
            name="dailyItemLimit"
            type="number"
            min={1}
            max={100}
            defaultValue={settings.daily_item_limit}
            error={state.fieldErrors?.dailyItemLimit?.[0]}
          />
        </div>
        <label className="mt-8 flex cursor-pointer items-start gap-4 border-l-2 border-line py-1 pl-5 transition-colors hover:border-signal">
          <input className={toggleClassName} type="checkbox" name="youtubeCaptureEnabled" defaultChecked={settings.youtube_capture_enabled} />
          <span>
            <span className="block font-display text-[0.8rem] font-semibold uppercase tracking-[0.07em] text-ink-soft">
              Enable capture
            </span>
            <span className="mt-2 block text-xs leading-5 text-ink-faint">
              Polls the playlist hourly.
            </span>
          </span>
        </label>
      </div>

      {state.message ? (
        <p
          className={`border-l-2 py-3 pl-4 text-sm leading-6 ${
            state.status === "error"
              ? "border-danger bg-danger-soft/60 text-danger"
              : "border-signal bg-signal-soft/60 text-signal"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <Button disabled={pending} type="submit">
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
