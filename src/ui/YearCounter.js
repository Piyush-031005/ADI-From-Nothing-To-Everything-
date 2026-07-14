/**
 * YearCounter — Top-right display showing the cosmological time.
 * Interpolates between era year labels.
 */
const YEAR_LABELS = [
  '∞ Before',
  '13.8 Billion Years Ago',
  '13.8 Billion Years Ago',
  '13.6 Billion Years Ago',
  '4.6 Billion Years Ago',
  '4.4 Billion Years Ago',
  '3.8 Billion Years Ago',
  '540 Million Years Ago',
  '230 Million Years Ago',
  '300,000 Years Ago',
  '∞ Ahead',
];

export class YearCounter {
  constructor() {
    this.el      = document.getElementById('year-value');
    this.counter = document.getElementById('year-counter');
    this.brand   = document.getElementById('brand');

    // Show brand + counter after loader exits
    setTimeout(() => {
      if (this.counter) this.counter.classList.add('visible');
      if (this.brand)   this.brand.classList.add('visible');
    }, 3000);
  }

  setEra(index, t) {
    if (!this.el) return;
    this.el.textContent = YEAR_LABELS[index] || '';
  }
}
