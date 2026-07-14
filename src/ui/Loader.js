import { gsap } from 'gsap';

/**
 * Loader — The entry screen.
 * Displays ĀDI singularity + title. Click to begin.
 * Collapses into a point before revealing the canvas.
 */
export class Loader {
  constructor(onComplete) {
    this.el        = document.getElementById('loader');
    this.hint      = document.getElementById('loader-hint');
    this.scrollHint = document.getElementById('scroll-hint');
    this._started  = false;

    if (!this.el) { onComplete?.(); return; }

    this.el.addEventListener('click', () => {
      if (this._started) return;
      this._started = true;
      this._collapse(onComplete);
    });
  }

  _collapse(onComplete) {
    const singularity = document.getElementById('loader-singularity');
    const title       = document.getElementById('loader-title');
    const sub         = document.getElementById('loader-sub');
    const hint        = this.hint;

    // Collapse sequence
    const tl = gsap.timeline({ onComplete: () => {
      this.el.classList.add('hidden');
      setTimeout(onComplete, 1200);
    }});

    tl.to([title, sub, hint], { opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in' })
      .to(singularity, {
        scale: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.in',
      }, '-=0.2')
      .to(this.el, { opacity: 0, duration: 0.4 }, '-=0.3');

    // Show scroll hint after 2s
    setTimeout(() => {
      if (this.scrollHint) {
        this.scrollHint.classList.add('visible');
        // Hide on first scroll
        const sc = document.getElementById('scroll-container');
        if (sc) {
          sc.addEventListener('scroll', () => {
            this.scrollHint.classList.add('gone');
          }, { once: true, passive: true });
        }
      }
    }, 2000);
  }
}
