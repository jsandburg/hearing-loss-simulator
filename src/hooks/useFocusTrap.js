import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps keyboard focus inside containerRef while isActive is true.
 * - Moves focus to the first focusable element on activation.
 * - Tab / Shift+Tab cycle within the container.
 * - Escape calls onEscape.
 * - Restores focus to the previously focused element on deactivation.
 *
 * @param {React.RefObject} containerRef  Ref attached to the modal container element.
 * @param {{ isActive: boolean, onEscape?: () => void }} options
 */
export function useFocusTrap(containerRef, { isActive, onEscape }) {
  // Keep onEscape in a ref so the keydown handler doesn't need it as a dep.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; });

  useEffect(() => {
    if (!isActive) return;

    const previousFocus = document.activeElement;

    const focusableEls = () =>
      Array.from(containerRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []);

    // Move focus into the modal immediately
    const els = focusableEls();
    if (els.length > 0) els[0].focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const els = focusableEls();
      if (els.length === 0) return;

      const first = els[0];
      const last  = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isActive, containerRef]);
}
