# Changelog

All notable changes are documented here.

---

## [Unreleased]

---

## 2026-04-28

### Accessibility
- Added `useFocusTrap` hook: Tab/Shift+Tab cycles within a modal, Escape closes it, focus is restored to the triggering element on close
- Applied focus trap to ShareDialog and AudiogramEditor; both now carry `role="dialog"`, `aria-modal="true"`, and `aria-label`

### Mobile
- Responsive two-column → single-column layout below 768 px (`useIsMobile` hook)
- AudiogramEditor switches from 8-column to 4×2 grid on mobile so dB inputs are usable on small screens
- Header, footer, and AboutSection padding adjusted for small viewports

### Audio engine
- Sensorineural filter calibration: replaced uncalibrated filter gains (16–58 dB error) with a Newton-iteration solve that converges within 0.25 dB at all audiogram bands, and within 1–2 dB at near-normal bands adjacent to high-loss regions
- Added module-level cache for `buildSensorineuralBands` — profile switches no longer recompute the filter bank from scratch on every call
- Level matching: optional makeup gain derived from a speech-weighted average of effective attenuation per ear, capped at +18 dB, applied via a persistent `ProfileGain` node after the active path
- Fixed conductive → conductive profile switches not rebuilding the audio graph
- Fixed audio switching and seek logic; profile switches now happen unconditionally (not gated on play state)
- Calibrated default volume and conductive flat-attenuation values

### Tinnitus
- Fixed level scaling (was applied at the wrong stage)
- Enabled tinnitus controls for all profile types, not just sensorineural

### UI
- Replaced per-ear duplication buttons in AudiogramEditor with a single "same for both ears" sync checkbox
- Rewrote all profile descriptions and feature cards for plain language
- Added QR code tab to the ShareDialog (client-side, no server)
- Improved attenuation bar display for conductive profiles

### Tests (89 tests across 8 files)
- `buildFilterChain`: solveLinearSystem, getPeakingResponseDb, evaluateCascadeAttenuation, calibrateBandAttenuations, buildSensorineuralBands (21 tests)
- `levelMatching`: gain values, bypass, conductive, sensorineural, asymmetric, cap (7 tests)
- `presetUrlEncoding`: round-trip encode/decode, error cases (11 tests)
- `volumeCurve`: curve shape, clamps, monotonicity (7 tests)
- `frequencies`: getEffectiveQ, RETSPL_CORRECTION (10 tests)
- `useAudiogramEditor`: editor open/close, value editing, save/delete, localStorage persistence (18 tests)
- `useIsMobile`: initial state, breakpoint boundary, resize events (5 tests)
- `useFocusTrap`: focus on open, Escape, Tab wrap, inactive guard (7 tests)

### Infrastructure
- Vitest setup file polyfills `localStorage` for Node.js 25+ compatibility; auto-clears between tests
- `vite.config.js`: `environment: 'jsdom'`, `setupFiles` wired

---

## 2026-04-27 — Initial public version

### Audio engine
- Web Audio API signal chain: bypass / conductive / sensorineural paths with 100 ms crossfade on profile switch
- 8-band peaking EQ BiquadFilterNode chain at standard audiogram frequencies (250 Hz – 8 kHz)
- ISO 389-7 RETSPL correction converts dB HL audiogram values to effective signal attenuation
- Q broadening proportional to loss magnitude, modelling reduced cochlear frequency selectivity
- AudioWorklet processor for tinnitus injection (sinusoidal tone, configurable frequency and level)
- Conductive profiles use flat gain reduction and bypass the EQ chain entirely

### Profiles
- 15 built-in profiles across 7 categories: sensorineural, presbycusis, noise-induced, conductive, genetic, asymmetric, reference
- Custom audiogram creation and editing (8 dB HL values per ear, stored in localStorage)
- Profile sharing via URL-encoded `?p=` parameter (compact JSON → UTF-8 → URL-safe Base64, no server)

### UI
- Audiogram display (ISO 8253-1 format: blue X left ear, red O right ear)
- Real-time FFT spectrum analyser
- Attenuation bars per frequency band
- Drag-and-drop file upload with format validation
- Playback controls: play/stop, seek, volume, loop
- React error boundary with recovery UI
