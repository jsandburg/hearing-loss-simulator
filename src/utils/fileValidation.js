/**
 * utils/fileValidation.js
 * File validation utilities and display helpers.
 */

import { MAX_FILE_SIZE, AUDIO_EXTENSIONS, AUDIO_MIME_TYPES } from '../constants/frequencies.js';

/**
 * Validate an audio File object.
 * Returns an error string, or null if valid.
 */
export function validateAudioFile(file) {
  if (!file) return 'No file provided.';

  if (file.size > MAX_FILE_SIZE) {
    const mb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    return `File too large. Maximum size is ${mb} MB.`;
  }

  const ext     = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeOk  = AUDIO_MIME_TYPES.has(file.type);
  const extOk   = AUDIO_EXTENSIONS.has(ext);

  if (!mimeOk && !extOk) {
    return `Unsupported file type ".${ext}". Accepted: MP3, WAV, OGG, M4A, AAC, FLAC, OPUS.`;
  }

  return null;
}

/**
 * Truncate and sanitise a filename for display.
 * Keeps extension visible, truncates the stem if > 40 chars total.
 */
export function displayFileName(name) {
  if (!name) return '';
  const base = name.split(/[/\\]/).pop() ?? name;
  if (base.length <= 40) return base;

  const dotIdx = base.lastIndexOf('.');
  if (dotIdx === -1) return base.slice(0, 37) + '…';

  const ext  = base.slice(dotIdx);           // e.g. ".mp3"
  const stem = base.slice(0, dotIdx);
  const maxStem = 36 - ext.length;
  return stem.slice(0, maxStem) + '…' + ext;
}

/**
 * Format a duration in seconds as m:ss.
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Format a file size in human-readable form.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024)                    return `${bytes} B`;
  if (bytes < 1024 * 1024)             return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
