/**
 * components/AboutSection.jsx
 *
 * Orientation card, built like the other cards on the page: header band with
 * the card title, white body below. The body is a deck the reader steps
 * through — card 1 explains the app, the rest explain one aspect of the
 * simulation each. All the detail lives on the cards, and the whole body
 * collapses when the reader wants the space back.
 */

import { THEME } from '../constants/theme.js';
import { iconButtonStyle, CollapseButton } from './SmallComponents.jsx';
import { useState } from 'react';

const CARDS = [
  {
    title: 'How it works',
    body: 'Choose a hearing profile, upload audio, and play it to hear an approximation of that experience. The audio is processed in real time to approximate how someone with that profile perceives sound. You can also build a profile from your own audiogram, or someone else’s, and share it.',
  },
  {
    title: 'Frequency loss',
    body: 'Each profile is based on a real audiogram, a chart showing which pitches a person can and cannot hear. The simulation applies that same pattern to your audio, reducing the frequencies that are difficult for that person to pick up. For many types of hearing loss the damage is at specific frequencies, so turning up the volume does not bring those sounds back. Severe profiles are capped at 40 dB of reduction per band.',
  },
  {
    title: 'Frequency clarity',
    body: 'A healthy ear can clearly separate sounds that are close in pitch. When the inner ear is damaged, nearby sounds begin to blur together, which is what makes speech and consonants hard to distinguish. The simulation reflects this by widening the affected frequency ranges in areas of greater hearing loss.',
  },
  {
    title: 'Tinnitus',
    body: 'Many people with hearing loss also experience persistent ringing, known as tinnitus. It partially masks real sounds near its pitch. You can enable a simulated tone under any profile using the tinnitus control, and set its pitch and loudness.',
  },
];

export function AboutSection({ workletAttempted, workletReady }) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const step = (delta) => setIndex((i) => (i + delta + CARDS.length) % CARDS.length);

  return (
    <div style={{
      background: THEME.bgCard,
      border: `1px solid ${THEME.border}`,
      borderRadius: 6,
      overflow: 'hidden',
      marginTop: 20,
    }}>

      {/* Header band — same recipe as the Audiogram and Audio Player cards */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        background: THEME.bgCardHover,
        borderBottom: isOpen ? `1px solid ${THEME.border}` : 'none',
      }}>
        <div style={{
          fontSize: 10, fontFamily: THEME.fontSans, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: THEME.textPrimary,
        }}>
          {CARDS[index].title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isOpen && (
            <>
              <span style={{ fontSize: 10, fontFamily: THEME.fontSans, color: THEME.textTertiary }}>
                {index + 1} / {CARDS.length}
              </span>
              <button type="button" onClick={() => step(-1)} aria-label="Previous card" style={iconButtonStyle}>‹</button>
              <button type="button" onClick={() => step(1)}  aria-label="Next card"     style={iconButtonStyle}>›</button>
            </>
          )}
          <CollapseButton
            isOpen={isOpen}
            onToggle={() => setIsOpen(value => !value)}
            label="explanation"
          />
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '16px' }}>
          {/* All cards share one grid cell, so the tallest sets the height and
              stepping through them never shifts the page below. */}
          <div style={{ display: 'grid' }} aria-live="polite">
            {CARDS.map((entry, i) => (
              <div
                key={entry.title}
                className={i === index ? 'fade-in' : undefined}
                aria-hidden={i !== index}
                style={{
                  gridArea: '1 / 1',
                  visibility: i === index ? 'visible' : 'hidden',
                  fontSize: 12,
                  fontFamily: THEME.fontSans,
                  color: THEME.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {entry.body}
              </div>
            ))}
          </div>
        </div>
      )}

      {workletAttempted && !workletReady && (
        <div style={{
          margin: isOpen ? '0 16px 16px' : '12px 16px',
          padding: '8px 12px',
          background: 'rgba(183,119,13,0.06)',
          border: `1px solid rgba(183,119,13,0.2)`,
          borderRadius: 3,
          fontSize: 12,
          fontFamily: THEME.fontSans,
          color: THEME.warning,
        }}>
          Tinnitus simulation is not available in this browser. Frequency attenuation still works.
        </div>
      )}
    </div>
  );
}
