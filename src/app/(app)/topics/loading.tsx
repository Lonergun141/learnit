export default function TopicsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading topics">
      <div className="space-y-3 border-b border-line pb-6">
        <div className="h-8 w-32 rounded-lg bg-surface-strong" />
        <div className="h-4 max-w-lg rounded bg-surface-strong" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="h-48 rounded-2xl bg-surface" key={index} />
        ))}
      </div>
    </div>
  );
}
