/**
 * Loader — Handles the Interstellar-style cinematic intro sequence.
 */
export class Loader {
  constructor(onComplete) {
    this.container = document.getElementById('loader');
    this.hint = document.getElementById('loader-hint');
    this.sequence = document.getElementById('loader-sequence');
    this.textNodes = this.sequence ? this.sequence.querySelectorAll('p') : [];
    
    this.onComplete = onComplete;
    this.clicked = false;

    // Show initial hint to click
    this.hint.style.opacity = '1';

    this.container.addEventListener('click', () => {
      if (this.clicked) return;
      this.clicked = true;
      
      // Hide hint, start sequence
      this.hint.style.opacity = '0';
      this.startCinematicSequence();
    });
  }

  startCinematicSequence() {
    let delay = 0;
    
    // Fade each sentence in and out sequentially
    this.textNodes.forEach((node, index) => {
      setTimeout(() => {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0) scale(1)';
      }, delay);
      
      delay += 3000; // Visible for 3 seconds
      
      setTimeout(() => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(-10px) scale(0.98)';
      }, delay);
      
      delay += 1000; // 1 second gap before next sentence
    });

    // After the sequence finishes, remove loader and boot the experience
    setTimeout(() => {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.remove();
        this.onComplete();
      }, 1000); // fade out duration
    }, delay + 500);
  }
}
