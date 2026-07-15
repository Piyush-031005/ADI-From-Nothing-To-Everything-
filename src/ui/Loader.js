/**
 * Loader — Handles the Marvel-style CSS mask zoom intro sequence.
 */
export class Loader {
  constructor(onComplete) {
    this.container = document.getElementById('loader');
    this.hint = document.getElementById('loader-hint');
    this.textMask = document.getElementById('loader-text-mask');
    this.cosmicBg = document.getElementById('loader-cosmic-bg');
    
    this.onComplete = onComplete;
    this.clicked = false;

    this.container.addEventListener('click', () => {
      if (this.clicked) return;
      this.clicked = true;
      
      // Hide hint
      this.hint.style.opacity = '0';
      this.startMarvelIntro();
    });
  }

  startMarvelIntro() {
    // 1. Zoom the text massively so the user flies "through" the letter A or D.
    // Scale to 50x to ensure the camera goes completely through the transparent part of the mask.
    this.textMask.style.transform = 'scale(50)';
    
    // 2. Fade out the text mask container completely after zooming
    this.textMask.style.opacity = '0';
    
    // 3. Fade out the background layer
    this.cosmicBg.style.opacity = '0';
    
    // 4. After the transition finishes (3 seconds), boot the experience
    setTimeout(() => {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.remove();
        this.onComplete();
      }, 500); // fade out duration of the black loader screen itself
    }, 2500);
  }
}
