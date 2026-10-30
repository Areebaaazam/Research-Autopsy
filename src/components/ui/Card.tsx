import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
  id?: string;
}

export function Card({ title, subtitle, children, className = '', headerRight, id }: CardProps) {
  return (
    <div id={id} className={`bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-slate-600/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-slate-900/30 flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}