import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-forest-primary text-white hover:bg-forest-strong',
  secondary: 'border-2 border-forest-primary bg-white text-forest-strong hover:bg-green-50',
  quiet: 'text-forest-strong underline decoration-2 underline-offset-4 hover:text-green-700',
};

export default function ActionLink({ to, href, variant = 'primary', className = '', children, ...props }) {
  const classes = `accessible-touch-target inline-flex items-center justify-center rounded-xl px-6 py-3 text-lg font-bold ${variants[variant]} ${className}`.trim();
  if (href) return <a href={href} className={classes} {...props}>{children}</a>;
  return <Link to={to} className={classes} {...props}>{children}</Link>;
}
