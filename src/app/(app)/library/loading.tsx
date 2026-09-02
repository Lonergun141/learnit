export default function LibraryLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading library">
      <div className="space-y-3 border-b border-line pb-6">
        <div className="h-8 w-36 rounded-lg bg-surface-strong" />
        <div className="h-4 max-w-xl rounded bg-surface-strong" />
      </div>
      <div className="h-24 rounded-2xl bg-surface" />
      <div className="h-[28rem] rounded-2xl bg-surface" />
    </div>
  );
}
