interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]',
  success: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
  warning: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  danger: 'bg-red-900/30 text-red-300 border-red-700/50',
  info: 'bg-blue-900/30 text-blue-300 border-blue-700/50',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}