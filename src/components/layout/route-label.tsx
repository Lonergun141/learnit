"use client";

import { usePathname } from "next/navigation";

const sectionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  library: "Library",
  topics: "Topics",
  settings: "Settings",
};

/**
 * The address line in the top bar. Reads the pathname so the sheet always says
 * which page is on the table.
 */
export function RouteLabel() {
  const pathname = usePathname();
  const [, root, child] = pathname.split("/");
  const section = sectionLabels[root ?? ""] ?? "Home";
  const detail = root && child && !sectionLabels[child] ? "Detail" : null;

  return (
    <p className="mono-label flex items-center gap-2 truncate">
      <span className="text-line-strong">learnit</span>
      <span className="text-line-strong" aria-hidden="true">/</span>
      <span className="text-ink-soft">{section}</span>
      {detail ? (
        <>
          <span className="text-line-strong" aria-hidden="true">/</span>
          <span className="text-ink-faint">{detail}</span>
        </>
      ) : null}
    </p>
  );
}
