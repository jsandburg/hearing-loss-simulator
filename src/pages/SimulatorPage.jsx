/**
 * pages/SimulatorPage.jsx
 *
 * Two-column layout (maxWidth 1100px):
 *   Left  — Hearing profile block (selector + tinnitus + description + share)
 *   Right — Audiogram reference followed by the Audio Player
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PRESETS, findPreset } from '../constants/presets.js';
import { THEME } from '../constants/theme.js';
import { useAudioEngine }       from '../hooks/useAudioEngine.js';
import { useWorkletParams }     from '../hooks/useWorkletParams.js';
import { useAudiogramEditor }   from '../hooks/useAudiogramEditor.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { useIsMobile }          from '../hooks/useIsMobile.js';

import {
  Header, ErrorBanner, WarningBar, SharedProfileBanner,
} from '../components/SmallComponents.jsx';
import { AboutSection }      from '../components/AboutSection.jsx';
import { PresetSelector }    from '../components/PresetSelector.jsx';
import { AudiogramDisplay }  from '../components/AudiogramDisplay.jsx';
import { AudiogramEditor }   from '../components/AudiogramEditor.jsx';
import { PresetDescription } from '../components/PresetDescription.jsx';
import { WorkletControls }   from '../components/WorkletControls.jsx';
import { FileUploader }      from '../components/FileUploader.jsx';
import { PlaybackControls }  from '../components/PlaybackControls.jsx';
import { SpectrumAnalyser }  from '../components/SpectrumAnalyser.jsx';
import { AttenuationBars }   from '../components/AttenuationBars.jsx';
import { ShareDialog }       from '../components/ShareDialog.jsx';

function withProfileId(id, profile) {
  if (!profile) return null;
  if (profile.id === id) return profile;
  return { ...profile, id };
}

export function SimulatorPage({ initialPresetId, initialProfile, sharedProfile }) {

  const resolvedPresetId = findPreset(initialPresetId) ? initialPresetId : 'mild_sensorineural';
  const defaultId        = initialProfile?.id ?? resolvedPresetId;
  const defaultProfile   = initialProfile
    ?? withProfileId(defaultId, findPreset(defaultId))
    ?? withProfileId('normal', PRESETS.normal);

  const [activePresetId, setActivePresetId] = useState(
    initialProfile ? initialProfile.id : defaultId
  );
  const [activeProfile, setActiveProfile] = useState(defaultProfile);

  const audio    = useAudioEngine();
  const worklet  = useWorkletParams(activeProfile);
  const editor   = useAudiogramEditor();
  const isMobile = useIsMobile();

  const [volume,         setVolumeState] = useState(100);
  const [levelMatching,  setLevelMatching] = useState(false);
  const [loopEnabled,    setLoopEnabled] = useState(true);
  const [audiogramOpen,  setAudiogramOpen] = useState(false);

  // Sync engine volume on mount so the default "Normal Hearing" reference is unity gain.
  useEffect(() => {
    audio.setVolume(100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    audio.setLevelMatching(levelMatching, activeProfile);
  }, [activeProfile, audio.setLevelMatching, levelMatching]);

  const [shareOpen,   setShareOpen]   = useState(false);
  const [sharedBannerProfile, setSharedBannerProfile] = useState(
    sharedProfile ? activeProfile : null
  );

  const uploaderRef = useRef(null);

  // ── Profile selection ──────────────────────────────────────────────────────

  const selectProfile = useCallback((id, profile) => {
    const nextProfile = withProfileId(id, profile);
    setActivePresetId(id);
    setActiveProfile(nextProfile);
    worklet.resetToPreset();
    audio.switchProfile(nextProfile, {});
  }, [audio.switchProfile, worklet.resetToPreset]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleTogglePlay = useCallback(() => {
    if (audio.playState === 'playing') {
      audio.stop();
    } else if (audio.fileInfo) {
      audio.startPlay(activeProfile, worklet.overrides);
    }
  }, [audio, activeProfile, worklet.overrides]);

  useKeyboardShortcuts({ onTogglePlay: handleTogglePlay });

  // ── Worklet param changes → engine ─────────────────────────────────────────

  useEffect(() => {
    if (audio.playState === 'playing') {
      audio.updateWorkletOverrides(worklet.overrides);
    }
  }, [worklet.overrides, audio.playState, audio.updateWorkletOverrides]);

  // ── Volume / loop ──────────────────────────────────────────────────────────

  const handleVolume = useCallback((v) => {
    setVolumeState(v);
    audio.setVolume(v);
  }, [audio.setVolume]);

  const handleLoop = useCallback(() => {
    setLoopEnabled(prev => {
      const next = !prev;
      audio.setLooping(next);
      return next;
    });
  }, [audio.setLooping]);

  const handleLevelMatching = useCallback((enabled) => {
    setLevelMatching(enabled);
  }, []);

  // ── Custom audiogram ───────────────────────────────────────────────────────

  const handleSaveCustom = useCallback(() => {
    const saved = editor.saveProfile();
    if (saved) selectProfile(saved.id, saved);
  }, [editor.saveProfile, selectProfile]);

  const handleDeleteCustom = useCallback((id) => {
    editor.deleteProfile(id);
    if (activePresetId === id) {
      selectProfile('mild_sensorineural', PRESETS.mild_sensorineural);
    }
  }, [editor.deleteProfile, activePresetId, selectProfile]);

  const handleScrollToUploader = useCallback(() => {
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const supported = typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';

  const isLoadingAudio = audio.playState === 'loading';
  const tinnitusAvailable = !audio.workletAttempted || audio.workletReady;

  // ── Section title style ────────────────────────────────────────────────────
  const sectionTitle = {
    fontSize: 10, fontFamily: THEME.fontSans, fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: THEME.textPrimary,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: THEME.bg,
      minHeight: '100vh',
      color: THEME.textPrimary,
      fontFamily: THEME.fontSans,
    }}>

      <Header />
      <AboutSection
        workletReady={audio.workletReady}
        workletAttempted={audio.workletAttempted}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 32px 48px' }}>

        {sharedBannerProfile && (
          <SharedProfileBanner
            profile={sharedBannerProfile}
            onDismiss={() => setSharedBannerProfile(null)}
            onScrollToUploader={handleScrollToUploader}
            onSave={() => {
              const saved = editor.addCustomProfile(sharedBannerProfile);
              selectProfile(saved.id, saved);
            }}
          />
        )}

        <ErrorBanner errors={audio.errors} onClear={audio.clearError} />
        <WarningBar  warnings={audio.warnings} onClear={audio.clearWarning} />

        {!supported && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(183,119,13,0.06)',
            border: `1px solid rgba(183,119,13,0.3)`,
            borderRadius: 4, fontSize: 11, color: THEME.warning,
          }}>
            ⚠ Web Audio is not supported in this browser. Try Chrome, Firefox, Safari, or Edge.
          </div>
        )}

        {/* ── Two-column body ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 16 : 20,
          marginTop: 20,
          alignItems: 'start',
        }}>

          {/* ── Profile controls ── */}
          <div style={{ gridColumn: 1, gridRow: isMobile ? 1 : 2 }}>

            {/* Compact profile picker */}
            <div style={{
              background: THEME.bgCardHover,
              border: `1px solid ${THEME.border}`,
              borderRadius: 4,
              padding: '16px 20px 20px',
              marginBottom: isMobile ? 0 : 20,
            }}>
              {/* Section label + share button on same row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <div style={sectionTitle}>
                  Hearing profile
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  style={{
                    padding: '4px 10px',
                    background: 'none',
                    border: `1px solid ${THEME.textTertiary}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: THEME.fontSans,
                    color: THEME.textSecondary,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = THEME.textPrimary; e.currentTarget.style.color = THEME.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.textTertiary; e.currentTarget.style.color = THEME.textSecondary; }}
                >
                  Share profile
                </button>
              </div>

              <div style={{
                fontSize: 11,
                fontFamily: THEME.fontSans,
                color: THEME.textSecondary,
                lineHeight: 1.5,
                marginBottom: 14,
              }}>
                Choose a hearing loss type to hear how it affects speech and other sounds.
              </div>

              {/* Profile selector */}
              <PresetSelector
                activeId={activePresetId}
                onSelect={selectProfile}
                customProfiles={editor.customProfiles}
                onNewCustom={editor.openNewEditor}
                onDeleteCustom={handleDeleteCustom}
              />

              {/* Tinnitus changes the selected hearing profile, so keep it with the profile controls. */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, margin: '16px 0 0' }} />
              <WorkletControls
                effective={worklet.effective}
                onSetTinnitus={worklet.setTinnitus}
                hasFile={!!audio.fileInfo}
                workletAvailable={tinnitusAvailable}
              />

              {/* Profile explanation stays with the profile it describes. */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, margin: '14px 0 0', paddingTop: 14 }}>
              {/* Profile description */}
              <PresetDescription
                profile={activeProfile}
                workletReady={audio.workletReady}
                workletAttempted={audio.workletAttempted}
                effectiveTinnitus={worklet.effective.tinnitus}
                embedded
              />
              </div>
            </div>

          </div>{/* end profile controls */}

          {/* ── Audiogram + Audio Player ── */}
          <div style={{
            display: 'contents',
          }}>

            {/* Audio Player card — the primary listening action. */}
            <div style={{
              border: `1px solid ${THEME.border}`,
              borderRadius: 4,
              overflow: 'hidden',
              gridColumn: isMobile ? 1 : 2,
              gridRow: isMobile ? 2 : 1,
              background: THEME.bgCard,
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                background: THEME.bgCardHover,
                borderBottom: `1px solid ${THEME.border}`,
              }}>
                <div style={sectionTitle}>
                  Audio Player
                </div>
                {!audio.fileInfo && !isLoadingAudio && (
                  <div style={{ fontSize: 10, fontFamily: THEME.fontSans, color: THEME.textSecondary, marginTop: 2, fontStyle: 'italic' }}>
                    Upload a file to begin
                  </div>
                )}
              </div>

              {/* Upload + playback */}
              <div style={{ padding: '16px' }}>
                <FileUploader
                  onFile={audio.loadFile}
                  onRemove={audio.removeFile}
                  fileInfo={audio.fileInfo}
                  isLoading={isLoadingAudio}
                  uploaderRef={uploaderRef}
                />
                <PlaybackControls
                  playState={audio.playState}
                  elapsed={audio.elapsed}
                  duration={audio.fileInfo?.duration}
                  volume={volume}
                  levelMatching={levelMatching}
                  loopEnabled={loopEnabled}
                  onTogglePlay={handleTogglePlay}
                  onSeek={audio.seek}
                  onVolumeChange={handleVolume}
                  onLevelMatchingChange={handleLevelMatching}
                  onLoopToggle={handleLoop}
                  hasAudio={!!audio.fileInfo}
                  accentColor={THEME.info}
                />
              </div>

              {/* Spectrum */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, padding: '14px 16px 16px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: 8,
                }}>
                  <div style={sectionTitle}>
                    Frequency Spectrum
                  </div>
                  <div style={{ fontSize: 10, fontFamily: THEME.fontSans, color: THEME.textSecondary }}>
                    Live output
                  </div>
                </div>
                <SpectrumAnalyser engine={audio.engine} isPlaying={audio.playState === 'playing'} />
              </div>
            </div>

            {/* Audiogram — collapsed by default on mobile to keep the player close. */}
            <div style={{
              gridColumn: 1,
              gridRow: isMobile ? 3 : 1,
            }}>
              {isMobile && (
                <button
                  type="button"
                  aria-expanded={audiogramOpen}
                  onClick={() => setAudiogramOpen(value => !value)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    background: THEME.bgCardHover,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 4,
                    color: THEME.textPrimary,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: THEME.fontSans,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>{audiogramOpen ? 'Hide audiogram' : 'View audiogram'}</span>
                  <span aria-hidden="true">{audiogramOpen ? '−' : '+'}</span>
                </button>
              )}

              {(!isMobile || audiogramOpen) && (
                <div style={{
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginTop: isMobile ? 8 : 0,
                }}>
                  <div style={{
                    padding: '10px 24px 8px',
                    background: THEME.bgCardHover,
                    borderBottom: `1px solid ${THEME.border}`,
                  }}>
                    <div style={sectionTitle}>
                      Audiogram
                    </div>
                  </div>
                  <AudiogramDisplay profile={activeProfile} />
                  <div style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <AttenuationBars profile={activeProfile} />
                  </div>
                </div>
              )}
            </div>

          </div>{/* end right column */}

        </div>{/* end two-column grid */}
      </div>{/* end column body */}

      <ShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={activeProfile}
      />

      {editor.isEditorOpen && editor.editingProfile && (
        <AudiogramEditor
          profile={editor.editingProfile}
          syncEars={editor.syncEars}
          onToggleSync={() => editor.setSyncEars(v => !v)}
          onSetName={editor.setName}
          onSetLoss={editor.setLossValue}
          onSave={handleSaveCustom}
          onCancel={editor.closeEditor}
        />
      )}


    </div>
  );
}
