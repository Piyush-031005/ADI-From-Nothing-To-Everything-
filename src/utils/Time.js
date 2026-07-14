import { EventBus, EVENTS } from './EventBus.js';

/**
 * Time — Tracks elapsed seconds and delta per frame.
 */
export class Time {
  constructor() {
    this.start = performance.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;
  }

  tick() {
    const now = performance.now();
    this.delta = (now - this.current) / 1000;
    this.elapsed = (now - this.start) / 1000;
    this.current = now;
  }
}

/**
 * Sizes — Tracks viewport dimensions + pixel ratio, emits RESIZE.
 */
export class Sizes {
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.aspect = this.width / this.height;

    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.aspect = this.width / this.height;
      EventBus.emit(EVENTS.RESIZE, { width: this.width, height: this.height, pixelRatio: this.pixelRatio });
    });
  }
}
