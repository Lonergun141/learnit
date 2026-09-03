export default function TopicsLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading topics">
      <div className="border-b border-line px-6 pb-24 pt-28 sm:px-10 lg:px-14">
        <div className="h-2 w-16 bg-surface-strong" />
        <div className="mt-12 h-20 w-full max-w-xl bg-surface-strong" />
      </div>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="border-line px-10 py-16 lg:border-r">
          <div className="h-2 w-8 bg-surface-strong" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="min-h-[17rem] border-b border-r border-line p-10" key={index}>
              <div className="h-2 w-8 bg-surface-strong" />
              <div className="mt-20 h-6 w-40 bg-surface-strong" />
              <div className="mt-5 h-2 w-24 bg-surface-strong" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
