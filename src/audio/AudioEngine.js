/**
 * AudioEngine — Web Audio API synthesis per era.
 * No external audio files needed. Generates procedural cinematic Hans Zimmer style drones.
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
      this.masterGain.gain.value = 0.2; // slight boost for cinematic feel
      
      // Dynamic compressor to prevent clipping when bass drops
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
      
      // Start playing if an era was already requested
      if (this.currentEra !== -1) {
        this._playEra(this.currentEra);
      }
    } catch(e) {
      console.warn('Audio context unavailable', e);
    }
  }

  setEra(index) {
    if (!this.ctx || index === this.currentEra) return;
    this.currentEra = index;
    this._fadeAndStopAll();
    this._playEra(index);
  }

  _fadeAndStopAll() {
    this._nodes.forEach(n => {
      try {
        n.gain?.setTargetAtTime(0, this.ctx.currentTime, 1.5);
        setTimeout(() => { try { n.source?.stop(); } catch(e) {} }, 3000);
      } catch(e) {}
    });
    this._nodes = [];
  }

  _playEra(index) {
    // Interstellar / Cinematic drones setup
    const configs = [
      // Era 0: Void — Deep rumbling Gargantua sub-bass
      [
        { type: 'sine', freq: 35, gain: 0.5, detune: 0 }, 
        { type: 'sine', freq: 35.5, gain: 0.4, detune: 5 },
        { type: 'triangle', freq: 70, gain: 0.1, filter: { type: 'lowpass', freq: 150 } }
      ],
      // Era 1: Singularity — Tension rising tone
      [
        { type: 'sine', freq: 45, gain: 0.4 }, 
        { type: 'sawtooth', freq: 45, gain: 0.15, filter: { type: 'lowpass', freq: 200 } },
        { type: 'sine', freq: 135, gain: 0.1, lfo: { freq: 0.2, depth: 5 } } // Eerie throb
      ],
      // Era 2: Big Bang — White noise explosion + massive bass drop
      [
        { type: 'noise', gain: 0.2, filter: { type: 'lowpass', freq: 800 } }, 
        { type: 'square', freq: 40, gain: 0.3, filter: { type: 'lowpass', freq: 100 } }
      ],
      // Era 3: Stars — High ambient Zimmer string shimmer
      [
        { type: 'sine', freq: 220, gain: 0.08 }, 
        { type: 'sine', freq: 222, gain: 0.08 }, 
        { type: 'triangle', freq: 440, gain: 0.04, filter: { type: 'lowpass', freq: 1000 } }
      ],
      // Era 4: Solar System — Low drone
      [
        { type: 'sawtooth', freq: 32.7, gain: 0.1, filter: { type: 'lowpass', freq: 200 } }, 
        { type: 'noise', gain: 0.02 }
      ],
      // Era 5: Earth — Ocean waves + pure tone
      [
        { type: 'noise', gain: 0.1, filter: { type: 'lowpass', freq: 300 }, lfo: { freq: 0.1, depth: 100 } }, 
        { type: 'sine', freq: 110, gain: 0.05 }
      ],
      // Era 6: Life — Organic bubbling
      [
        { type: 'sine', freq: 196, gain: 0.05 }, 
        { type: 'sine', freq: 247, gain: 0.04 }, 
        { type: 'triangle', freq: 294, gain: 0.03, lfo: { freq: 1.5, depth: 10 } }
      ],
      // Era 7: Cambrian — Higher frequencies
      [
        { type: 'noise', gain: 0.04, filter: { type: 'highpass', freq: 1500 } }, 
        { type: 'triangle', freq: 523, gain: 0.03 }
      ],
      // Era 8: Dinosaurs — Low growl
      [
        { type: 'sawtooth', freq: 41, gain: 0.1, filter: { type: 'lowpass', freq: 150 } }, 
        { type: 'sine', freq: 61, gain: 0.1, lfo: { freq: 4, depth: 3 } } // Fast vibrato for growl
      ],
      // Era 9: Humans — Electronic hum
      [
        { type: 'square', freq: 55, gain: 0.05, filter: { type: 'lowpass', freq: 400 } }, 
        { type: 'sine', freq: 165, gain: 0.04 }
      ],
      // Era 10: Future — Ethereal pad
      [
        { type: 'sine', freq: 174.6, gain: 0.06 }, 
        { type: 'sine', freq: 261.6, gain: 0.05 }, 
        { type: 'triangle', freq: 349.2, gain: 0.04, filter: { type: 'lowpass', freq: 800 } }
      ],
      // Era 11: Unknown World — Surreal alien harmonics
      [
        { type: 'sine', freq: 130.8, gain: 0.06 }, 
        { type: 'triangle', freq: 196, gain: 0.05, filter: { type: 'lowpass', freq: 500 } },
        { type: 'sine', freq: 293.6, gain: 0.04, lfo: { freq: 0.1, depth: 5 } }
      ],
    ];

    const config = configs[index] || [];
    config.forEach(c => this._playTone(c));
  }

  _playTone({ type, freq, gain: gainVal, filter, lfo, detune }) {
    if (!this.ctx) return;
    try {
      let source;
      if (type === 'noise') {
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
        if (detune) source.detune.value = detune;
      }

      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0;

      let nodeToConnect = source;

      // Add LFO for wobble/vibrato if specified
      if (lfo && type !== 'noise') {
        const lfoOsc = this.ctx.createOscillator();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.value = lfo.freq;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = lfo.depth;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(source.frequency);
        lfoOsc.start();
      }

      // Add Filter
      if (filter) {
        const filterNode = this.ctx.createBiquadFilter();
        filterNode.type = filter.type;
        filterNode.frequency.value = filter.freq;
        nodeToConnect.connect(filterNode);
        nodeToConnect = filterNode;
      }

      nodeToConnect.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start();

      // Long cinematic fade in
      gainNode.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 2.0);

      this._nodes.push({ source, gain: gainNode });
    } catch(e) {
      console.warn('Audio playback error', e);
    }
  }
}
