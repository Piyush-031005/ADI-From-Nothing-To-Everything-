import * as THREE from 'three';

/**
 * Camera — Physics-based inertia camera.
 * Each era registers a CatmullRomCurve3 path.
 * EraDirector sets the active path; scroll drives t.
 */
export class Camera {
  constructor(experience) {
    this.exp = experience;

    this.instance = new THREE.PerspectiveCamera(
      60,
      experience.sizes.aspect,
      0.01,
      2000
    );
    this.instance.position.set(0, 0, 5);

    // Inertia state
    this._target  = new THREE.Vector3(0, 0, 5);
    this._lookAt  = new THREE.Vector3(0, 0, 0);
    this._lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Active curve for era camera path
    this.curve     = null;
    this.curveT    = 0;     // 0-1 progress along curve
    this.curveTargetT = 0;

    // Mouse parallax
    this._mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      this._mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this._mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  /**
   * Called by EraDirector per era.
   * path: { curve: CatmullRomCurve3, lookAt: CatmullRomCurve3 | THREE.Vector3 }
   */
  setPath(path) {
    this.curve      = path.curve;
    this.lookAtPath = path.lookAt;
    this.curveTargetT = 0;
  }

  /** Called by ScrollController every frame */
  setScrollT(t) {
    this.curveTargetT = t;
  }

  update() {
    const delta = this.exp.time.delta;
    const lerpSpeed = 1.0 - Math.pow(0.001, delta);   // ~5 frames

    // Lerp curve t
    this.curveT += (this.curveTargetT - this.curveT) * lerpSpeed;

    if (this.curve) {
      // Sample position from camera curve
      const pos = this.curve.getPoint(Math.min(this.curveT, 1.0));
      this._target.copy(pos);

      // Sample look-at
      if (this.lookAtPath && this.lookAtPath.isLine3) {
        const la = this.lookAtPath.getPoint(Math.min(this.curveT, 1.0));
        this._lookAtTarget.copy(la);
      } else if (this.lookAtPath instanceof THREE.Vector3) {
        this._lookAtTarget.copy(this.lookAtPath);
      }
    }

    // Parallax
    const parallax = 0.2;
    this._target.x += this._mouse.x * parallax;
    this._target.y -= this._mouse.y * parallax;

    // Lerp position
    this.instance.position.lerp(this._target, lerpSpeed * 0.6);
    this._lookAt.lerp(this._lookAtTarget, lerpSpeed * 0.4);
    this.instance.lookAt(this._lookAt);
  }

  /** Instant teleport (no lerp) */
  teleport(pos, lookAt) {
    this.instance.position.copy(pos);
    this._target.copy(pos);
    if (lookAt) {
      this._lookAt.copy(lookAt);
      this._lookAtTarget.copy(lookAt);
    }
  }

  resize() {
    this.instance.aspect = this.exp.sizes.aspect;
    this.instance.updateProjectionMatrix();
  }
}
