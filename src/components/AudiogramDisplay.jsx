/**
 * components/AudiogramDisplay.jsx
 *
 * SVG audiogram display. Shows left and right ear curves independently.
 * Follows ISO 8253-1 conventions: blue X = left, red O = right.
 * Y axis: dB HL, -10 at top to 120 at bottom (clinical standard).
 * X axis: one even column per tested frequency, 250–8000 Hz, as printed
 * clinical forms lay them out. The half-octave columns (3k, 6k) are drawn
 * with dashed grid lines, again following the printed convention.
 */

import { memo } from 'react';
import { FREQUENCIES, FREQ_LABELS, DB_MIN, DB_MAX } from '../constants/frequencies.js';
import { THEME } from '../constants/theme.js';
import { useAnimatedArray } from '../hooks/useAnimatedArray.js';

const SVG_W  = 480;
const SVG_H  = 280;
const PAD    = { top: 28, right: 16, bottom: 38, left: 52 };
const CW     = SVG_W - PAD.left - PAD.right;
const CH     = SVG_H - PAD.top  - PAD.bottom;

// Inset so the 250 Hz and 8 kHz columns sit inside the plot frame, not on it
const X_INSET = 16;

// Half-octave frequencies — drawn with dashed grid lines
const HALF_OCTAVE = new Set([3000, 6000]);

// dB values that get a horizontal grid line and a Y axis label. Both are
// driven from this list so every line carries the label beside it.
const DB_LINES = [-10, 0, 20, 40, 60, 80, 100, 120];

function xAt(i) {
  return PAD.left + X_INSET + (i / (FREQUENCIES.length - 1)) * (CW - 2 * X_INSET);
}

function dToY(db) {
  const clamped = Math.max(DB_MIN, Math.min(DB_MAX, db));
  return PAD.top + ((clamped - DB_MIN) / (DB_MAX - DB_MIN)) * CH;
}

const snap = (v) => Math.round(v) + 0.5;

// When symmetric, offset right ear line slightly downward so both are visible
const SYMM_OFFSET = 3;

export const AudiogramDisplay = memo(function AudiogramDisplay({ profile }) {
  if (!profile) return null;
  return <AudiogramSvg profile={profile} />;
});

