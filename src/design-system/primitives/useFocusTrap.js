import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function useFocusTrap({
  containerRef,
  initialFocusRef,
  isActive,
  onEscape,
  version,
}) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isActive) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;
    const previouslyFocused = document.activeElement;

    const getFocusableElements = () => Array.from(
      container.querySelectorAll(FOCUSABLE_SELECTOR),
    ).filter((element) => (
      !element.hasAttribute('hidden')
      && element.getAttribute('aria-hidden') !== 'true'
      && element.getClientRects().length > 0
    ));

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const focusIsOutside = !container.contains(document.activeElement);

      if (event.shiftKey && (focusIsOutside || document.activeElement === firstElement)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (focusIsOutside || document.activeElement === lastElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      const focusTarget = initialFocusRef?.current || getFocusableElements()[0] || container;
      focusTarget.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, initialFocusRef, isActive, version]);
}
