import { Link } from 'react-router-dom';
import { getActionControlClassName } from './actionControlStyles';

export default function ActionLink({
  to,
  href,
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...props
}) {
  const classes = getActionControlClassName({ variant, size, className });
  if (href) return <a href={href} className={classes} {...props}>{children}</a>;
  return <Link to={to} className={classes} {...props}>{children}</Link>;
}
