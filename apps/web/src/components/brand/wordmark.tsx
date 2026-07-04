import { cn } from "@/lib/utils";

/**
 * Marca InkVision — monograma de gota de tinta com um traço de agulha em
 * vermelhão, ao lado do wordmark na serifa de display. Substitui o glyph ◈.
 */
export function Wordmark({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <InkMark className="size-[22px]" />
      {!markOnly && (
        <span className="font-display text-[19px] leading-none tracking-[-0.02em]">
          Ink<span className="italic text-primary">Vision</span>
        </span>
      )}
    </span>
  );
}

export function InkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* gota de tinta */}
      <path
        d="M12 2.5c3.7 4.3 6 7.5 6 10.7a6 6 0 0 1-12 0c0-3.2 2.3-6.4 6-10.7Z"
        fill="currentColor"
      />
      {/* agulha em linha contínua — sobe pela gota e aponta (vermelhão) */}
      <path
        d="M12 21.5V12.5L17.5 4.5"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="17.5" cy="4.5" r="1.5" fill="var(--primary)" />
    </svg>
  );
}