function AudiogramSvg({ profile }) {
  const left    = profile.left;
  const right   = profile.right;
  // Guard against malformed share data with mismatched array lengths
  const symm    = left.length === right.length &&
                  left.every((v, i) => v === right[i]);

  // Animate curves between profiles; offset is included so it slides rather than jumps
  const animated  = useAnimatedArray([...left, ...right, symm ? SYMM_OFFSET : 0]);
  const animLeft  = animated.slice(0, left.length);
  const animRight = animated.slice(left.length, left.length + right.length);
  const rightOff  = animated[animated.length - 1];
  // Audiogram always uses ISO 8253-1 clinical colours regardless of profile.color
  const leftCol  = THEME.leftEar;
  const rightCol = THEME.rightEar;

  // Horizontal grid lines, one per labelled dB value
  const hLines = DB_LINES.map(db => {
    const y = snap(dToY(db));
    return (
      <line
        key={db}
        x1={snap(PAD.left)} y1={y}
        x2={snap(PAD.left + CW)} y2={y}
        stroke={db === 0 ? 'rgba(0,0,0,0.15)' : THEME.gridLine}
        strokeWidth={db === 0 ? 0.8 : 0.5}
        shapeRendering="crispEdges"
      />
    );
  });

  // Vertical grid lines at each audiogram frequency
  const vLines = FREQUENCIES.map((f, i) => {
    const x = snap(xAt(i));
    return (
      <line
        key={f}
        x1={x} y1={snap(PAD.top)}
        x2={x} y2={snap(PAD.top + CH)}
        stroke={HALF_OCTAVE.has(f) ? THEME.gridLineStrong : THEME.gridLine}
        strokeWidth={0.5}
        strokeDasharray={HALF_OCTAVE.has(f) ? '3 3' : undefined}
        shapeRendering="crispEdges"
      />
    );
  });

  // Build SVG polyline points with optional y offset
  const pointsFor = (arr, yOff = 0) =>
    arr.map((db, i) => `${xAt(i)},${dToY(db) + yOff}`).join(' ');

  // Symbols: X for left, O for right (ISO convention)
  const XSymbol = ({ x, y, color }) => (
    <g transform={`translate(${x},${y})`}>
      <line x1={-4} y1={-4} x2={4} y2={4} stroke={color} strokeWidth={1.5} />
      <line x1={4} y1={-4} x2={-4} y2={4} stroke={color} strokeWidth={1.5} />
    </g>
  );

  const OSymbol = ({ x, y, color }) => (
    <circle cx={x} cy={y} r={4} fill="none" stroke={color} strokeWidth={1.5} />
  );

  // Aria label summarising the audiogram
  const avgLeft  = Math.round(left.reduce((a,b) => a+b, 0) / left.length);
  const avgRight = Math.round(right.reduce((a,b) => a+b, 0) / right.length);
  const ariaLabel = symm
    ? `Audiogram showing ${avgLeft} dB HL average hearing loss both ears`
    : `Audiogram showing left ear ${avgLeft} dB HL average, right ear ${avgRight} dB HL average`;

  return (
    <div style={{ padding: '16px' }}>
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        aria-label={ariaLabel}
        role="img"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Grid */}
        {hLines}
        {vLines}

        {/* Y axis labels (dB HL) */}
        {DB_LINES.map(db => (
          <text
            key={db}
            x={PAD.left - 8}
            y={dToY(db) + 4}
            textAnchor="end"
            fontSize={11}
            fontFamily={THEME.font}
            fill={THEME.textTertiary}
          >
            {db}
          </text>
        ))}

        {/* Y axis label */}
        <text
          transform={`translate(10, ${PAD.top + CH / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fontFamily={THEME.font}
          fill={THEME.textTertiary}
        >
          Decibels (dB) Hearing Loss
        </text>

        {/* X axis labels (frequency) */}
        {FREQUENCIES.map((f, i) => (
          <text
            key={f}
            x={xAt(i)}
            y={SVG_H - PAD.bottom + 14}
            textAnchor="middle"
            fontSize={11}
            fontFamily={THEME.font}
            fill={THEME.textTertiary}
          >
            {FREQ_LABELS[i]}
          </text>
        ))}

        {/* X axis label */}
        <text
          x={PAD.left + CW / 2}
          y={SVG_H - 4}
          textAnchor="middle"
          fontSize={12}
          fontFamily={THEME.font}
          fill={THEME.textTertiary}
        >
          Frequency (Hz)
        </text>

        {/* Normal hearing shaded band (0 dB ± 20 dB) */}
        <rect
          x={PAD.left} y={dToY(-10)}
          width={CW} height={dToY(20) - dToY(-10)}
          fill="rgba(52,211,153,0.03)"
        />

        {/* Left ear curve — drawn first so right renders on top */}
        <polyline
          points={pointsFor(animLeft)}
          fill="none"
          stroke={leftCol}
          strokeWidth={2}
        />
        {animLeft.map((db, i) => (
          <XSymbol
            key={i}
            x={xAt(i)}
            y={dToY(db)}
            color={leftCol}
          />
        ))}

        {/* Right ear curve — drawn on top; offset slightly when symmetric so both lines show */}
        <polyline
          points={pointsFor(animRight, rightOff)}
          fill="none"
          stroke={rightCol}
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeDasharray="4 3"
        />
        {animRight.map((db, i) => (
          <OSymbol
            key={i}
            x={xAt(i)}
            y={dToY(db) + rightOff}
            color={rightCol}
          />
        ))}

        {/* Legend — Right listed first, then Left */}
        <g transform={`translate(${PAD.left + CW - 80}, ${PAD.top + 6})`}>
            <rect x={0} y={0} width={76} height={34}
              fill={THEME.bg} stroke={THEME.border} rx={2} />
            {/* Right — first entry */}
            <line x1={8} y1={11} x2={18} y2={11} stroke={rightCol} strokeWidth={1.5} strokeDasharray="3 2" />
            <circle cx={13} cy={11} r={3} fill="none" stroke={rightCol} strokeWidth={1.5} />
            <text x={22} y={14} fontSize={10} fontFamily={THEME.font} fill={THEME.textSecondary}>Right</text>
            {/* Left — second entry */}
            <line x1={8} y1={26} x2={18} y2={26} stroke={leftCol} strokeWidth={2} />
            <line x1={10} y1={22} x2={16} y2={30} stroke={leftCol} strokeWidth={1.5} />
            <line x1={16} y1={22} x2={10} y2={30} stroke={leftCol} strokeWidth={1.5} />
            <text x={22} y={29} fontSize={10} fontFamily={THEME.font} fill={THEME.textSecondary}>Left</text>
          </g>
      </svg>
    </div>
  );
}
