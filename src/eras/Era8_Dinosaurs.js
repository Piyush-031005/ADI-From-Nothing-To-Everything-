import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS
 * Cinematic prehistoric backdrop. Meteor impact. Darkness.
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildCinematicBackground();
    this._buildMeteor();
    this._impactTriggered = false;
  }

  _buildCinematicBackground() {
    const texLoader = new THREE.TextureLoader();
    const tex = texLoader.load('/assets/dinosaur.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    
    // Create a massive cinematic cylinder backdrop
    const geo = new THREE.CylinderGeometry(40, 40, 30, 64, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    
    this.backdrop = new THREE.Mesh(geo, mat);
    this.backdrop.position.set(0, 5, 0);
    this.backdrop.visible = false;
    this.exp.scene.add(this.backdrop);
  }

  _buildMeteor() {
    // Bright sphere streaking across sky
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    this.meteor = new THREE.Mesh(geo, mat);
    this.meteor.position.set(20, 15, -20);

    // Trail particles
    const trailCount = 500;
    const trailPos   = new Float32Array(trailCount * 3);
    const trailGeo   = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(trailPos, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xff8800,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.meteorTrail = new THREE.Points(trailGeo, trailMat);

    this.meteorGroup = new THREE.Group();
    this.meteorGroup.add(this.meteor, this.meteorTrail);
    this.meteorGroup.visible = false;
    this.exp.scene.add(this.meteorGroup);

    // Impact flash sphere
    const flashGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.impactFlash = new THREE.Mesh(flashGeo, flashMat);
    this.impactFlash.position.set(0, -1.5, 0);
    this.impactFlash.visible = false;
    this.exp.scene.add(this.impactFlash);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 18),
      new THREE.Vector3(5, 2, 12),
      new THREE.Vector3(0, 1, 6),
      new THREE.Vector3(0, 0.5, 3),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.backdrop.visible = true;
    this.meteorGroup.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.backdrop.material.opacity = t * 1.0;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.8) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.backdrop.material.opacity = 1.0 * f;
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.backdrop.visible = false;
        this.meteorGroup.visible = false;
        this.impactFlash.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.backdrop.rotation.y = t * 0.3;

    // Meteor appears at t>0.5, impacts at t=0.85
    if (t > 0.5) {
      const meteorT = (t - 0.5) / 0.35;
      this.meteor.material.opacity = Math.min(meteorT, 1.0);
      this.meteorTrail.material.opacity = Math.min(meteorT * 0.8, 0.8);

      // Animate meteor position
      this.meteor.position.set(
        20 - meteorT * 20,
        15 - meteorT * 16.5,
        -20 + meteorT * 20
      );
    }

    // Impact at t=0.85
    if (t > 0.85 && !this._impactTriggered) {
      this._impactTriggered = true;
      this._triggerImpact();
    }

    // Darkness closes in post-impact
    if (t > 0.9) {
      const darkness = (t - 0.9) / 0.1;
      this.backdrop.material.color.setRGB(1.0 - darkness, 1.0 - darkness, 1.0 - darkness);
    } else {
      this.backdrop.material.color.setHex(0xffffff);
    }
  }

  _triggerImpact() {
    this.impactFlash.visible = true;
    const mat = this.impactFlash.material;
    mat.opacity = 1;
    const start = performance.now();
    const dur = 1500;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      this.impactFlash.scale.setScalar(1 + t * 80);
      mat.opacity = 1 - t;
      if (t < 1) requestAnimationFrame(tick);
      else this.impactFlash.visible = false;
    };
    requestAnimationFrame(tick);
  }

  update(time) {
    if (!this.visible) return;
  }
}
