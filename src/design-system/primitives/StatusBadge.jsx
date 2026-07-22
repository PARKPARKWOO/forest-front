const tones = {
  neutral: 'border-forest-border-subtle bg-forest-surface-raised text-forest-text-primary',
  success: 'border-forest-success-border bg-forest-success-surface text-forest-success-text',
  warning: 'border-forest-warning-border bg-forest-warning-surface text-forest-warning-text',
  danger: 'border-forest-danger-border bg-forest-danger-surface text-forest-danger-text',
  info: 'border-forest-info-border bg-forest-info-surface text-forest-info-text',
};

export default function StatusBadge({ tone = 'neutral', size = 'md', icon, children, className = '', ...props }) {
  const sizeClassName = size === 'sm'
    ? 'px-forest-3 py-forest-1 text-forest-label'
    : 'min-h-forest-control px-forest-4 py-forest-2 text-forest-label';
  return (
    <span className={`inline-flex items-center gap-forest-2 rounded-full border font-bold ${tones[tone] ?? tones.neutral} ${sizeClassName} ${className}`.trim()} {...props}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
