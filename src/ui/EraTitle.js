import { gsap } from 'gsap';

/**
 * EraTitle — Scientific Data Readout for the HUD.
 */
export class EraTitle {
  constructor() {
    this.number   = document.getElementById('era-number');
    this.title    = document.getElementById('era-title');
    this.subtitle = document.getElementById('era-subtitle');
    this.hexcode  = document.getElementById('era-hexcode');
    this.display  = document.getElementById('era-display');
  }

  setEra(data) {
    if (!this.display) return;

    // Kill any running tweens
    gsap.killTweensOf(this.display);

    // Update content
    this.number.textContent   = `RECORD: 0${data.index}`;
    this.title.textContent    = data.name;
    this.subtitle.textContent = data.sub;
    
    // Generate a pseudo-random hexcode for the tech look based on index
    const colors = ['#000000', '#FF3366', '#00FFFF', '#CCCC33', '#6699FF', '#FF9900', '#00FF99', '#CC33FF', '#FF0033', '#00CCFF', '#99FF00', '#FFFFFF'];
    this.hexcode.textContent  = colors[data.index] || '#FFFFFF';
    this.hexcode.style.color  = colors[data.index] || '#FFFFFF';

    // Glitch in
    gsap.fromTo(this.display,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'steps(4)' }
    );
  }
}
