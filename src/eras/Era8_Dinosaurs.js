import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS
 * Procedural terrain. Dino silhouettes. Meteor. Impact. Darkness.
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildTerrain();
    this._buildDinos();
    this._buildMeteor();
    this._buildSky();
    this._impactTriggered = false;
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(80, 80, 64, 64);
    const pos = geo.attributes.position.array;

    // Simple height-map via sine layers
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i+2];
      pos[i+1] = Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.5
               + Math.sin(x * 0.3 + 1.2) * 0.5
               + Math.sin(z * 0.25) * 0.8;
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d4a1e,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.rotation.x = -Math.PI * 0.5;
    this.terrain.position.y = -2;
    this.terrain.visible = false;
    this.exp.scene.add(this.terrain);

    // Ambient light for terrain
    this.ambientLight = new THREE.AmbientLight(0x223300, 1.5);
    this.exp.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffe0a0, 2.0);
    this.sunLight.position.set(10, 15, 5);
    this.exp.scene.add(this.sunLight);
  }

  _buildDinos() {
    this.dinos = new THREE.Group();

    // Abstract dino silhouettes: body (ellipsoid) + neck + head
    const dinoColor = 0x1a2e0a;
    const makeBody = () => {
      const g = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshBasicMaterial({ color: dinoColor, transparent: true, opacity: 0 })
      );
      body.scale.set(1.5, 0.8, 1.0);
      g.add(body);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6),
        new THREE.MeshBasicMaterial({ color: dinoColor, transparent: true, opacity: 0 })
      );
      neck.position.set(0.8, 0.6, 0);
      neck.rotation.z = -0.4;
      g.add(neck);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 6, 6),
        new THREE.MeshBasicMaterial({ color: dinoColor, transparent: true, opacity: 0 })
      );
      head.position.set(1.3, 1.2, 0);
      g.add(head);

      return g;
    };

    for (let i = 0; i < 6; i++) {
      const dino = makeBody();
      const angle = (i / 6) * Math.PI * 2;
      dino.position.set(Math.cos(angle) * 8, -1, Math.sin(angle) * 8);
      dino.scale.setScalar(0.8 + Math.random() * 1.2);
      dino.rotation.y = -angle + Math.PI;
      this.dinos.add(dino);
    }

    this.dinos.visible = false;
    this.exp.scene.add(this.dinos);
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

  _buildSky() {
    // Simple sky sphere gradient
    const geo = new THREE.SphereGeometry(100, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a3a0a,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.visible = false;
    this.exp.scene.add(this.sky);
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
    this.terrain.visible = true;
    this.dinos.visible   = true;
    this.meteorGroup.visible = true;
    this.sky.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.terrain.material.opacity = t * 0.95;
      this.sky.material.opacity = t * 0.9;
      // All dino parts
      this.dinos.children.forEach(dino => {
        dino.children.forEach(part => part.material.opacity = t * 0.9);
      });
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
      this.terrain.material.opacity = 0.95 * f;
      this.sky.material.opacity = 0.9 * f;
      this.dinos.children.forEach(dino => {
        dino.children.forEach(part => part.material.opacity = 0.9 * f);
      });
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.terrain.visible = false;
        this.dinos.visible = false;
        this.meteorGroup.visible = false;
        this.sky.visible = false;
        this.impactFlash.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
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
      this.sky.material.color.setRGB(darkness * 0.02, 0, 0);
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
    // Dinos sway slightly
    this.dinos.children.forEach((d, i) => {
      d.position.y = -1 + Math.sin(time * 0.5 + i * 1.2) * 0.1;
    });
  }
}
