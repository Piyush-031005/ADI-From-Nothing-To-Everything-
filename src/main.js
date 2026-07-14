/**
 * ĀDI — From Nothing. To Everything.
 * Main entry point. Boots loader → waits for click → starts Experience.
 */

import { Experience } from './Experience.js';
import { Loader }     from './ui/Loader.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));

// Boot: show loader, wait for user click, then start the 3D experience
new Loader(() => {
  // User clicked. Birth the universe.
  new Experience(canvas);
});
