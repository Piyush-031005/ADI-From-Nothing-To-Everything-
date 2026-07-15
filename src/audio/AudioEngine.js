/**
 * AudioEngine — Web Audio API synthesis per era.
 * Generates highly distinct procedural soundscapes for each era.
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
      this.masterGain.gain.value = 0.8; // BOOMING cinematic volume
      
      // Dynamic compressor to prevent clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
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
        n.gain?.setTargetAtTime(0, this.ctx.currentTime, 1.0);
        setTimeout(() => { try { n.source?.stop(); } catch(e) {} }, 2000);
      } catch(e) {}
    });
    this._nodes = [];
  }

  _playEra(index) {
    // Highly distinct setups per era
    const configs = [
      // 0: The Void (Deepest Sub-bass rumbling)
      [
        { type: 'sine', freq: 30, gain: 0.8 }, 
        { type: 'triangle', freq: 31, gain: 0.5, lfo: { freq: 0.1, depth: 2 } }
      ],
      // 1: Singularity (Tension rising, high pitch whine + sub)
      [
        { type: 'sine', freq: 40, gain: 0.8 }, 
        { type: 'sawtooth', freq: 400, gain: 0.1, filter: { type: 'lowpass', freq: 500, lfoFreq: 0.5 } }
      ],
      // 2: Big Bang (Massive explosion - heavy noise + square bass)
      [
        { type: 'noise', gain: 0.4, filter: { type: 'lowpass', freq: 1000 } }, 
        { type: 'square', freq: 40, gain: 0.6 }
      ],
      // 3: First Stars (High crystalline frequencies)
      [
        { type: 'sine', freq: 880, gain: 0.1 }, 
        { type: 'triangle', freq: 1760, gain: 0.05, lfo: { freq: 2, depth: 10 } }
      ],
      // 4: Stellar Death (Dark sweeping drone)
      [
        { type: 'sawtooth', freq: 55, gain: 0.3, filter: { type: 'lowpass', freq: 150, sweep: true } }
      ],
      // 5: Solar System (Calm, sparse harmonics)
      [
        { type: 'sine', freq: 220, gain: 0.2 }, 
        { type: 'sine', freq: 330, gain: 0.1 }
      ],
      // 6: Earth (Ocean roar via filtered noise)
      [
        { type: 'noise', gain: 0.3, filter: { type: 'lowpass', freq: 400, lfoFreq: 0.2 } },
        { type: 'sine', freq: 65, gain: 0.5 }
      ],
      // 7: Life / Cambrian (Bubbling / Organic Highs)
      [
        { type: 'triangle', freq: 392, gain: 0.1, lfo: { freq: 8, depth: 50 } }, 
        { type: 'sine', freq: 523, gain: 0.1, lfo: { freq: 4, depth: 20 } }
      ],
      // 8: Dinosaurs (Harsh, chaotic growl + crackle for meteor)
      [
        { type: 'sawtooth', freq: 41, gain: 0.6, lfo: { freq: 15, depth: 10 } }, 
        { type: 'noise', gain: 0.2, filter: { type: 'lowpass', freq: 2000 } }
      ],
      // 9: Humans (8-bit Digital stutters / technological pulse)
      [
        { type: 'square', freq: 110, gain: 0.2, filter: { type: 'lowpass', freq: 600 } },
        { type: 'square', freq: 220, gain: 0.1, lfo: { freq: 10, depth: 20 } }
      ],
      // 10: Future (Ethereal Sci-Fi Pad)
      [
        { type: 'sine', freq: 261.6, gain: 0.3 }, 
        { type: 'sine', freq: 329.6, gain: 0.2 },
        { type: 'sine', freq: 392.0, gain: 0.2 }
      ],
      // 11: Unknown World (Specimen) (Alien resonance, slow sweeps)
      [
        { type: 'sine', freq: 130.8, gain: 0.4 },
        { type: 'sawtooth', freq: 196, gain: 0.2, filter: { type: 'bandpass', freq: 800, sweep: true } },
        { type: 'triangle', freq: 1046, gain: 0.05, lfo: { freq: 0.5, depth: 200 } }
      ],
    ];

    const config = configs[index] || [];
    config.forEach(c => this._playTone(c));
  }

  _playTone({ type, freq, gain: gainVal, filter, lfo }) {
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
      }

      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0; // Start at 0 for fade in

      let nodeToConnect = source;

      // Pitch LFO (Vibrato / Glitch)
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

      // Advanced Filter
      if (filter) {
        const filterNode = this.ctx.createBiquadFilter();
        filterNode.type = filter.type;
        filterNode.frequency.value = filter.freq;
        
        // Filter Sweep effect
        if (filter.sweep) {
          filterNode.frequency.setValueAtTime(100, this.ctx.currentTime);
          filterNode.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 5);
        }
        
        // Filter LFO (Wah-Wah / Ocean roar effect)
        if (filter.lfoFreq) {
          const flfo = this.ctx.createOscillator();
          flfo.type = 'sine';
          flfo.frequency.value = filter.lfoFreq;
          const flfoGain = this.ctx.createGain();
          flfoGain.gain.value = filter.freq * 0.8; // Depth
          flfo.connect(flfoGain);
          flfoGain.connect(filterNode.frequency);
          flfo.start();
        }
        
        nodeToConnect.connect(filterNode);
        nodeToConnect = filterNode;
      }

      nodeToConnect.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start();

      // Sharp attack for big bang, slow fade for others
      gainNode.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.5);

      this._nodes.push({ source, gain: gainNode });
    } catch(e) {
      console.warn('Audio playback error', e);
    }
  }
}
