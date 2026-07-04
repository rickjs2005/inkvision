export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="flex min-h-dvh items-center justify-center bg-background"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
