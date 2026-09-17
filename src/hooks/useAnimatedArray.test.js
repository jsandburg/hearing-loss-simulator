import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedArray } from './useAnimatedArray.js';

const mockReducedMotion = (matches) => {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  delete window.matchMedia;
});

describe('useAnimatedArray', () => {
  it('returns the initial target immediately', () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useAnimatedArray([10, 20]));
    expect(result.current).toEqual([10, 20]);
  });

  it('tweens toward a new target and settles on it', () => {
    mockReducedMotion(false);
    const { result, rerender } = renderHook(({ t }) => useAnimatedArray(t, 300), {
      initialProps: { t: [0, 0] },
    });

    rerender({ t: [60, 30] });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current[0]).toBeGreaterThan(0);
    expect(result.current[0]).toBeLessThan(60);

    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toEqual([60, 30]);
  });

  it('jumps straight to the target when reduced motion is preferred', () => {
    mockReducedMotion(true);
    const { result, rerender } = renderHook(({ t }) => useAnimatedArray(t), {
      initialProps: { t: [0, 0] },
    });

    rerender({ t: [60, 30] });
    expect(result.current).toEqual([60, 30]);
  });

  it('works when matchMedia is unavailable', () => {
    const { result } = renderHook(() => useAnimatedArray([5]));
    expect(result.current).toEqual([5]);
  });
});
