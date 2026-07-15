import { gsap } from 'gsap';

/**
 * EraTitle — Cinematic era name display, center-screen.
 * Fades in on era change, fades out after 2.5s.
 */
export class EraTitle {
  constructor() {
    this.title    = document.getElementById('era-title');
    this.subtitle = document.getElementById('era-subtitle');
    this.display  = document.getElementById('era-display');
    this._timer   = null;
  }

  setEra(data) {
    if (!this.display) return;
    if (this._timer) clearTimeout(this._timer);

    // Kill any running tweens
    gsap.killTweensOf(this.display);

    // Update content
    this.title.textContent    = data.name;
    this.subtitle.textContent = data.sub;

    // Fade in
    gsap.fromTo(this.display,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Auto fade out after 2.5s
    this._timer = setTimeout(() => {
      gsap.to(this.display, { opacity: 0, y: -10, duration: 0.6, ease: 'power2.in' });
    }, 2500);
  }
}
