import Link from "next/link";

interface BrandProps {
  inverse?: boolean;
}

export function Brand({ inverse = false }: BrandProps) {
  return (
    <Link
      className={`inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${inverse ? "text-white" : "text-ink"}`}
      href="/"
      aria-label="LearnIT home"
    >
      <span className="relative grid size-8 place-items-center rounded-lg bg-signal text-sm font-bold text-white shadow-[0_5px_14px_rgba(31,143,100,0.28)]">
        L
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-current bg-[#f0d36a]" />
      </span>
      <span className="text-[1.05rem] font-semibold tracking-[-0.025em]">LearnIT</span>
    </Link>
  );
}
