import * as THREE from 'three';

/**
 * Era 7 — CAMBRIAN EXPLOSION
 * Crystal forest. Bioluminescent. Rain. Massive insects.
 */
export class Era7_Cambrian {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildCrystalForest();
    this._buildRain();
    this._buildBioSwarm();
    this._buildGround();
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(60, 60, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0a1f0a,
      transparent: true,
      opacity: 0,
    });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI * 0.5;
    this.ground.position.y = -3;
    this.ground.visible = false;
    this.exp.scene.add(this.ground);
  }

  _buildCrystalForest() {
    this.forest = new THREE.Group();

    const count = 120;
    for (let i = 0; i < count; i++) {
      const height  = 1 + Math.random() * 6;
      const geo     = new THREE.ConeGeometry(0.08 + Math.random() * 0.15, height, 5 + Math.floor(Math.random() * 4));
      const hue     = Math.random() > 0.5 ? '#4ade80' : (Math.random() > 0.5 ? '#a78bfa' : '#38bdf8');
      const mat     = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hue),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        wireframe: Math.random() > 0.6,
      });

      const crystal = new THREE.Mesh(geo, mat);
      const angle = Math.random() * Math.PI * 2;
      const r     = 1 + Math.random() * 20;
      crystal.position.set(
        Math.cos(angle) * r,
        -3 + height * 0.5,
        Math.sin(angle) * r - 5
      );
      crystal.rotation.y = Math.random() * Math.PI;
      crystal.rotation.z = (Math.random() - 0.5) * 0.1;

      // Emissive tip glow
      const tipGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const tipMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hue),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
      });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.y = height * 0.5;
      crystal.add(tip);

      this.forest.add(crystal);
    }

    this.forest.visible = false;
    this.exp.scene.add(this.forest);
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
    // Insect swarm as particles
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
    this.forest.visible = true;
    this.rain.visible   = true;
    this.swarm.visible  = true;
    this.ground.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.forest.children.forEach(c => {
        c.material.opacity = t * 0.8;
        c.children.forEach(ch => ch.material.opacity = t * 0.9);
      });
      this.rain.material.opacity  = t * 0.35;
      this.swarm.material.opacity = t * 0.7;
      this.ground.material.opacity = t * 0.9;
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
      this.forest.children.forEach(c => {
        c.material.opacity = 0.8 * f;
        c.children.forEach(ch => ch.material.opacity = 0.9 * f);
      });
      this.rain.material.opacity  = 0.35 * f;
      this.swarm.material.opacity = 0.7 * f;
      this.ground.material.opacity = 0.9 * f;
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.forest.visible = false;
        this.rain.visible = false;
        this.swarm.visible = false;
        this.ground.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Camera flies lower through forest
    this.forest.rotation.y = t * 0.3;
  }

  update(time) {
    if (!this.visible) return;

    // Rain falls and loops
    const pos = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < this.rainVel.length; i++) {
      pos[i*3+1] -= this.rainVel[i];
      if (pos[i*3+1] < -3) pos[i*3+1] = 20;
    }
    this.rain.geometry.attributes.position.needsUpdate = true;

    // Crystal tips pulse
    this.forest.children.forEach((c, i) => {
      if (c.children[0]) {
        c.children[0].material.opacity = 0.6 + Math.sin(time * 2 + i * 0.5) * 0.4;
      }
    });

    // Swarm flocking
    this.swarm.rotation.y = time * 0.1;
    this.swarm.position.y = Math.sin(time * 0.3) * 0.5;
  }
}
