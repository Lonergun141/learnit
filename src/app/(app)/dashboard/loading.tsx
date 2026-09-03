export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading dashboard">
      <div className="border-b border-line px-6 pb-24 pt-28 sm:px-10 lg:px-14">
        <div className="h-2 w-24 bg-surface-strong" />
        <div className="mt-12 h-20 w-full max-w-2xl bg-surface-strong" />
      </div>
      <div className="grid grid-cols-2 border-b border-line lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="border-b border-r border-line px-8 py-9 lg:border-b-0" key={index}>
            <div className="h-2 w-16 bg-surface-strong" />
            <div className="mt-9 h-10 w-16 bg-surface-strong" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div className="border-b border-line lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]" key={index}>
          <div className="border-line px-10 py-16 lg:border-r">
            <div className="h-2 w-8 bg-surface-strong" />
            <div className="mt-4 h-3 w-24 bg-surface-strong" />
          </div>
          <div className="space-y-6 px-10 py-16">
            <div className="h-3 w-full max-w-md bg-surface-strong" />
            <div className="h-3 w-full max-w-sm bg-surface-strong" />
            <div className="h-3 w-full max-w-lg bg-surface-strong" />
          </div>
        </div>
      ))}
    </div>
  );
}
