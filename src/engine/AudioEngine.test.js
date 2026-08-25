import { describe, expect, it } from 'vitest';
import { AudioEngine } from './AudioEngine.js';

const audioFile = (name, type = '') => ({ name, type, size: 1024 });

describe('AudioEngine.validateFile', () => {
  it('accepts the formats exposed by the uploader', () => {
    for (const extension of ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'webm']) {
      expect(AudioEngine.validateFile(audioFile(`sample.${extension}`))).toBeNull();
    }
  });

  it('rejects WMA because the browser cannot decode it reliably', () => {
    expect(AudioEngine.validateFile(audioFile('sample.wma', 'audio/x-ms-wma')))
      .toContain('Unsupported file type');
  });
});
