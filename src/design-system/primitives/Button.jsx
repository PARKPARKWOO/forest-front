import { getActionControlClassName } from './actionControlStyles';

export default function Button({
  variant = 'primary',
  size = 'md',
  isPending = false,
  pendingLabel = '처리 중…',
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={getActionControlClassName({ variant, size, className })}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
}
