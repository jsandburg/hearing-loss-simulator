# Hearing Loss Simulator

Browser-based hearing loss simulator with preset audiogram profiles, custom audiogram entry, and shareable profile URLs. 

**Live:** [hearing-loss-simulator.netlify.app](https://hearing-loss-simulator.netlify.app)

---

## What It Does

Most hearing loss explainers reduce the experience to "things sound quieter." This simulator goes further. It models:

- **Frequency-specific attenuation:** each profile is derived from a real audiogram, applying the specific pattern of loss at each frequency rather than a uniform volume reduction
- **Reduced frequency selectivity:** damaged cochlear hair cells have broader tuning curves; the simulation widens each affected band's filter in proportion to the degree of loss, so heavily impaired regions lose clarity as well as loudness
- **Tinnitus:** an optional persistent tone at a configurable pitch and loudness, which partially masks nearby frequencies

The audiogram display uses the standard clinical format (ISO 8253-1): blue X marks for the left ear, red O marks for the right, with dB HL on the Y axis and frequency on the X axis.

---

## Hearing Profiles

Built-in profiles span seven categories:

| Category | Profiles |
|---|---|
| Sensorineural | Mild, Moderate, Severe |
| Age-related (Presbycusis) | Mild, Moderate, Severe |
| Noise-Induced | 4 kHz notch |
| Conductive | Mild, Moderate |
| Genetic patterns | Cookie Bite (mid-low), Cookie Bite (mid-high), Precipitous high-frequency |
| Asymmetric | Noise-induced asymmetric, Sudden unilateral |
| Reference | Normal Hearing |

Custom audiograms can be created by entering dB HL values at each of the eight standard audiogram frequencies (250, 500, 1k, 2k, 3k, 4k, 6k, 8k Hz). Custom profiles are saved to localStorage and persist across sessions.

---

## How the Simulation Works

### Signal Chain

```
AudioBufferSource → ChannelSplitter
  [L] → 8× BiquadFilter (peaking EQ) → AudioWorkletNode(L) → ChannelMerger → SensorineuralPathGain
  [R] → 8× BiquadFilter (peaking EQ) → AudioWorkletNode(R) ↗
  [direct]                                                  → ConductivePathGain
  [direct]                                                  → BypassPathGain
                         (optional level matching)     → ProfileGain → Limiter → Analyser → VolumeGain → Destination
```

Three signal paths exist simultaneously. Profile switching crossfades between them over 100ms with no click or interruption.

### Frequency Attenuation

Eight peaking EQ BiquadFilterNodes are placed at the standard audiogram frequencies. Audiogram values are in dB HL, a clinical reference scale rather than direct signal attenuation. The ISO 389-7 RETSPL correction is applied to convert:

```
effectiveAttenuation[i] = max(0, dBHL[i] - RETSPL[i])
```

Where the RETSPL corrections are: `[25.5, 11.5, 7.0, 9.0, 11.5, 12.0, 16.0, 15.5]` dB at 250–8000 Hz.

Filter Q values vary per band based on the frequency spacing of adjacent audiogram frequencies, preventing gaps and overlap. Q is additionally reduced proportional to loss magnitude, reflecting the broader tuning curves of damaged cochlear hair cells:

```
Q_effective = Q_base / (1 + min(loss_dB, 60) / 60)
```

Conductive loss profiles bypass the EQ chain entirely and use flat gain reduction — conductive loss is mechanical and has no cochlear frequency shaping.

Because the simulator uses a cascaded bank of peaking filters, neighbouring bands still interact. The filter gains are calibrated so the combined response lands much closer to the intended attenuation at the standard audiogram frequencies, but the response between those points remains an approximation rather than a perfect reconstruction of the audiogram curve.

### Level Matching

By default, playback uses natural attenuation: quieter profiles really do sound quieter. The player also includes an optional matched mode for comparison listening. When enabled, the engine applies a capped makeup gain after the active hearing-loss path so you can focus more on changes in tone and clarity while reducing much of the profile's loudness drop.

The level match gain is derived from a speech-weighted average of the profile's effective attenuation (or the conductive profile's flat attenuation), averaged across both ears and capped at +18 dB. It is meant as an A/B listening aid, not as a hearing-aid model.

### AudioWorklet Processor

When tinnitus is available, an `AudioWorkletNode` (`public/hearing-processor.js`) runs at the end of the active playback path. Sensorineural profiles place it after the BiquadFilter chain; conductive and bypass profiles place it after their flat or direct path. Its role is tinnitus injection only: it passes the already-processed signal through and adds a sinusoidal tone at the configured frequency and level if tinnitus is enabled. All frequency-selective attenuation is handled upstream.

