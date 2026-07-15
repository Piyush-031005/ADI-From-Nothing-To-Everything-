/**
 * Loader — Handles the clean, minimal intro.
 */
import { audioEngine } from '../audio/AudioEngine.js';

export class Loader {
  constructor(onComplete) {
    this.container = document.getElementById('loader');
    this.onComplete = onComplete;
    this.clicked = false;

    this.container.addEventListener('click', () => {
      if (this.clicked) return;
      this.clicked = true;
      
      // Unlock AudioEngine synchronously on user click
      audioEngine._init();
      
      // Clean fade out
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.remove();
        this.onComplete();
      }, 1500);
    });
  }
}
