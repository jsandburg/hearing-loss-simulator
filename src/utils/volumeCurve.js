/**
 * utils/volumeCurve.js
 * Maps a 0–100 UI percentage to a 0–1 linear gain value using a
 * gentle nonlinear curve that preserves a useful range at lower settings.
 *
 * Linear sliders feel abrupt near the bottom because our perception of
 * loudness is nonlinear. A square-law taper keeps 100% at unity while
 * avoiding the overly quiet midrange produced by a steeper cubic curve.
 */

/**
 * @param {number} percent  0–100
 * @returns {number}        0–1 linear gain
 */
export function percentToGain(percent) {
  if (percent <= 0)   return 0;
  if (percent >= 100) return 1;
  // x^2 curve: 50% → 0.25, 75% → ~0.56, 100% → 1.0
  const x = percent / 100;
  return x * x;
}
