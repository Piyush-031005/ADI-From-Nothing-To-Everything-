/**
 * Loader — Handles the clean, minimal intro.
 */
export class Loader {
  constructor(onComplete) {
    this.container = document.getElementById('loader');
    this.onComplete = onComplete;
    this.clicked = false;

    this.container.addEventListener('click', () => {
      if (this.clicked) return;
      this.clicked = true;
      
      // Clean fade out
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.remove();
        this.onComplete();
      }, 1500);
    });
  }
}
