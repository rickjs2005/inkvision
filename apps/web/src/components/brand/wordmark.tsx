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
        d="M12 2.5c3.6 4.2 6 7.4 6 10.6a6 6 0 1 1-12 0c0-3.2 2.4-6.4 6-10.6Z"
        fill="currentColor"
      />
      {/* reflexo/agulha em vermelhão */}
      <path
        d="M12 8.5c1.8 2 2.9 3.6 2.9 5.1a2.9 2.9 0 0 1-2.9 2.9"
        stroke="var(--primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
