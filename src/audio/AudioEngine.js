/**
 * AudioEngine — Cinematic DJ Mix Engine
 * Manages playback of curated MP3 tracks with seamless crossfading.
 * Boosts volume cleanly via Compressor to prevent digital distortion.
 */
import { gsap } from 'gsap';

export class AudioEngine {
  constructor() {
    this.currentEra = -1;
    this.tracks = {}; // Cache of { audio, gainNode }
    this.activeTrackUrl = null;
    this.activeTrackObj = null;

    // Track mapping with ?v=2 cache buster to force browser to grab updated MP3s
    this.eraToTrack = {
      0: '/music/void.mp3?v=2',
      1: '/music/singularity.mp3?v=2',
      2: '/music/bigbang.mp3?v=2',
      3: '/music/stars.mp3?v=2',
      4: '/music/black hole.mp3?v=2',
      5: '/music/rise of soalr system and earth.mp3?v=2',
      6: '/music/rise of soalr system and earth.mp3?v=2',
      7: '/music/camprian perod.mp3?v=2',
      8: '/music/dinosaur.mp3?v=2',
      9: '/music/dinosaur.mp3?v=2', // Dinosaurs takes up index 9 in new ERA_DATA mapping
      10: '/music/cyberpunk future.mp3?v=2',
      11: '/music/unknown last era.mp3?v=2'
    };
    
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this._initialized = false;
  }

  // Must be called on user click to unlock AudioContext
  _init() {
    if (this._initialized) return;
    this._initialized = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    
    // Immediately resume the context
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.5; 
    
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-15, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    const urls = [...new Set(Object.values(this.eraToTrack))];
    urls.forEach(url => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.crossOrigin = "anonymous";
      
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0; // Start silenced
      
      try {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(trackGain);
        trackGain.connect(this.masterGain);
      } catch(e) {
        console.warn("Could not create media element source", e);
      }

      this.tracks[url] = { audio, gainNode: trackGain };
    });
  }

  setEra(index) {
    if (!this._initialized) this._init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (index === this.currentEra) return;
    this.currentEra = index;
    
    const targetUrl = this.eraToTrack[index];
    if (!targetUrl) return;

    if (this.activeTrackUrl === targetUrl) {
      return; 
    }

    this._fadeTo(targetUrl, index);
  }

  _fadeTo(targetUrl, eraIndex) {
    const nextTrack = this.tracks[targetUrl];
    if (!nextTrack) return;

    // Fade out previous
    if (this.activeTrackObj && this.activeTrackObj !== nextTrack) {
      const prev = this.activeTrackObj;
      gsap.to(prev.gainNode.gain, {
        value: 0,
        duration: 2.5,
        ease: 'power2.inOut',
        onComplete: () => {
          prev.audio.pause();
        }
      });
    }

    this.activeTrackUrl = targetUrl;
    this.activeTrackObj = nextTrack;

    // Special track timings
    if (eraIndex === 1) {
      nextTrack.audio.currentTime = 6.0;
    } else if (eraIndex === 2) {
      nextTrack.audio.currentTime = 5.0;
    }

    // Ensure it's playing
    const playPromise = nextTrack.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Audio play failed:", e);
      });
    }

    // Fade in new (Gain multiplier goes to 1.0, masterGain does the overall boost)
    gsap.to(nextTrack.gainNode.gain, {
      value: 1.0,
      duration: 3.0,
      ease: 'power2.inOut'
    });
  }
}

export const audioEngine = new AudioEngine();
