import * as THREE from 'three';
import { gsap } from 'gsap';
import { EventBus, EVENTS } from '../utils/EventBus.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { Timeline } from '../ui/Timeline.js';
import { EraTitle } from '../ui/EraTitle.js';
import { YearCounter } from '../ui/YearCounter.js';

import { Era0_Void }       from './Era0_Void.js';
import { Era1_Singularity} from './Era1_Singularity.js';
import { Era2_BigBang }    from './Era2_BigBang.js';
import { Era3_Stars }      from './Era3_Stars.js';
import { Era4_SolarSystem} from './Era4_SolarSystem.js';
import { Era5_Earth }      from './Era5_Earth.js';
import { Era6_Life }       from './Era6_Life.js';
import { Era7_Cambrian }   from './Era7_Cambrian.js';
import { Era8_Dinosaurs }  from './Era8_Dinosaurs.js';
import { Era9_Humans }     from './Era9_Humans.js';
import { Era10_Future }    from './Era10_Future.js';

export const ERA_DATA = [
  { index: 0,  name: 'THE VOID',        sub: 'Before time. Before space.',            year: '∞ Before',   color: '#ffffff' },
  { index: 1,  name: 'SINGULARITY',     sub: 'Everything. Compressed to a point.',    year: '13.8 BYA',   color: '#c8a96e' },
  { index: 2,  name: 'THE BIG BANG',    sub: 'The universe. Born in a single instant.',year: '13.8 BYA',   color: '#ff6b35' },
  { index: 3,  name: 'FIRST STARS',     sub: 'Hydrogen collapses. Light ignites.',    year: '13.6 BYA',   color: '#7b8cde' },
  { index: 4,  name: 'SOLAR SYSTEM',    sub: 'Dust gathers. A star is born.',         year: '4.6 BYA',    color: '#e8923a' },
  { index: 5,  name: 'EARTH',           sub: 'Water. Oceans. The cradle of life.',    year: '4.4 BYA',    color: '#4a9eff' },
  { index: 6,  name: 'FIRST LIFE',      sub: 'From the ocean. A single cell awakens.',year: '3.8 BYA',    color: '#4ade80' },
  { index: 7,  name: 'CAMBRIAN',        sub: 'Life explodes into complexity.',        year: '540 MYA',    color: '#86efac' },
  { index: 8,  name: 'DINOSAURS',       sub: 'Giants rule. Until fire falls from sky.',year: '230 MYA',   color: '#fbbf24' },
  { index: 9,  name: 'HUMANS',          sub: 'Curiosity. Fire. Cities. Stars.',       year: '300,000 YA', color: '#f0abfc' },
  { index: 10, name: 'FUTURE',          sub: 'Unknown. Unimagined. Yours.',           year: '∞ Ahead',    color: '#a855f7' },
];

/**
 * EraDirector — Central coordinator for all eras.
 * Listens to ERA_CHANGE, fades eras in/out, updates UI.
 */
export class EraDirector {
  constructor(experience) {
    this.exp = experience;
    this.currentEra = null;
    this.currentIndex = -1;

    // UI systems
    this.timeline = new Timeline(ERA_DATA);
    this.eraTitle = new EraTitle();
    this.yearCounter = new YearCounter();
    this.audio = new AudioEngine();

    // Build all eras
    this.eras = [
      new Era0_Void(experience),
      new Era1_Singularity(experience),
      new Era2_BigBang(experience),
      new Era3_Stars(experience),
      new Era4_SolarSystem(experience),
      new Era5_Earth(experience),
      new Era6_Life(experience),
      new Era7_Cambrian(experience),
      new Era8_Dinosaurs(experience),
      new Era9_Humans(experience),
      new Era10_Future(experience),
    ];

    // Hide all eras initially
    this.eras.forEach(e => e.hide(0));

    // Start at era 0
    this._transitionTo(0);

    EventBus.on(EVENTS.ERA_CHANGE, ({ index }) => {
      if (index !== this.currentIndex) {
        this._transitionTo(index);
      }
    });

    EventBus.on(EVENTS.SCROLL_PROGRESS, ({ eraIndex, eraT }) => {
      if (this.currentEra) this.currentEra.onScrollT(eraT);
      this.exp.camera.setScrollT(eraT);
      this.timeline.setProgress(eraIndex, eraT);
      this.yearCounter.setEra(eraIndex, eraT);
    });
  }

  _transitionTo(index) {
    if (index === this.currentIndex) return;

    const outEra = this.currentEra;
    const inEra  = this.eras[index];
    const data   = ERA_DATA[index];

    this.currentIndex = index;
    this.currentEra   = inEra;

    // Fade out old
    if (outEra) outEra.hide(0.6);

    // Set camera path
    const path = inEra.getCameraPath();
    if (path) this.exp.camera.setPath(path);

    // Fade in new (staggered)
    setTimeout(() => {
      inEra.show(0.8);
    }, outEra ? 300 : 0);

    // Update UI
    this.eraTitle.setEra(data);
    this.timeline.setActive(index);
    this.audio.setEra(index);

    // Special: big bang flash
    if (index === 2) {
      setTimeout(() => {
        this.exp.renderer.flash(1.0);
      }, 100);
    }

    // Final message
    const finalMsg = document.getElementById('final-message');
    if (finalMsg) {
      finalMsg.classList.toggle('visible', index === 10);
    }
  }

  update() {
    const time = this.exp.time.elapsed;
    this.eras.forEach(era => era.update(time));
  }
}
