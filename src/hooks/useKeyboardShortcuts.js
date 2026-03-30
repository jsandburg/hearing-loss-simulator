/**
 * hooks/useKeyboardShortcuts.js
 * Keyboard shortcut bindings for the simulator.
 */

import { useEffect } from 'react';

/**
 * @param {object} handlers
 *   onTogglePlay  — Space
 *   onNextPreset  — ArrowRight
 *   onPrevPreset  — ArrowLeft
 */
export function useKeyboardShortcuts({ onTogglePlay, onNextPreset, onPrevPreset }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept when focus is in an input/textarea/select
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement?.contentEditable === 'true') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onTogglePlay?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextPreset?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevPreset?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTogglePlay, onNextPreset, onPrevPreset]);
}
