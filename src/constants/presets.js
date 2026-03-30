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
    desc:        'Mild loss across all frequencies. Soft speech is often missed. Background noise significantly reduces comprehension.',
    clinicalNote: 'Mild sensorineural loss (26–40 dB HL) is often the first level at which hearing aids are recommended in adults.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Moderate loss. Normal conversation requires effort and concentration. Hearing aids are typically prescribed at this stage.',
    clinicalNote: 'Moderate sensorineural loss (41–55 dB HL). Unaided speech recognition scores drop significantly, especially in noise.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Severe loss. Most speech is inaudible without amplification. Even with hearing aids, understanding is limited.',
    clinicalNote: 'Severe sensorineural loss (71–90 dB HL). Cochlear implant candidacy evaluation is strongly indicated.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Early age-related high-frequency loss. Consonants like S, F, and TH begin to blur. Speech in noise becomes harder to follow.',
    clinicalNote: 'Presbycusis is the most common cause of hearing loss. It typically affects frequencies above 2 kHz first due to basal cochlear hair cell loss.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Moderate age-related loss. Conversation requires concentration. Speech in noise is difficult. Television volume is often turned up.',
    clinicalNote: 'Most adults over 65 have some degree of presbycusis. At this stage, amplification is typically recommended.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Significant age-related loss. One-on-one conversation is difficult even in quiet. Group conversations are nearly impossible.',
    clinicalNote: 'At this level, hearing aids may not provide sufficient benefit. Cochlear implant evaluation is sometimes appropriate.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Classic acoustic-trauma pattern — a sharp notch at 4 kHz. Common after gunfire, industrial noise, or loud concert exposure.',
    clinicalNote: 'The 4 kHz notch occurs because this region of the cochlea is most mechanically stressed by loud sounds. The notch often widens with continued exposure.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  // ── Conductive ─────────────────────────────────────────────────────────────

  conductive_mild: {
    name:     'Conductive Loss (Mild)',
    left:     [25, 30, 30, 30, 28, 25, 22, 20],
    right:    [25, 30, 30, 30, 28, 25, 22, 20],
    color:    '#36454f',
    colorRight: null,
    category: 'conductive',
    bypass:   false,
    isConductive:    true,
    flatAttenuationL: 27,
    flatAttenuationR: 27,
    desc:        'Mild middle-ear blockage — like hearing through earplugs or with fluid in the ear. Sounds are uniformly softer but not distorted.',
    clinicalNote: 'Conductive loss is typically caused by otitis media, cerumen impaction, or ossicular chain disruption. The inner ear is intact.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },

  conductive_moderate: {
    name:     'Conductive Loss (Moderate)',
    left:     [40, 45, 45, 42, 40, 38, 35, 30],
    right:    [40, 45, 45, 42, 40, 38, 35, 30],
    color:    '#36454f',
    colorRight: null,
    category: 'conductive',
    bypass:   false,
    isConductive:    true,
    flatAttenuationL: 40,
    flatAttenuationR: 40,
    desc:        'Moderate middle-ear blockage. Speech requires significant volume to be audible. Normal conversation is difficult without raising voices.',
    clinicalNote: 'Moderate conductive loss (41–55 dB HL). Often treatable medically or surgically.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Mid-frequency loss centred around 1–2 kHz. Voice fundamentals most affected; speech can sound hollow or muffled.',
    clinicalNote: 'Cookie bite audiograms are often hereditary. The shape is named because the dip looks like a bite taken from the middle of the audiogram.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Mid-frequency loss centred around 2–3 kHz. Consonant clarity most affected — "s", "sh", "ch" become hard to distinguish.',
    clinicalNote: 'Mid-frequency hereditary loss often presents symmetrically and may be stable for decades before progression.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Steep cliff-like drop above 2 kHz. Low and mid frequencies are near-normal, but high-frequency sounds are nearly inaudible.',
    clinicalNote: 'Precipitous high-frequency loss is common in genetic hearing loss patterns and in late-stage noise-induced loss.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Unilateral noise exposure — left ear significantly worse than right. Common in occupational settings or shooting sports.',
    clinicalNote: 'Asymmetric sensorineural loss should be investigated to exclude retrocochlear pathology (acoustic neuroma) even when noise exposure is the likely cause.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Sudden sensorineural hearing loss in the left ear, with normal right. Profoundly disorienting. Spatial awareness is severely compromised.',
    clinicalNote: 'Sudden SNHL is a medical emergency requiring urgent evaluation and steroid therapy.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
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
    desc:        'Full auditory range. No processing applied. Use as a reference baseline when comparing against a simulated profile.',
    clinicalNote: 'Hearing thresholds of 0–20 dB HL are considered within normal limits for adults.',
    worklet: {
      recruitment:      false,
      temporalSmearing: 0,
      fineStructure:    0,
      tinnitus: { enabled: false, frequency: 4000, level: 0.15 },
    },
  },


};

// ─── Category definitions ──────────────────────────────────────────────────────

export const PRESET_CATEGORIES = [
  { key: 'reference',     label: 'Normal' },
  { key: 'sensorineural', label: 'Sensorineural' },
  { key: 'noise',         label: 'Noise-Induced' },
  { key: 'conductive',    label: 'Conductive' },
  { key: 'genetic',       label: 'Genetic' },
  { key: 'asymmetric',    label: 'Asymmetric' },
  { key: 'custom',        label: 'Custom Audiograms' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isSymmetric(profile) {
  return profile.left.every((v, i) => v === profile.right[i]);
}

export function findPreset(key) {
  return PRESETS[key] ?? null;
}

export function safeWorkletParams(profile) {
  const w = profile.worklet ?? {};
  return {
    recruitment:      Boolean(w.recruitment),
    temporalSmearing: Math.max(0, Math.min(1, Number(w.temporalSmearing ?? 0))),
    fineStructure:    Math.max(0, Math.min(1, Number(w.fineStructure    ?? 0))),
    tinnitus: {
      enabled:   Boolean(w.tinnitus?.enabled),
      frequency: Math.max(500, Math.min(12000, Number(w.tinnitus?.frequency ?? 4000))),
      level:     Math.max(0,   Math.min(1,     Number(w.tinnitus?.level     ?? 0))),
    },
  };
}
