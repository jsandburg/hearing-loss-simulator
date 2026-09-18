/**
 * components/AttenuationBars.jsx
 * Per-band hearing loss pattern bars.
 * Shows RETSPL-corrected effective loss per band at the audiogram frequencies.
 * Bars scale to DISPLAY_MAX (80 dB) so severe profiles show their full shape.
 * Note: the audio engine caps attenuation at MAX_ATTENUATION (40 dB) — this
 * display intentionally shows the full audiogram pattern beyond that cap.
 */

import { FREQUENCIES, FREQ_LABELS, RETSPL_CORRECTION, MAX_ATTENUATION } from '../constants/frequencies.js';
import { THEME } from '../constants/theme.js';
import { useAnimatedArray } from '../hooks/useAnimatedArray.js';

const DISPLAY_MAX = 80; // dB — display scale, covers all built-in profiles

function Bar({ label, correctedDb, color }) {
  const pct     = Math.min(100, (correctedDb / DISPLAY_MAX) * 100);
  const capped  = correctedDb > MAX_ATTENUATION;
  const rounded = Math.round(correctedDb);
  const hasLoss = rounded > 0;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Frequency label */}
      <div style={{
        fontSize: 10, fontFamily: THEME.fontSans,
        color: THEME.textSecondary,
        textAlign: 'center', marginBottom: 3,
      }}>
        {label}
      </div>

      {/* Bar */}
      <div style={{
        height: 52,
        background: THEME.bgCard,
        border: `1px solid ${THEME.border}`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: `${pct}%`,
          background: hasLoss ? `${color}${capped ? '88' : '55'}` : 'transparent',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 10, fontFamily: THEME.fontSans, fontWeight: hasLoss ? 600 : 400,
            color: hasLoss ? color : THEME.textTertiary,
          }}>
            {hasLoss ? `−${rounded}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AttenuationBars({ profile }) {
  if (!profile || profile.bypass) return null;
  return <Bars profile={profile} />;
}

function Bars({ profile }) {

  const corrected = (arr) =>
    arr.map((v, i) => Math.max(0, v - RETSPL_CORRECTION[i]));

  // Conductive profiles apply a flat gain reduction across all bands, not per-band EQ.
  const corrL = profile.isConductive
    ? Array(FREQUENCIES.length).fill(profile.flatAttenuationL ?? 0)
    : corrected(profile.left);
  const corrR = profile.isConductive
    ? Array(FREQUENCIES.length).fill(profile.flatAttenuationR ?? 0)
    : corrected(profile.right);

  // Numbers count and bars grow together, on the same timing as the audiogram
  const animated = useAnimatedArray([...corrR, ...corrL]);
  const animR    = animated.slice(0, corrR.length);
  const animL    = animated.slice(corrR.length);

  // Always use ISO 8253-1 clinical colors — same as the audiogram
  const leftColor  = THEME.leftEar;
  const rightColor = THEME.rightEar;

  // The divider lives here, not in the page, so it disappears along with the
  // bars on bypass profiles such as Normal Hearing.
  return (
    <div style={{ padding: '16px', borderTop: `1px solid ${THEME.border}` }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 10, fontFamily: THEME.fontSans, fontWeight: 600,
          color: THEME.textTertiary,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Signal attenuation (dB)
        </div>
      </div>

      {/* Right ear — first row, always shown */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
        {FREQUENCIES.map((f, i) => (
          <Bar key={`R${f}`} label={FREQ_LABELS[i]} correctedDb={animR[i]} color={rightColor} />
        ))}
      </div>

      {/* Left ear — second row, always shown */}
      <div style={{ display: 'flex', gap: 3 }}>
        {FREQUENCIES.map((f, i) => (
          <Bar key={`L${f}`} label={FREQ_LABELS[i]} correctedDb={animL[i]} color={leftColor} />
        ))}
      </div>
    </div>
  );
}
