import { createElement } from 'react';

export default function Surface({ as: Component = 'section', className = '', children, ...props }) {
  return createElement(
    Component,
    { className: `rounded-forest-card border border-forest-border-subtle bg-forest-surface-card p-forest-panel shadow-sm ${className}`.trim(), ...props },
    children,
  );
}
