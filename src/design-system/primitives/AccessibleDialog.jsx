import { useEffect, useId, useRef } from 'react';
import Button from './Button';
import useFocusTrap from './useFocusTrap';

const sizeClasses = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export default function AccessibleDialog({
  isOpen,
  title,
  description,
  onClose,
  initialFocusRef,
  focusVersion,
  closeOnBackdrop = false,
  size = 'lg',
  footer,
  closeLabel = '닫기',
  className = '',
  children,
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({
    containerRef: dialogRef,
    initialFocusRef: initialFocusRef ?? closeButtonRef,
    isActive: isOpen,
    onEscape: onClose,
    version: focusVersion,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-surface-scrim p-forest-3 sm:p-forest-6"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`max-h-full w-full overflow-y-auto rounded-forest-dialog border border-forest-border-subtle bg-forest-surface-card p-forest-panel shadow-2xl ${sizeClasses[size] ?? sizeClasses.lg} ${className}`.trim()}
      >
        <header className="flex flex-col items-stretch justify-between gap-forest-4 sm:flex-row sm:items-start">
          <div>
            <h2 id={titleId} className="text-forest-heading-2 font-bold text-forest-text-primary">{title}</h2>
            {description && <p id={descriptionId} className="mt-forest-2 text-forest-supporting text-forest-text-muted">{description}</p>}
          </div>
          <Button
            ref={closeButtonRef}
            variant="secondary"
            className="focus:outline focus:outline-forest focus:outline-offset-2 focus:outline-forest-focus"
            onClick={onClose}
          >
            {closeLabel}
          </Button>
        </header>
        <div className="mt-forest-4">{children}</div>
        {footer && <footer className="mt-forest-6">{footer}</footer>}
      </div>
    </div>
  );
}
