/**
 * components/AboutSection.jsx
 *
 * Compact orientation shown below the header.
 * The full plain-language explanation is available on demand.
 */

import { THEME } from '../constants/theme.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { useState } from 'react';

export function AboutSection({ workletAttempted, workletReady }) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      borderBottom: `1px solid ${THEME.border}`,
      background: THEME.bg,
    }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '14px 16px' : '14px 32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fontSans,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: THEME.textPrimary,
            marginBottom: 4,
          }}>
            How it works
          </div>
          <div style={{
            fontSize: 12,
            fontFamily: THEME.fontSans,
            color: THEME.textSecondary,
            lineHeight: 1.5,
          }}>
            Choose a hearing profile, upload audio, and play it to hear an approximation of that experience.
          </div>
        </div>
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(value => !value)}
          style={{
            flexShrink: 0,
            padding: '6px 10px',
            background: isExpanded ? THEME.bgCardHover : THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 4,
            color: THEME.textSecondary,
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: THEME.fontSans,
          }}
        >
          {isExpanded ? 'Hide details' : 'Learn more'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 14 }}>
          <p style={{
            fontSize: 12,
            fontFamily: THEME.fontSans,
            color: THEME.textSecondary,
            lineHeight: 1.65,
            margin: '0 0 14px',
          }}>
            The audio is processed in real time to approximate how someone with that profile perceives sounds. You can also create a custom profile from your own audiogram or someone else's, then share it.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}>
            <Feature
              title="Frequency loss"
              summary="Some pitches are reduced according to the selected audiogram. Turning up the volume cannot restore frequencies that are missing."
              detail="Each profile is based on a real audiogram, a chart showing which pitches a person can and cannot hear. The simulation applies that same pattern to your audio, reducing the frequencies that are difficult for that person to pick up. For many types of hearing loss, the damage is at specific frequencies, so turning up the volume does not bring those sounds back. Severe profiles are capped at 40 dB of reduction per band."
            />
            <Feature
              title="Frequency clarity"
              summary="Hearing loss can make nearby pitches blend together, making speech and consonants harder to distinguish."
              detail="A healthy ear can clearly separate sounds that are close in pitch. When the inner ear is damaged, nearby sounds begin to blur together. The simulation reflects this by widening the affected frequency ranges in areas of greater hearing loss."
            />
            <Feature
              title="Tinnitus"
              summary="An optional simulated tone can mask sounds near its pitch."
              detail="Many people with hearing loss also experience persistent ringing, known as tinnitus. It partially masks real sounds near its pitch. You can enable tinnitus under any profile using the tinnitus control."
            />
          </div>
        </div>
      )}

      {workletAttempted && !workletReady && (
        <div style={{
          marginTop: isExpanded ? 14 : 10,
          padding: '8px 12px',
          background: 'rgba(183,119,13,0.06)',
          border: `1px solid rgba(183,119,13,0.2)`,
          borderRadius: 3,
          fontSize: 11,
          fontFamily: THEME.fontSans,
          color: THEME.warning,
        }}>
          Tinnitus simulation is not available in this browser. Frequency attenuation still works.
        </div>
      )}
    </div>
    </div>
  );
}

function Feature({ title, summary, detail }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 14px',
      background: THEME.bgCardHover,
      border: `1px solid ${THEME.border}`,
      borderRadius: 4,
    }}>
      <div style={{
        fontSize: 12,
        fontFamily: THEME.fontSans,
        fontWeight: 600,
        color: THEME.textPrimary,
        marginBottom: 3,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 12,
        fontFamily: THEME.fontSans,
        color: THEME.textSecondary,
        lineHeight: 1.6,
        marginBottom: 8,
      }}>
        {summary}
      </div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(value => !value)}
        style={{
          alignSelf: 'flex-start',
          padding: 0,
          background: 'none',
          border: 0,
          color: THEME.textTertiary,
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: THEME.fontSans,
        }}
      >
        {isOpen ? 'Hide detail' : 'Learn more'}
      </button>
      {isOpen && (
        <div style={{
          marginTop: 10,
          paddingTop: 9,
          borderTop: `1px solid ${THEME.border}`,
          fontSize: 12,
          fontFamily: THEME.fontSans,
          color: THEME.textSecondary,
          lineHeight: 1.6,
        }}>
          {detail}
        </div>
      )}
    </div>
  );
}
