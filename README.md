# Hearing Loss Simulator

Real-time browser-based hearing loss simulator. Upload any audio, apply clinical audiogram profiles or your own, and share the result as a URL.

**Live:** [hearing-loss-simulator.netlify.app](https://hearing-loss-simulator.netlify.app)

---

## What It Does

Most hearing loss explainers reduce the experience to "things sound quieter." This simulator goes further. It models:

- **Frequency-specific attenuation** — each profile is derived from a real audiogram, applying the specific pattern of loss at each frequency rather than uniform volume reduction
- **Reduced frequency selectivity** — damaged cochlear hair cells have broader tuning curves; the simulation widens each affected band's filter in proportion to the degree of loss, so heavily impaired regions lose clarity, not just loudness
- **Tinnitus** — an optional persistent tone at a configurable pitch and loudness, which partially masks nearby frequencies

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
                                              → Limiter → Analyser → VolumeGain → Destination
```

Three signal paths exist simultaneously. Profile switching crossfades between them over 100ms — no click, no interruption.

### Frequency Attenuation

Eight peaking EQ BiquadFilterNodes are placed at the standard audiogram frequencies. Audiogram values are in dB HL, which is a clinical reference scale — not direct signal attenuation. The ISO 389-7 RETSPL correction is applied to convert:

```
effectiveAttenuation[i] = max(0, dBHL[i] - RETSPL[i])
```

Where the RETSPL corrections are: `[25.5, 11.5, 7.0, 9.0, 11.5, 12.0, 16.0, 15.5]` dB at 250–8000 Hz.

Filter Q values vary per band based on the frequency spacing of adjacent audiogram frequencies, preventing gaps and overlap. Q is additionally reduced proportional to loss magnitude — damaged cochlear hair cells have broader tuning curves:

```
Q_effective = Q_base / (1 + min(loss_dB, 60) / 30)
```

Conductive loss profiles bypass the EQ chain entirely and use flat gain reduction — conductive loss is mechanical and has no cochlear frequency shaping.

### AudioWorklet Processor

For sensorineural profiles an `AudioWorkletNode` (`public/hearing-processor.js`) runs after the BiquadFilter chain. Its role is tinnitus injection only: it passes the already-processed signal through and adds a sinusoidal tone at the configured frequency and level if tinnitus is enabled. All frequency-selective attenuation is handled by the BiquadFilter chain upstream.

### Profile Sharing

Built-in profiles are shared as a simple `?preset=<id>` URL — short, readable, and impossible to corrupt. Custom audiograms encode the full profile as compact JSON, UTF-8 encoded to a byte array, then URL-safe Base64 encoded into a `?p=` parameter. No server involved. Links are permanent and decode correctly even from older URL formats that used standard Base64 with percent-encoding.

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
    AudioEngine.js           — Web Audio API lifecycle, playback, seek, loadBuffer
    buildFilterChain.js      — per-playback node graph (bypass/conductive/sensorineural)
    workletBridge.js         — sendWorkletParams, tinnitusLevelLabel
  hooks/
    useAudioEngine.js        — React wrapper for AudioEngine
    useAudiogramEditor.js    — custom profile CRUD, localStorage persistence
    useKeyboardShortcuts.js  — Space (play/stop), ← → (cycle presets)
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
    volumeCurve.js           — percentToGain: cubic perceptual volume curve

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

**Why RETSPL correction matters:** Audiogram values are in dB HL (hearing level), a clinical reference scale where 0 dB HL = just audible to a normal ear at that frequency. But 0 dB HL means different things at different frequencies — 250 Hz requires 25.5 dB more signal energy than 1 kHz to reach the same perceptual threshold. Without RETSPL correction, a mild loss profile (10 dB HL at 250 Hz) would attenuate a large fraction of normal speech at 250 Hz, despite there being effectively zero perceptual loss there.

**Why the simulation sounds quieter than normal:** That's intentional and correct. Real hearing loss makes the world quieter. No loudness compensation is applied — each profile is presented at its natural attenuated level, so the perceptual difference between profiles reflects actual differences in hearing loss severity. Severe profiles will be very quiet; turn up your system volume if needed. Per-band attenuation is capped at 40 dB — beyond that, bands become inaudible in a digital simulation, which defeats the educational purpose.

**Why conductive loss is different:** Conductive loss is mechanical — fluid in the middle ear, ossicular chain disruption, cerumen impaction. The cochlea is intact. There is no frequency-specific damage. The simulation uses flat gain reduction only, bypassing the EQ chain entirely.

**Audiogram colours vs UI theme:** The audiogram display always uses clinical colours (blue for left ear, red for right) per ISO 8253-1, regardless of the UI theme. This ensures the audiogram remains clinically meaningful as the app's visual design evolves.

---

## Limitations

- Binaural processing — how both ears collaborate to localise sounds and separate competing voices — is not modelled
- Bone conduction thresholds are not distinguished from air conduction
- Listening fatigue and cognitive load are not modelled
- AudioWorklet availability varies by browser; tinnitus is disabled in browsers that don't support it — frequency attenuation via the BiquadFilter chain still works fully

---

## Tech Stack

React 18 · Vite 6 · Web Audio API · AudioWorklet · Netlify
