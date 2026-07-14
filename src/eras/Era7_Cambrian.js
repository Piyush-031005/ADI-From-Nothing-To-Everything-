import * as THREE from 'three';

/**
 * Era 7 — CAMBRIAN EXPLOSION
 * Cinematic backdrop with pure volumetric realism.
 */
export class Era7_Cambrian {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildCinematicBackground();
    this._buildRain();
    this._buildBioSwarm();
  }

  _buildCinematicBackground() {
    const texLoader = new THREE.TextureLoader();
    const tex = texLoader.load('/assets/cambrian.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    
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

  _buildRain() {
    const count = 15000;
    const pos   = new Float32Array(count * 3);
    const vel   = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 40;
      pos[i*3+1] = Math.random() * 20;
      pos[i*3+2] = (Math.random() - 0.5) * 40;
      vel[i]     = 0.05 + Math.random() * 0.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xaaddff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rain     = new THREE.Points(geo, mat);
    this.rainVel  = vel;
    this.rainPos  = pos;
    this.rain.visible = false;
    this.exp.scene.add(this.rain);
  }

  _buildBioSwarm() {
    const count = 5000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 15;
      pos[i*3+1] = -1 + Math.random() * 6;
      pos[i*3+2] = (Math.random() - 0.5) * 15;
      const c = new THREE.Color().setHSL(Math.random() * 0.3 + 0.3, 1, 0.7);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.swarm = new THREE.Points(geo, mat);
    this.swarm.visible = false;
    this.exp.scene.add(this.swarm);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3, 12),
      new THREE.Vector3(3, 1, 8),
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(-2, 1, 2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.backdrop.visible = true;
    this.rain.visible   = true;
    this.swarm.visible  = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.backdrop.material.opacity = t * 1.0;
      this.rain.material.opacity  = t * 0.35;
      this.swarm.material.opacity = t * 0.7;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.backdrop.material.opacity = 1.0 * f;
      this.rain.material.opacity  = 0.35 * f;
      this.swarm.material.opacity = 0.7 * f;
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.backdrop.visible = false;
        this.rain.visible = false;
        this.swarm.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.backdrop.rotation.y = t * 0.3;
  }

  update(time) {
    if (!this.visible) return;
    const pos = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < this.rainVel.length; i++) {
      pos[i*3+1] -= this.rainVel[i];
      if (pos[i*3+1] < -3) pos[i*3+1] = 20;
    }
    this.rain.geometry.attributes.position.needsUpdate = true;

    this.swarm.rotation.y = time * 0.1;
    this.swarm.position.y = Math.sin(time * 0.3) * 0.5;
  }
}
