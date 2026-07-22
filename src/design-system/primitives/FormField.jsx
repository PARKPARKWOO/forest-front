export default function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const controlClassName = [
    'min-h-forest-control w-full rounded-forest-control border bg-forest-surface-card px-forest-4 py-forest-2 text-forest-label text-forest-text-primary',
    'focus:border-forest-primary focus:outline focus:outline-forest focus:outline-offset-2 focus:outline-forest-focus',
    error ? 'border-forest-danger-text' : 'border-forest-border-strong',
  ].join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-forest-label font-bold text-forest-text-primary">
        {label}{required && <span className="ml-1 text-forest-danger-text" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={hintId} className="mt-forest-1 text-forest-supporting text-forest-text-muted">{hint}</p>}
      <div className="mt-forest-2">
        {children({
          id,
          required,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': describedBy,
          className: controlClassName,
        })}
      </div>
      {error && <p id={errorId} className="mt-forest-2 text-forest-supporting font-semibold text-forest-danger-text">{error}</p>}
    </div>
  );
}
