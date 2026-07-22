import Button from './Button';

export default function IconButton({ label, children, ...props }) {
  if (!label) throw new Error('IconButton requires an accessible label');
  return (
    <Button {...props} size="icon" aria-label={label}>
      <span aria-hidden="true">{children}</span>
    </Button>
  );
}
