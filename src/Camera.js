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

    // Mouse parallax and manual orbit
    this._mouse = { x: 0, y: 0 };
    this._orbitAngle = { x: 0, y: 0 };
    this._isDragging = false;
    this._lastMouse = { x: 0, y: 0 };

    window.addEventListener('mousedown', e => {
      this._isDragging = true;
      this._lastMouse.x = e.clientX;
      this._lastMouse.y = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      // Parallax
      this._mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this._mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;

      // Orbit drag
      if (this._isDragging) {
        const dx = e.clientX - this._lastMouse.x;
        const dy = e.clientY - this._lastMouse.y;
        this._orbitAngle.x -= dx * 0.005;
        this._orbitAngle.y += dy * 0.005;
        
        // Clamp vertical orbit
        this._orbitAngle.y = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this._orbitAngle.y));
        
        this._lastMouse.x = e.clientX;
        this._lastMouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => this._isDragging = false);
  }

  /**
   * Called by EraDirector per era.
   * path: { curve: CatmullRomCurve3, lookAt: CatmullRomCurve3 | THREE.Vector3 }
   */
  setPath(path) {
    this.curve      = path.curve;
    this.lookAtPath = path.lookAt;
    this.curveTargetT = 0;
    this.curveT = 0;
  }

  /** Called by ScrollController every frame */
  setScrollT(t) {
    this.curveTargetT = t;
  }

  update() {
    const delta = this.exp.time.delta;
    
    // Smooth curve progress
    const curveLerp = 1.0 - Math.pow(0.05, delta);
    this.curveT += (this.curveTargetT - this.curveT) * curveLerp;

    if (this.curve) {
      // Sample look-at first
      if (this.lookAtPath && this.lookAtPath.isLine3) {
        const la = this.lookAtPath.getPoint(Math.min(this.curveT, 1.0));
        this._lookAtTarget.copy(la);
      } else if (this.lookAtPath instanceof THREE.Vector3) {
        this._lookAtTarget.copy(this.lookAtPath);
      }

      // Sample position from camera curve
      const basePos = this.curve.getPoint(Math.min(this.curveT, 1.0));
      
      // Calculate distance and base direction from target
      const radius = basePos.distanceTo(this._lookAtTarget);
      
      // Add manual orbit offset
      const curveDir = basePos.clone().sub(this._lookAtTarget).normalize();
      
      // Apply user drag rotation
      const euler = new THREE.Euler(this._orbitAngle.y, this._orbitAngle.x, 0, 'YXZ');
      curveDir.applyEuler(euler);
      
      // Final target position
      const finalPos = this._lookAtTarget.clone().add(curveDir.multiplyScalar(radius));
      this._target.copy(finalPos);
    }

    // Cinematic Parallax & Drone tilt
    const parallaxX = this._mouse.x * 0.5;
    const parallaxY = -this._mouse.y * 0.3;
    
    this._target.x += parallaxX;
    this._target.y += parallaxY;

    // Smoother lerp for position and lookAt
    const posLerp = 1.0 - Math.pow(0.005, delta);
    const lookLerp = 1.0 - Math.pow(0.001, delta);

    this.instance.position.lerp(this._target, posLerp);
    this._lookAt.lerp(this._lookAtTarget, lookLerp);
    this.instance.lookAt(this._lookAt);

    // Apply tilt (roll) based on mouse X for a spaceship/drone feel
    const targetRoll = -this._mouse.x * 0.05;
    this.instance.rotation.z += (targetRoll - this.instance.rotation.z) * posLerp;
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
