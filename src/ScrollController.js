import { EventBus, EVENTS } from './utils/EventBus.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ERA_COUNT = 12; // 0-11

/**
 * ScrollController — Maps scroll progress → era index + within-era t.
 * Implements lerp (linear interpolation) for buttery smooth camera movement.
 */
export class ScrollController {
  constructor(experience) {
    this.exp         = experience;
    this.totalScroll = 0;
    
    this.targetProgress = 0; // Where the scrollbar is
    this.progress       = 0; // Lerped value
    
    this.eraIndex    = 0;
    this.eraT        = 0;   // 0-1 within era

    const container = document.getElementById('scroll-container');
    if (!container) return;

    container.addEventListener('scroll', () => this._onScroll(container), { passive: true });
    
    // Start lerp loop
    this._lerpLoop();
  }

  _onScroll(container) {
    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (maxScroll <= 0) return;
    this.targetProgress = Math.min(scrollTop / maxScroll, 1.0);
  }
  
  _lerpLoop() {
    // Lerp towards target (0.05 is the smoothing factor)
    this.progress += (this.targetProgress - this.progress) * 0.05;
    
    // Map to era
    const eraFloat = this.progress * ERA_COUNT;
    const newEra   = Math.min(Math.floor(eraFloat), ERA_COUNT - 1);
    this.eraT      = eraFloat - newEra;

    // Camera curve t (0-1 within era)
    this.exp.camera.setScrollT(this.eraT);

    // Emit scroll progress every frame
    EventBus.emit(EVENTS.SCROLL_PROGRESS, {
      progress: this.progress,
      eraIndex: newEra,
      eraT:     this.eraT,
    });

    // Era change
    if (newEra !== this.eraIndex) {
      this.eraIndex = newEra;
      EventBus.emit(EVENTS.ERA_CHANGE, { index: newEra, t: this.eraT });
    }
    
    requestAnimationFrame(() => this._lerpLoop());
  }
}
