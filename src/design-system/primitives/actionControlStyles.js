const variants = {
  primary: 'border-2 border-transparent bg-forest-primary text-forest-text-inverse hover:bg-forest-strong',
  secondary: 'border-2 border-forest-primary bg-forest-surface-card text-forest-strong hover:bg-forest-surface',
  quiet: 'border-2 border-transparent text-forest-strong underline decoration-2 underline-offset-4 hover:bg-forest-surface',
  inverseQuiet: 'border-2 border-transparent text-forest-text-inverse underline decoration-2 underline-offset-4 hover:bg-forest-surface-inverse-hover',
  danger: 'border-2 border-forest-danger-border bg-forest-danger-surface text-forest-danger-text hover:border-forest-danger-text',
};

const sizes = {
  md: 'min-h-forest-control min-w-forest-control px-forest-4 py-forest-2 text-forest-label',
  lg: 'min-h-forest-control min-w-forest-control px-forest-6 py-forest-3 text-forest-body',
  icon: 'h-forest-icon-control w-forest-icon-control p-0 text-forest-body',
};

export const getActionControlClassName = ({
  variant = 'primary',
  size = 'md',
  className = '',
} = {}) => [
  'inline-flex items-center justify-center rounded-forest-control font-bold',
  'focus-visible:outline focus-visible:outline-forest focus-visible:outline-offset-2 focus-visible:outline-forest-focus',
  'disabled:cursor-not-allowed disabled:opacity-60',
  variants[variant] ?? variants.primary,
  sizes[size] ?? sizes.md,
  className,
].filter(Boolean).join(' ');
