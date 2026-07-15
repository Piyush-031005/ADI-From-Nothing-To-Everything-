/**
 * AudioEngine — Cinematic DJ Mix Engine
 * Manages playback of curated MP3 tracks with seamless crossfading.
 * Tracks loop continuously. If scrolling back to an active track, it does not restart.
 */
import { gsap } from 'gsap';

export class AudioEngine {
  constructor() {
    this.currentEra = -1;
    this.tracks = {}; // Cache of HTMLAudioElements
    this.activeTrackUrl = null;
    this.activeAudio = null;

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

    // Preload tracks
    this._preloadAll();
  }

  _preloadAll() {
    const urls = [...new Set(Object.values(this.eraToTrack))];
    urls.forEach(url => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0; // Start silenced for crossfading
      this.tracks[url] = audio;
    });
  }

  setEra(index) {
    if (index === this.currentEra) return;
    this.currentEra = index;
    
    const targetUrl = this.eraToTrack[index];
    if (!targetUrl) return;

    // If the requested track is already the active one, do nothing (seamless continuous playback)
    if (this.activeTrackUrl === targetUrl) {
      return; 
    }

    // Special rule: Singularity plays after 3 seconds
    if (index === 1) {
      this._fadeTo(targetUrl, 3000);
    } else {
      this._fadeTo(targetUrl, 0);
    }
  }

  _fadeTo(targetUrl, delayMs) {
    const nextAudio = this.tracks[targetUrl];
    if (!nextAudio) return;

    // If there is an active track playing, fade it out
    if (this.activeAudio && this.activeAudio !== nextAudio) {
      const prevAudio = this.activeAudio;
      gsap.to(prevAudio, {
        volume: 0,
        duration: 2.5,
        ease: 'power2.inOut',
        onComplete: () => {
          prevAudio.pause();
        }
      });
    }

    this.activeTrackUrl = targetUrl;
    this.activeAudio = nextAudio;

    // Fade in the new track
    setTimeout(() => {
      // Ensure it's playing
      const playPromise = nextAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn("Audio play failed (maybe no interaction yet):", e);
        });
      }

      gsap.to(nextAudio, {
        volume: 1.0,
        duration: 3.0,
        ease: 'power2.inOut'
      });
    }, delayMs);
  }
}
