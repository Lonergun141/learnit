export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-7" aria-label="Loading dashboard">
      <div className="space-y-3 border-b border-line pb-6">
        <div className="h-8 w-52 rounded-lg bg-surface-strong" />
        <div className="h-4 w-full max-w-lg rounded bg-surface-strong" />
      </div>
      <div className="h-28 rounded-2xl bg-surface" />
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="h-96 rounded-2xl bg-surface" />
        <div className="h-96 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
