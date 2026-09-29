interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export function MetricBar({ label, value, max = 10, color = 'emerald' }: MetricBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-muted)]">{value}/{max}</span>
      </div>
      <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-200 ${colorMap[color] || colorMap.emerald}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}