/**
 * components/AboutSection.jsx
 *
 * Always-visible description shown below the header.
 * Plain-language explanation of what the simulator models.
 */

import { THEME } from '../constants/theme.js';

export function AboutSection({ workletAttempted, workletReady }) {
  return (
    <div style={{
      borderBottom: `1px solid ${THEME.border}`,
      background: THEME.bg,
    }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 24px' }}>

      <p style={{
        fontSize: 13,
        fontFamily: THEME.fontSans,
        color: THEME.textSecondary,
        lineHeight: 1.7,
        marginBottom: 16,
      }}>
        This tool allows you to experience the impact of a specific type of hearing loss.
        Select a hearing profile, upload a voice recording or piece of music, and press
        play. The audio is processed in real-time to approximate how someone with that
        profile perceives sounds. You can also create a custom profile based upon your
        own audiogram (or someone else's) and share it.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px 24px',
      }}>
        <Feature
          title="Frequency loss"
          body="Each profile is based on a real audiogram, a chart showing which pitches a person can and cannot hear. The simulation applies that same pattern to your audio, reducing the frequencies that are difficult for that person to pick up. For many types of hearing loss, the damage is at specific frequencies, so turning up the volume does not bring those sounds back."
        />
        <Feature
          title="Frequency selectivity"
          body="A healthy ear can clearly separate sounds that are close in pitch. When the inner ear is damaged, nearby sounds begin to blur together. The simulation reflects this by widening the affected frequency ranges in areas of greater hearing loss."
        />
        <Feature
          title="Tinnitus"
          body="Many people with hearing loss also experience persistent ringing, known as tinnitus. It partially masks real sounds near its pitch. You can enable tinnitus under any profile using the tinnitus control."
        />
      </div>

      {workletAttempted && !workletReady && (
        <div style={{
          marginTop: 14,
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

function Feature({ title, body }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        fontFamily: THEME.fontSans,
        fontWeight: 600,
        color: THEME.textPrimary,
        marginBottom: 3,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 11,
        fontFamily: THEME.fontSans,
        color: THEME.textSecondary,
        lineHeight: 1.6,
      }}>
        {body}
      </div>
    </div>
  );
}
