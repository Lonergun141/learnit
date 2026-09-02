export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading settings">
      <div className="space-y-3 border-b border-line pb-6"><div className="h-8 w-36 rounded-lg bg-surface-strong" /><div className="h-4 max-w-xl rounded bg-surface-strong" /></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.62fr]"><div className="h-[34rem] rounded-2xl bg-surface" /><div className="h-72 rounded-2xl bg-surface" /></div>
    </div>
  );
}
