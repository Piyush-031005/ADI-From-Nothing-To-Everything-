/**
 * AudioEngine — Cinematic Web Audio API synthesis per era.
 * Generates smooth, epic, Hans-Zimmer style soundscapes with heavy delay/reverb.
 * STRICTLY uses Sine and Triangle waves (NO noise, NO square waves).
 */
export class AudioEngine {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.delayNode  = null;
    this.currentEra = -1;
    this._nodes     = [];

    // Initialize immediately
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8; 
      
      // Dynamic compressor for smooth levels
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      
      // Massive Cinematic Delay (Echo) for space feel
      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.value = 0.5; // Half second echo
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.4; // 40% feedback
      
      this.delayNode.connect(feedback);
      feedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
      
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
        // Slow, beautiful 3-second fade out
        n.gain?.setTargetAtTime(0, this.ctx.currentTime, 1.5);
        setTimeout(() => { try { n.source?.stop(); } catch(e) {} }, 4000);
      } catch(e) {}
    });
    this._nodes = [];
  }

  _playEra(index) {
    // Pure, smooth, epic configurations (Hans Zimmer Interstellar style)
    const configs = [
      // 0: The Void (Deepest Sub-bass rumbling, very smooth)
      [
        { type: 'sine', freq: 32.7, gain: 0.8 }, // C1
        { type: 'sine', freq: 49.0, gain: 0.4 }  // G1
      ],
      // 1: Singularity (Tension rising, very slow LFO)
      [
        { type: 'sine', freq: 65.4, gain: 0.6 }, // C2
        { type: 'triangle', freq: 130.8, gain: 0.2, filter: { type: 'lowpass', freq: 400 } } 
      ],
      // 2: Big Bang (Massive bass hit, slow fade)
      [
        { type: 'triangle', freq: 32.7, gain: 1.0, filter: { type: 'lowpass', freq: 200 } }, 
        { type: 'sine', freq: 65.4, gain: 0.8 }
      ],
      // 3: First Stars (High crystalline, echoing choral)
      [
        { type: 'sine', freq: 523.25, gain: 0.2 }, // C5
        { type: 'sine', freq: 659.25, gain: 0.15 }, // E5
        { type: 'triangle', freq: 783.99, gain: 0.1, filter: { type: 'lowpass', freq: 1000 } } // G5
      ],
      // 4: Stellar Death (Dark, smooth drone)
      [
        { type: 'sine', freq: 43.65, gain: 0.5 }, // F1
        { type: 'triangle', freq: 87.31, gain: 0.2, filter: { type: 'lowpass', freq: 300 } }
      ],
      // 5: Solar System (Calm, sweeping harmonics)
      [
        { type: 'sine', freq: 130.81, gain: 0.4 }, // C3
        { type: 'sine', freq: 196.00, gain: 0.3 }  // G3
      ],
      // 6: Earth (Warm, deep oceans)
      [
        { type: 'sine', freq: 65.41, gain: 0.6 },  // C2
        { type: 'triangle', freq: 130.81, gain: 0.2, filter: { type: 'lowpass', freq: 400, lfoFreq: 0.1 } }
      ],
      // 7: Life / Cambrian (Ethereal highs)
      [
        { type: 'sine', freq: 261.63, gain: 0.3 }, // C4
        { type: 'sine', freq: 392.00, gain: 0.2 }, // G4
        { type: 'sine', freq: 523.25, gain: 0.1 }  // C5
      ],
      // 8: Dinosaurs (Heavy, ominous bass - NO NOISE)
      [
        { type: 'triangle', freq: 41.20, gain: 0.7, filter: { type: 'lowpass', freq: 150 } }, // E1
        { type: 'sine', freq: 61.74, gain: 0.5 }   // B1
      ],
      // 9: Humans (Clean, organized chords)
      [
        { type: 'sine', freq: 110.00, gain: 0.4 }, // A2
        { type: 'sine', freq: 164.81, gain: 0.3 }, // E3
        { type: 'triangle', freq: 220.00, gain: 0.1, filter: { type: 'lowpass', freq: 600 } } // A3
      ],
      // 10: Future (Ethereal Sci-Fi Pad)
      [
        { type: 'sine', freq: 261.6, gain: 0.3 }, 
        { type: 'sine', freq: 329.6, gain: 0.2 },
        { type: 'sine', freq: 392.0, gain: 0.2 }
      ],
      // 11: Unknown World (Specimen) (Epic, resonant, echoing)
      [
        { type: 'sine', freq: 130.8, gain: 0.4 },
        { type: 'triangle', freq: 196, gain: 0.2, filter: { type: 'lowpass', freq: 800 } },
        { type: 'sine', freq: 261.63, gain: 0.1 } 
      ],
    ];

    const config = configs[index] || [];
    config.forEach(c => this._playTone(c));
  }

  _playTone({ type, freq, gain: gainVal, filter, lfo }) {
    if (!this.ctx) return;
    try {
      const source = this.ctx.createOscillator();
      source.type = type;
      source.frequency.value = freq;

      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0; 

      let nodeToConnect = source;

      if (filter) {
        const filterNode = this.ctx.createBiquadFilter();
        filterNode.type = filter.type;
        filterNode.frequency.value = filter.freq;
        
        if (filter.lfoFreq) {
          const flfo = this.ctx.createOscillator();
          flfo.type = 'sine';
          flfo.frequency.value = filter.lfoFreq;
          const flfoGain = this.ctx.createGain();
          flfoGain.gain.value = filter.freq * 0.5; 
          flfo.connect(flfoGain);
          flfoGain.connect(filterNode.frequency);
          flfo.start();
        }
        
        nodeToConnect.connect(filterNode);
        nodeToConnect = filterNode;
      }

      // Connect to main gain
      nodeToConnect.connect(gainNode);
      
      // Split the signal: one to master, one to delay (echo)
      gainNode.connect(this.masterGain);
      gainNode.connect(this.delayNode);
      
      source.start();

      // Very slow, epic 2-second fade-in
      gainNode.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 1.0);

      this._nodes.push({ source, gain: gainNode });
    } catch(e) {
      console.warn('Audio playback error', e);
    }
  }
}