### Profile Sharing

Built-in profiles are shared as a simple `?preset=<id>` URL, short and readable. Custom audiograms encode the full profile as compact JSON, UTF-8 encoded to a byte array, then URL-safe Base64 encoded into a `?p=` parameter. No server involved. Links are permanent and decode correctly even from older URL formats that used standard Base64 with percent-encoding.

The share dialog offers two formats: a copy-to-clipboard URL and a QR code generated client-side via the `qrcode` package. The QR code can be downloaded as a PNG. Scanning it with a phone camera opens the profile directly.

---

## Development

### Requirements

- Node.js 18+
- A Netlify account (for deployment — the app runs fully locally without one)

### Setup

```bash
npm install
npm run dev       # Vite dev server at localhost:5173
npm run build     # Production build to dist/
```

### Project Structure

```
src/
  App.jsx                    — client-side router (2 routes: /?p= and /)
  main.jsx                   — entry point, global CSS, ErrorBoundary
  constants/
    frequencies.js           — RETSPL values, filter Q, file validation
    presets.js               — built-in profiles + PRESET_CATEGORIES
    theme.js                 — design tokens
  engine/
    AudioEngine.js           — Web Audio API lifecycle, playback, seek, level matching
    buildFilterChain.js      — per-playback node graph (bypass/conductive/sensorineural)
    workletBridge.js         — sendWorkletParams, tinnitusLevelLabel
  hooks/
    useAudioEngine.js        — React wrapper for AudioEngine
    useAudiogramEditor.js    — custom profile CRUD, localStorage persistence
    useKeyboardShortcuts.js  — Space (play/stop)
    useWorkletParams.js      — tinnitus overrides on top of preset defaults
  components/
    AboutSection.jsx         — always-visible feature description
    AttenuationBars.jsx      — per-band attenuation visualisation
    AudiogramDisplay.jsx     — SVG audiogram (ISO 8253-1 conventions)
    AudiogramEditor.jsx      — modal for creating/editing custom profiles
    ErrorBoundary.jsx        — class component, recovery UI on render error
    FileUploader.jsx         — drag-and-drop + click audio file loader
    PlaybackControls.jsx     — play/stop, seek bar, volume, loop
    PresetDescription.jsx    — active profile name and description
    PresetSelector.jsx       — profile buttons with hover-delete for custom
    ShareDialog.jsx          — profile URL + QR code share modal
    SmallComponents.jsx      — Header, ErrorBanner, WarningBar, SharedProfileBanner
    SpectrumAnalyser.jsx     — canvas real-time FFT display
    WorkletControls.jsx      — tinnitus enable/pitch/loudness controls
  pages/
    SimulatorPage.jsx        — full app layout (two-column)
  utils/
    fileValidation.js        — formatDuration, displayFileName
    presetUrlEncoding.js     — Base64 URL encode/decode for profile sharing
    levelMatching.js         — capped loudness compensation for A/B listening
    volumeCurve.js           — percentToGain: squared perceptual volume curve

public/
  hearing-processor.js       — AudioWorklet processor (served as static file)

netlify.toml                 — Netlify build config + SPA redirects
```

### Adding a Hearing Profile

Add an entry to `src/constants/presets.js`:

```js
my_profile: {
  name:     'Display Name',
  left:     [0, 0, 10, 20, 30, 40, 40, 40],  // dB HL at [250,500,1k,2k,3k,4k,6k,8k]
  right:    [0, 0, 10, 20, 30, 40, 40, 40],
  color:    '#36454f',           // UI accent (audiogram uses clinical colours)
  colorRight: null,              // set for asymmetric profiles, null = use color
  category: 'sensorineural',     // sensorineural|noise|conductive|genetic|asymmetric|reference
  bypass:   false,               // true only for Normal Hearing
  isConductive: false,
  flatAttenuationL: null,        // dB, used for conductive profiles only
  flatAttenuationR: null,
  desc:        'Plain-language description.',
  worklet: {
    tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
  },
},
```

The profile will appear in the selector under its category automatically.

---

## Design Notes

**Why RETSPL correction matters:** Audiogram values are in dB HL (hearing level), a clinical reference scale where 0 dB HL = just audible to a normal ear at that frequency. But 0 dB HL means different things at different frequencies: 250 Hz requires 25.5 dB more signal energy than 1 kHz to reach the same perceptual threshold. Without RETSPL correction, a mild loss profile (10 dB HL at 250 Hz) would attenuate a large fraction of normal speech at 250 Hz, despite there being effectively zero perceptual loss there.

