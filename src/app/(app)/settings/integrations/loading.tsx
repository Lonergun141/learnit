export default function SettingsLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading settings">
      <div className="border-b border-line px-6 pb-24 pt-28 sm:px-10 lg:px-14">
        <div className="h-2 w-28 bg-surface-strong" />
        <div className="mt-12 h-20 w-full max-w-lg bg-surface-strong" />
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div className="border-b border-line lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]" key={index}>
          <div className="border-line px-10 py-16 lg:border-r">
            <div className="h-2 w-8 bg-surface-strong" />
            <div className="mt-4 h-3 w-20 bg-surface-strong" />
          </div>
          <div className="space-y-8 px-10 py-16">
            <div className="h-11 w-full max-w-md bg-surface-strong" />
            <div className="h-11 w-full max-w-md bg-surface-strong" />
            <div className="h-11 w-32 bg-surface-strong" />
          </div>
        </div>
      ))}
    </div>
  );
}
