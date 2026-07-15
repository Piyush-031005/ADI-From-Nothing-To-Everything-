/**
 * AudioEngine — Cinematic DJ Mix Engine
 * Manages playback of curated MP3 tracks with seamless crossfading.
 * Boosts volume via Web Audio API GainNode.
 */
import { gsap } from 'gsap';

export class AudioEngine {
  constructor() {
    this.currentEra = -1;
    this.tracks = {}; // Cache of { audio, gainNode }
    this.activeTrackUrl = null;
    this.activeTrackObj = null;

    // Track mapping
    this.eraToTrack = {
      0: '/music/void.mp3',
      1: '/music/singularity.mp3',
      2: '/music/bigbang.mp3',
      3: '/music/stars.mp3',
      4: '/music/black hole.mp3',
      5: '/music/rise of soalr system and earth.mp3',
      6: '/music/rise of soalr system and earth.mp3',
      7: '/music/camprian perod.mp3',
      8: '/music/dinosaur.mp3',
      9: '/music/human.mp3',
      10: '/music/cyberpunk future.mp3',
      11: '/music/unknown last era.mp3'
    };
    
    this.ctx = null;
    this.masterGain = null;
    this._initialized = false;
  }

  // Must be called on user click to unlock AudioContext
  _init() {
    if (this._initialized) return;
    this._initialized = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    
    // BOOST VOLUME BY 3.5x (Since the user said it's very low)
    this.masterGain.gain.value = 3.5; 
    this.masterGain.connect(this.ctx.destination);

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

    // Fade in new
    gsap.to(nextTrack.gainNode.gain, {
      value: 1.0, // This is 1.0 * masterGain (3.5) = 3.5x boost
      duration: 3.0,
      ease: 'power2.inOut'
    });
  }
}
