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

export function PreferencesForm({ settings }: PreferencesFormProps) {
  const [state, action, pending] = useActionState<PreferencesActionState, FormData>(
    updatePreferencesAction,
    {},
  );
  const timezoneOptions = timezones.includes(settings.timezone)
    ? timezones
    : [settings.timezone, ...timezones];

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Timezone" name="timezone" defaultValue={settings.timezone}>
          {timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
        </SelectField>
        <SelectField label="Digest hour" name="digestHour" defaultValue={String(settings.digest_hour)}>
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>
          ))}
        </SelectField>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-surface-muted px-4 py-3.5">
        <input className="mt-1 size-4 accent-[#1f8f64]" type="checkbox" name="digestEnabled" defaultChecked={settings.digest_enabled} />
        <span>
          <span className="block text-sm font-semibold text-ink">Daily Telegram digest</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink-muted">Send newly completed learning materials at the selected local hour.</span>
        </span>
      </label>

      <div className="border-t border-line pt-6">
        <h3 className="text-sm font-semibold text-ink">YouTube playlist capture</h3>
        <p className="mt-1 text-xs leading-5 text-ink-muted">Poll one playlist hourly and add videos that are not already in your library.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_10rem]">
          <InputField
            label="Playlist ID"
            name="youtubePlaylistId"
            placeholder="PL…"
            defaultValue={settings.youtube_playlist_id ?? ""}
            error={state.fieldErrors?.youtubePlaylistId?.[0]}
          />
          <InputField
            label="Daily item limit"
            name="dailyItemLimit"
            type="number"
            min={1}
            max={100}
            defaultValue={settings.daily_item_limit}
            error={state.fieldErrors?.dailyItemLimit?.[0]}
          />
        </div>
        <label className="mt-4 flex items-start gap-3">
          <input className="mt-1 size-4 accent-[#1f8f64]" type="checkbox" name="youtubeCaptureEnabled" defaultChecked={settings.youtube_capture_enabled} />
          <span>
            <span className="block text-sm font-semibold text-ink">Enable playlist capture</span>
            <span className="mt-0.5 block text-xs text-ink-muted">Requires a public or accessible playlist ID.</span>
          </span>
        </label>
      </div>

      {state.message ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${state.status === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`} role="status">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={pending} type="submit">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}
