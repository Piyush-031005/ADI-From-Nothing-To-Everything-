import { ERA_DATA } from '../eras/EraDirector.js';

/**
 * Timeline — Bottom strip with 10 era dots + connecting lines.
 * Active dot glows, passed dots dimmer, lines fill.
 */
export class Timeline {
  constructor(eraData) {
    this.container = document.getElementById('timeline');
    if (!this.container) return;

    this.dots  = [];
    this.lines = [];
    this._build(eraData);
  }

  _build(eraData) {
    eraData.forEach((era, i) => {
      // Dot
      const dot = document.createElement('div');
      dot.className = 'tl-dot';
      dot.dataset.label = era.name;
      dot.title = era.name;
      this.container.appendChild(dot);
      this.dots.push(dot);

      // Connecting line (not after last dot)
      if (i < eraData.length - 1) {
        const line = document.createElement('div');
        line.className = 'tl-line';
        const fill = document.createElement('div');
        fill.className = 'tl-line-fill';
        line.appendChild(fill);
        this.container.appendChild(line);
        this.lines.push(fill);
      }
    });
  }

  setActive(index) {
    this.dots.forEach((d, i) => {
      d.classList.remove('active', 'passed');
      if (i < index)       d.classList.add('passed');
      else if (i === index) d.classList.add('active');
    });
  }

  setProgress(eraIndex, eraT) {
    // Fill the line of the current era
    this.lines.forEach((fill, i) => {
      if (i < eraIndex)       fill.style.width = '100%';
      else if (i === eraIndex) fill.style.width = `${eraT * 100}%`;
      else                    fill.style.width = '0%';
    });
  }
}
