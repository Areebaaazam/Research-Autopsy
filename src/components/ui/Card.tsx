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
    <div id={id} className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}