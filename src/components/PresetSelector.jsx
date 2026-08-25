/**
 * components/PresetSelector.jsx
 *
 * Compact grouped selector for built-in and custom profiles.
 * Custom audiograms remain removable without adding more permanent button rows.
 */

import { PRESETS, PRESET_CATEGORIES } from '../constants/presets.js';
import { THEME } from '../constants/theme.js';

export function PresetSelector({ activeId, onSelect, customProfiles = [], onNewCustom, onDeleteCustom }) {
  const customById = Object.fromEntries(customProfiles.map(profile => [profile.id, profile]));
  const profilesById = { ...PRESETS, ...customById };

  return (
    <div>
      <label htmlFor="profile-select" style={{
        display: 'block',
        fontSize: 9,
        fontFamily: THEME.fontSans,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: THEME.textPrimary,
        marginBottom: 5,
      }}>
        Profile
      </label>

      <div style={{ position: 'relative' }}>
        <select
          id="profile-select"
          value={activeId}
          aria-label="Hearing profile"
          onChange={event => {
            const id = event.target.value;
            if (profilesById[id]) onSelect(id, profilesById[id]);
          }}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '9px 34px 9px 11px',
            border: `1px solid ${THEME.border}`,
            borderRadius: 4,
            background: THEME.bgInput,
            color: THEME.textPrimary,
            fontSize: 12,
            fontFamily: THEME.fontSans,
            cursor: 'pointer',
          }}
        >
          {PRESET_CATEGORIES.map(({ key, label }) => {
            const items = key === 'custom'
              ? customProfiles.map(profile => ({ id: profile.id, profile }))
              : Object.entries(PRESETS)
                .filter(([, profile]) => profile.category === key)
                .map(([id, profile]) => ({ id, profile }));
            if (items.length === 0) return null;
            return (
              <optgroup key={key} label={label}>
                {items.map(({ id, profile }) => (
                  <option key={id} value={id}>{profile.name}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <span aria-hidden="true" style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-60%)',
          color: THEME.textTertiary,
          fontSize: 14,
          pointerEvents: 'none',
        }}>⌄</span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
      }}>
        <button
          type="button"
          onClick={onNewCustom}
          style={{
            flexShrink: 0,
            padding: '4px 8px',
            background: 'none',
            border: `1px dashed ${THEME.textTertiary}`,
            borderRadius: 3,
            color: THEME.textSecondary,
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: THEME.fontSans,
          }}
        >
          + New custom audiogram
        </button>
      </div>

      {customProfiles.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px solid ${THEME.border}`,
        }}>
          <span style={{
            flexBasis: '100%',
            fontSize: 9,
            fontFamily: THEME.fontSans,
            color: THEME.textTertiary,
          }}>
            Saved custom profiles
          </span>
          {customProfiles.map(profile => (
            <span key={profile.id} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              maxWidth: '100%',
              padding: '4px 7px',
              border: `1px solid ${THEME.border}`,
              borderRadius: 3,
              fontSize: 10,
              fontFamily: THEME.fontSans,
              color: THEME.textSecondary,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</span>
              <button
                type="button"
                onClick={() => onDeleteCustom(profile.id)}
                aria-label={`Delete ${profile.name}`}
                style={{
                  padding: 0,
                  border: 0,
                  background: 'none',
                  color: THEME.textTertiary,
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
