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
          body="Each profile is mapped out on an audiogram, a graph used to map which pitches a person can and cannot hear. The simulation applies those exact thresholds to your audio. Hearing loss isn't just about volume, and you can't always fix it by making sounds louder — this simulation applies the exact frequency pattern from each audiogram rather than just turning the volume down."
        />
        <Feature
          title="Frequency selectivity"
          body="Damaged hair cells don't just reduce volume — they also blur adjacent frequencies together. The simulation widens each affected band's filter in proportion to the degree of loss, so heavily impaired regions lose clarity, not just loudness."
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
          Advanced threshold and tinnitus features are not available in this browser.
          Basic frequency simulation still works.
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
