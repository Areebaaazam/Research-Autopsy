export function LoadingSpinner({ text = 'Processing...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-live="polite">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}