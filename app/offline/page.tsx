'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[var(--bg)] px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-[var(--surface)] text-4xl">📡</div>
      <div>
        <h1 className="text-2xl font-black [font-family:var(--font-display)] text-[var(--text-primary)]">Sin conexión</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">Revisa tu internet e intenta de nuevo.</p>
      </div>
      <button onClick={() => window.location.reload()}
        className="flex h-12 w-full max-w-xs items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-white">
        Reintentar
      </button>
    </div>
  );
}
