/**
 * hooks/useAnimatedArray.js
 * Tweens an array of numbers toward `target` with an ease-out curve.
 * Retargets smoothly from the current values if `target` changes mid-tween.
 * Jumps straight to `target` when the user prefers reduced motion.
 */

import { useState, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

export function useAnimatedArray(target, duration = 300) {
  const reduced   = usePrefersReducedMotion();
  const [values, setValues] = useState(target);
  const valuesRef = useRef(target);
  const key       = target.join(',');

  useEffect(() => {
    const from = valuesRef.current;
    if (reduced || from.length !== target.length) {
      valuesRef.current = target;
      setValues(target);
      return;
    }

    let raf;
    const start = performance.now();
    const step = (now) => {
      const t    = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = target.map((v, i) => from[i] + (v - from[i]) * ease);
      valuesRef.current = next;
      setValues(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [key, reduced, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return reduced ? target : values;
}
