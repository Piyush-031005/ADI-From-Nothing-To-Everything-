/**
 * AudioEngine — Web Audio API synthesis per era.
 * No external audio files needed.
 * Each era gets a characteristic drone/tone/texture.
 */
export class AudioEngine {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.currentEra = -1;
    this._nodes     = [];

    // Unlock on user gesture
    document.getElementById('loader')?.addEventListener('click', () => {
      this._init();
    }, { once: true });
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.12;
      this.masterGain.connect(this.ctx.destination);
    } catch(e) {
      console.warn('Audio context unavailable', e);
    }
  }

  setEra(index) {
    if (!this.ctx || index === this.currentEra) return;
    this.currentEra = index;
    this._stopAll();
    this._playEra(index);
  }

  _stopAll() {
    this._nodes.forEach(n => {
      try {
        n.gain?.setTargetAtTime(0, this.ctx.currentTime, 0.5);
        setTimeout(() => { try { n.source?.stop(); } catch(e) {} }, 800);
      } catch(e) {}
    });
    this._nodes = [];
  }

  _playEra(index) {
    const configs = [
      // Era 0: Void — very low rumble
      [{ type: 'sine', freq: 18, gain: 0.3 }, { type: 'sine', freq: 22, gain: 0.1 }],
      // Era 1: Singularity — rising tone
      [{ type: 'sine', freq: 55, gain: 0.2 }, { type: 'triangle', freq: 110, gain: 0.05 }],
      // Era 2: Big Bang — white noise burst + bass
      [{ type: 'noise', gain: 0.15 }, { type: 'sine', freq: 40, gain: 0.3 }],
      // Era 3: Stars — high ambient shimmer
      [{ type: 'sine', freq: 220, gain: 0.06 }, { type: 'sine', freq: 330, gain: 0.04 }, { type: 'triangle', freq: 440, gain: 0.02 }],
      // Era 4: Solar System — low drone + crackle
      [{ type: 'sawtooth', freq: 30, gain: 0.08 }, { type: 'noise', gain: 0.04 }],
      // Era 5: Earth — ocean waves (filtered noise)
      [{ type: 'noise', gain: 0.08, filter: { type: 'lowpass', freq: 400 } }, { type: 'sine', freq: 88, gain: 0.04 }],
      // Era 6: Life — organic bubbles (sine cluster)
      [{ type: 'sine', freq: 200, gain: 0.04 }, { type: 'sine', freq: 251, gain: 0.03 }, { type: 'sine', freq: 300, gain: 0.02 }],
      // Era 7: Cambrian — rain (filtered noise) + insects
      [{ type: 'noise', gain: 0.06, filter: { type: 'highpass', freq: 2000 } }, { type: 'triangle', freq: 600, gain: 0.02 }],
      // Era 8: Dinosaurs — low growl
      [{ type: 'sawtooth', freq: 40, gain: 0.06 }, { type: 'sine', freq: 60, gain: 0.08 }],
      // Era 9: Humans — electronic hum
      [{ type: 'square', freq: 55, gain: 0.04 }, { type: 'sine', freq: 110, gain: 0.03 }, { type: 'noise', gain: 0.02 }],
      // Era 10: Future — ethereal pad
      [{ type: 'sine', freq: 174, gain: 0.06 }, { type: 'sine', freq: 261, gain: 0.04 }, { type: 'triangle', freq: 349, gain: 0.03 }],
    ];

    const config = configs[index] || [];
    config.forEach(c => this._playTone(c));
  }

  _playTone({ type, freq, gain: gainVal, filter }) {
    if (!this.ctx) return;
    try {
      let source;
      if (type === 'noise') {
        // White noise via AudioBuffer
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
      } else {
        source = this.ctx.createOscillator();
        source.type = type;
        source.frequency.value = freq;
      }

      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0;

      let node = source;

      if (filter) {
        const filterNode = this.ctx.createBiquadFilter();
        filterNode.type = filter.type;
        filterNode.frequency.value = filter.freq;
        source.connect(filterNode);
        filterNode.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      gainNode.connect(this.masterGain);
      source.start();

      // Fade in
      gainNode.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 1.0);

      this._nodes.push({ source, gain: gainNode });
    } catch(e) {
      console.warn('Audio playback error', e);
    }
  }
}
