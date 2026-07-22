import { forwardRef } from 'react';
import { getActionControlClassName } from './actionControlStyles';

const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  isPending = false,
  pendingLabel = '처리 중…',
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={getActionControlClassName({ variant, size, className })}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
});

export default Button;
