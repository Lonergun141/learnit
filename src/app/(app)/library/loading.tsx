export default function LibraryLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading library">
      <div className="border-b border-line px-6 pb-24 pt-28 sm:px-10 lg:px-14">
        <div className="h-2 w-20 bg-surface-strong" />
        <div className="mt-12 h-20 w-full max-w-xl bg-surface-strong" />
      </div>
      <div className="border-b border-line lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="border-line px-10 py-16 lg:border-r">
          <div className="h-2 w-8 bg-surface-strong" />
        </div>
        <div className="grid gap-6 px-10 py-16 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-11 bg-surface-strong" key={index} />
          ))}
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="border-line px-10 py-16 lg:border-r">
          <div className="h-2 w-8 bg-surface-strong" />
        </div>
        <div>
          {Array.from({ length: 6 }, (_, index) => (
            <div className="border-b border-line px-10 py-7" key={index}>
              <div className="h-3 w-full max-w-sm bg-surface-strong" />
              <div className="mt-3 h-2 w-full max-w-md bg-surface-strong" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