**Why the simulation sounds quieter than normal:** That's still intentional. Real hearing loss makes the world quieter, and the simulator does not apply automatic loudness compensation. The player now starts at a unity-gain reference so "Normal Hearing" is a clean baseline, and each profile sounds quieter relative to that reference. Severe profiles will still be very quiet. Per-band attenuation is capped at 40 dB in the audio engine; beyond that, bands become inaudible in a digital simulation, which defeats the educational purpose. The attenuation bars in the UI display the full uncapped loss shape (scaled to 80 dB) so the profile pattern remains readable for severe profiles, with a label noting where the audio cap sits.

**Why conductive loss is different:** Conductive loss is mechanical (fluid in the middle ear, earwax, ossicular chain disruption). The cochlea is intact and there is no frequency-specific damage. The simulation uses flat gain reduction only, bypassing the EQ chain entirely.

**Why conductive profiles have audiogram data that doesn't match the audio exactly:** The `left[]` and `right[]` arrays in conductive presets are realistic audiometric measurements and are used only for the audiogram display. The audio uses `flatAttenuationL/R` instead of running those values through the RETSPL-corrected EQ chain. The reason: RETSPL correction accounts for the ear's natural sensitivity curve, which is calibrated for cochlear hearing. Applying it to conductive loss data would create an artificial high-frequency tilt (250 Hz barely attenuated, 1-4 kHz heavily attenuated) that doesn't reflect how middle-ear blockage actually sounds. The flat attenuation values are product-calibrated to better match the qualitative blocked-ear experience rather than replaying the full threshold shift as broadband loss.

**Why asymmetric profiles always show the left ear as the affected side:** This is a demonstration convention. The left-worse pattern is common in real-world noise-induced asymmetric loss (e.g., a right-handed shooter whose left ear faces the muzzle). Using the same convention across both asymmetric profiles makes it easy to compare them directly.

**Why the noise notch profile shows partial recovery above 4 kHz:** The values at 6 kHz (40 dB) and 8 kHz (20 dB) are lower than the 4 kHz peak (65 dB), which might look like a data error. This is actually the clinically correct pattern: noise-induced loss creates a characteristic notch centred at 4 kHz that narrows above and below that frequency. The partial recovery at 6-8 kHz is what distinguishes a noise notch from age-related high-frequency loss, which rolls off continuously.

**Why there are two cookie bite profiles:** The cookie bite pattern describes a U-shaped dip in the mid frequencies, but the dip can sit at different positions. The mid-low variant (centred around 1-2 kHz) affects voice fundamentals and makes speech sound hollow. The mid-high variant (centred around 2-3 kHz) affects consonant frequencies and makes words harder to distinguish. Both patterns exist in practice and produce noticeably different perceptual effects.

**Audiogram colours vs UI theme:** The audiogram display always uses clinical colours (blue for left ear, red for right) per ISO 8253-1, regardless of the UI theme, so the audiogram remains clinically meaningful as the app's visual design evolves.

---

## Limitations

- Binaural processing (how both ears collaborate to localise sounds and separate competing voices) is not modelled
- Bone conduction thresholds are not distinguished from air conduction
- Listening fatigue and cognitive load are not modelled
- AudioWorklet availability varies by browser; tinnitus is disabled in browsers that don't support it, but frequency attenuation via the BiquadFilter chain still works fully
- The audio engine caps attenuation at 40 dB; profiles with severe loss (80–90 dB HL) cannot be fully represented, so the most severe profiles are less extreme than the real condition
- Loudness recruitment is not modelled; in sensorineural loss, a sound can jump from inaudible to uncomfortably loud with very little increase in level
- Temporal processing loss is not modelled; damaged ears also struggle to track rapid changes in sound, which affects speech clarity independently of frequency loss
- Results depend on playback hardware; headphones give a more accurate result than laptop speakers, which have their own uneven frequency response
- The built-in profiles are representative examples drawn from common audiometric patterns; individual audiograms vary considerably even within a diagnostic category
- Filter calibration accuracy: at audiogram frequencies that are near-normal but adjacent to a high-loss region, actual attenuation may run 1–2 dB above the target due to filter tail spillover from neighbouring bands. For profiles where all bands are elevated (flat moderate loss, etc.), calibration converges within 0.25 dB. Uncalibrated error for the same profiles runs 16–58 dB, so the residual 1–2 dB is a large improvement, but the tool should not be treated as a clinically validated diagnostic instrument

---

## Tech Stack

React 18 · Vite 6 · Web Audio API · AudioWorklet · Netlify
