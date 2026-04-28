/**
 * hearing-processor.js
 * AudioWorklet processor for the Hearing Loss Simulator.
 *
 * IMPORTANT: This file runs in the AudioWorklet global scope — a completely
 * separate JavaScript environment from the main React app. There is NO:
 *   - import / require
 *   - DOM access
 *   - React state
 *   - window / document
 *
 * Only available globals: AudioWorkletProcessor, registerProcessor, sampleRate,
 * currentTime, currentFrame, MessagePort.
 *
 * This file must be served as a static asset (placed in /public/).
 * It is loaded via: audioContext.audioWorklet.addModule('/hearing-processor.js?v=2')
 *
 * Role: tinnitus tone injection only.
 * All frequency-selective attenuation is handled upstream by the BiquadFilter
 * peaking-EQ chain in buildFilterChain.js. This processor receives the
 * already-processed signal and adds a sinusoidal tinnitus tone on top of it.
 */

'use strict';

class HearingProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    this.tinnitus = { enabled: false, frequency: 4000, level: 0 };
    this.tinnitusPhase = 0;

    this.port.onmessage = (e) => {
      const d = e.data;
      if (!d) return;
      if ('tinnitus' in d) {
        this.tinnitus = {
          enabled:   Boolean(d.tinnitus.enabled),
          frequency: Math.max(20, Math.min(20000, Number(d.tinnitus.frequency ?? 4000))),
          level:     Math.max(0,  Math.min(1,     Number(d.tinnitus.level     ?? 0))),
        };
      }
    };
  }

  process(inputs, outputs) {
    const inputChannel  = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    const blockSize = inputChannel.length; // always 128

    const tinnitusPhaseInc = this.tinnitus.enabled
      ? (2 * Math.PI * this.tinnitus.frequency) / sampleRate
      : 0;

    for (let i = 0; i < blockSize; i++) {
      let sample = inputChannel[i];

      if (this.tinnitus.enabled && this.tinnitus.level > 0) {
        sample            += Math.sin(this.tinnitusPhase) * this.tinnitus.level * 0.15;
        this.tinnitusPhase = (this.tinnitusPhase + tinnitusPhaseInc) % (2 * Math.PI);
      }

      outputChannel[i] = sample < -1.0 ? -1.0 : sample > 1.0 ? 1.0 : sample;
    }

    return true;
  }
}

registerProcessor('hearing-processor', HearingProcessor);
