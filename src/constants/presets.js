/**
 * constants/presets.js
 * All built-in hearing profiles.
 * Ordered: mild sensorineural first, then by severity and type.
 */

import { THEME } from './theme.js';

export const PRESETS = {

  // ── Sensorineural ──────────────────────────────────────────────────────────

  mild_sensorineural: {
    name:     'Mild Sensorineural',
    left:     [10, 15, 20, 30, 35, 40, 40, 40],
    right:    [10, 15, 20, 30, 35, 40, 40, 40],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Mild loss across the full range of pitches. Quiet speech is often missed, and following a conversation in a noisy room takes real effort. This is frequently the point at which a doctor first suggests hearing aids.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  moderate_sensorineural: {
    name:     'Moderate Sensorineural',
    left:     [15, 20, 35, 50, 55, 60, 60, 55],
    right:    [15, 20, 35, 50, 55, 60, 60, 55],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Moderate loss across the full range of pitches. Normal conversation takes real concentration, and noisy environments make it much harder to follow what people are saying. People with this level of loss frequently ask others to repeat themselves.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  severe_sensorineural: {
    name:     'Severe Sensorineural',
    left:     [55, 60, 65, 70, 75, 80, 85, 85],
    right:    [55, 60, 65, 70, 75, 80, 85, 85],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Severe loss across all frequencies. Most speech is very difficult to hear without a hearing aid, and even with amplification, following conversation can be a challenge. At this level, cochlear implants are sometimes considered as an option.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Presbycusis ────────────────────────────────────────────────────────────

  mild_presbycusis: {
    name:     'Mild Presbycusis',
    left:     [0, 5, 10, 20, 30, 40, 45, 50],
    right:    [0, 5, 10, 20, 30, 40, 45, 50],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Age-related hearing loss that starts with the higher pitches, the most common pattern of hearing loss overall. High-frequency consonants like S, F, and TH begin to sound similar, making words harder to distinguish, especially in background noise.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  moderate_presbycusis: {
    name:     'Moderate Presbycusis',
    left:     [5, 15, 25, 40, 55, 65, 70, 75],
    right:    [5, 15, 25, 40, 55, 65, 70, 75],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Moderate age-related loss affecting the mid and high frequencies. Conversation takes more effort than it used to, following people in noisy places is genuinely difficult, and the TV volume tends to creep up over time. Most adults over 65 have some degree of this.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  severe_presbycusis: {
    name:     'Severe Presbycusis',
    left:     [25, 35, 50, 65, 75, 80, 85, 85],
    right:    [25, 35, 50, 65, 75, 80, 85, 85],
    color:    '#36454f',
    colorRight: null,
    category: 'sensorineural',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Significant age-related loss across the full hearing range. Even one-on-one conversation in a quiet room is hard to follow, and group settings are largely inaccessible without hearing aids. At this level, hearing aids alone may not restore enough clarity.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Noise-Induced ──────────────────────────────────────────────────────────

  noise_notch: {
    name:     'Noise-Induced (4 kHz Notch)',
    left:     [0, 0, 5, 15, 50, 65, 40, 20],
    right:    [0, 0, 5, 15, 50, 65, 40, 20],
    color:    '#36454f',
    colorRight: null,
    category: 'noise',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'A sharp dip in hearing around 4 kHz, the frequency range most vulnerable to loud noise. Common after prolonged exposure to gunfire, heavy machinery, or loud music. The rest of the hearing range may be relatively intact, which is why people with this pattern often do not notice it at first.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Conductive ─────────────────────────────────────────────────────────────

  conductive_mild: {
    name:     'Conductive Loss (Mild)',
    // left/right are audiometric dB HL values used only for the audiogram display.
    // Audio simulation uses flatAttenuationL/R (uniform gain reduction) — not these arrays.
    // These values are product-calibrated to better match the qualitative
    // "blocked ear / earplug" experience than raw audiometric threshold shift.
    left:     [25, 30, 30, 30, 28, 25, 22, 20],
    right:    [25, 30, 30, 30, 28, 25, 22, 20],
    color:    '#36454f',
    colorRight: null,
    category: 'conductive',
    bypass:   false,
    isConductive:    true,
    flatAttenuationL: 15,
    flatAttenuationR: 15,
    desc:        'Mild hearing loss caused by something blocking or dampening the middle ear, such as fluid, earwax buildup, or an ear infection. The experience is similar to wearing earplugs: sounds are softer overall but not distorted. This type of loss is often treatable.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  conductive_moderate: {
    name:     'Conductive Loss (Moderate)',
    // left/right are audiometric dB HL values used only for the audiogram display.
    // Audio simulation uses flatAttenuationL/R (uniform gain reduction) — not these arrays.
    // These values are product-calibrated to better match perceived listening
    // difficulty rather than replaying the full threshold shift as broadband loss.
    left:     [40, 45, 45, 42, 40, 38, 35, 30],
    right:    [40, 45, 45, 42, 40, 38, 35, 30],
    color:    '#36454f',
    colorRight: null,
    category: 'conductive',
    bypass:   false,
    isConductive:    true,
    flatAttenuationL: 25,
    flatAttenuationR: 25,
    desc:        'Moderate hearing loss caused by middle-ear blockage. Conversation requires noticeably raised voices, and quieter sounds become inaudible. Like a more severe version of having blocked ears. This level of loss is often treatable with medication or surgery.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Genetic / Pattern ──────────────────────────────────────────────────────

  cookie_bite_low: {
    name:     'Cookie Bite (Mid-Low)',
    left:     [5, 10, 40, 55, 50, 35, 15, 5],
    right:    [5, 10, 40, 55, 50, 35, 15, 5],
    color:    '#36454f',
    colorRight: null,
    category: 'genetic',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'A U-shaped dip in the middle of the hearing range, named for what it looks like on an audiogram. The affected frequencies overlap with the core of the human voice, so speech can sound hollow or muffled even when the volume seems fine. This pattern is often inherited.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  cookie_bite_high: {
    name:     'Cookie Bite (Mid-High)',
    left:     [5, 10, 25, 50, 55, 45, 20, 10],
    right:    [5, 10, 25, 50, 55, 45, 20, 10],
    color:    '#36454f',
    colorRight: null,
    category: 'genetic',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'A U-shaped dip centered slightly higher in pitch, affecting the frequencies where consonant sounds live. Letters like S, SH, and CH become difficult to tell apart. This pattern is often inherited and can remain stable for many years.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  precipitous: {
    name:     'Precipitous High-Frequency',
    left:     [0, 0, 0, 10, 35, 65, 85, 90],
    right:    [0, 0, 0, 10, 35, 65, 85, 90],
    color:    '#36454f',
    colorRight: null,
    category: 'genetic',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Near-normal hearing in the low and mid frequencies, with a steep drop-off in the higher ranges. Low sounds like bass and vowels come through clearly, but high-frequency sounds, consonants, and higher-pitched voices can be nearly inaudible. This pattern appears in some genetic hearing conditions and in advanced noise-induced loss.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Asymmetric ─────────────────────────────────────────────────────────────

  asymmetric_noise: {
    name:     'Asymmetric Noise-Induced',
    left:     [0, 0, 10, 25, 65, 75, 55, 30],
    right:    [0, 0, 5,  10, 30, 35, 25, 15],
    color:    THEME.leftEar,
    colorRight: THEME.rightEar,
    category: 'asymmetric',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Noise-induced loss that is significantly worse in the left ear than the right, with a pronounced dip around 4 kHz on the left side. Common after occupational noise exposure or shooting sports where one ear faces the sound source. Hearing loss that differs noticeably between ears is worth having evaluated.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  sudden_unilateral: {
    name:     'Sudden Unilateral Loss',
    left:     [55, 60, 65, 70, 75, 80, 85, 85],
    right:    [0,  0,  0,  0,  0,  0,  0,  0],
    color:    THEME.leftEar,
    colorRight: THEME.rightEar,
    category: 'asymmetric',
    bypass:   false,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'Sudden loss of hearing in the left ear, with the right ear unaffected. One-sided hearing loss makes it very hard to tell where sounds are coming from, and following conversations in group settings becomes disorienting. Sudden hearing loss in one ear is a medical emergency and should be evaluated immediately.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Reference ──────────────────────────────────────────────────────────────

  normal: {
    name:     'Normal Hearing',
    left:     [0, 0, 0, 0, 0, 0, 0, 0],
    right:    [0, 0, 0, 0, 0, 0, 0, 0],
    color:    THEME.success,
    colorRight: null,
    category: 'reference',
    bypass:   true,
    isConductive:    false,
    flatAttenuationL: null,
    flatAttenuationR: null,
    desc:        'No hearing loss applied. Audio passes through without any processing. Use this as a reference point to compare what something sounds like before and after a hearing loss profile is applied.',
    worklet: {
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },


};

// ─── Category definitions ──────────────────────────────────────────────────────

export const PRESET_CATEGORIES = [
  { key: 'reference',     label: 'Reference' },
  { key: 'sensorineural', label: 'Sensorineural' },
  { key: 'noise',         label: 'Noise-Induced' },
  { key: 'conductive',    label: 'Conductive' },
  { key: 'genetic',       label: 'Genetic' },
  { key: 'asymmetric',    label: 'Asymmetric' },
  { key: 'custom',        label: 'Custom Audiograms' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function findPreset(key) {
  return PRESETS[key] ?? null;
}
