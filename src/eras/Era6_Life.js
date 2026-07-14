import * as THREE from 'three';

/**
 * Era 6 — FIRST LIFE
 * Underwater bioluminescent world. DNA helix. Cell division.
 */
export class Era6_Life {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildOceanFog();
    this._buildBioluminescent();
    this._buildDNAHelix();
    this._buildCells();
  }

  _buildOceanFog() {
    // Full-screen underwater ambient color
    this.exp.scene.background = null;
    this.fogColor = new THREE.Color('#001f3f');

    // Large sphere to represent deep ocean volume
    const geo = new THREE.SphereGeometry(50, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x001428,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.oceanVolume = new THREE.Mesh(geo, mat);
    this.oceanVolume.visible = false;
    this.exp.scene.add(this.oceanVolume);
  }

  _buildBioluminescent() {
    const count = 40000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color('#00ffcc'),
      new THREE.Color('#4ade80'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#f0abfc'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 30;
      pos[i*3+1] = (Math.random() - 0.5) * 20;
      pos[i*3+2] = (Math.random() - 0.5) * 30;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3]   = c.r;
      col[i*3+1] = c.g;
      col[i*3+2] = c.b;
      sizes[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.bio = new THREE.Points(geo, mat);
    this.bio.visible = false;
    this.exp.scene.add(this.bio);

    // Also add to glow scene for bloom
    const bioGlow = this.bio.clone();
    bioGlow.material = mat.clone();
    bioGlow.material.size = 0.15;
    bioGlow.material.opacity = 0;
    this.bioGlow = bioGlow;
    this.exp.glowScene.add(this.bioGlow);
  }

  _buildDNAHelix() {
    this.dna = new THREE.Group();

    const turns  = 8;
    const height = 8;
    const radius = 0.6;
    const steps  = 200;

    const strand1Pos = [];
    const strand2Pos = [];

    for (let i = 0; i <= steps; i++) {
      const t     = i / steps;
      const angle = t * turns * Math.PI * 2;
      const y     = (t - 0.5) * height;

      strand1Pos.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      strand2Pos.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
    }

    const makeTube = (points, color) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo   = new THREE.TubeGeometry(curve, steps, 0.04, 6, false);
      const mat   = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Mesh(geo, mat);
    };

    this.dnaStrand1 = makeTube(strand1Pos, 0x00ffcc);
    this.dnaStrand2 = makeTube(strand2Pos, 0xa78bfa);
    this.dna.add(this.dnaStrand1, this.dnaStrand2);

    // Base pairs (rungs)
    for (let i = 0; i < steps; i += 12) {
      const p1 = strand1Pos[i];
      const p2 = strand2Pos[i];
      const dir = p2.clone().sub(p1);
      const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, dir.length(), 4);
      const rungMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.copy(p1.clone().add(p2).multiplyScalar(0.5));
      rung.lookAt(p2);
      rung.rotateX(Math.PI * 0.5);
      this.dna.add(rung);
      this.dnaRungs = this.dnaRungs || [];
      this.dnaRungs.push(rungMat);
    }

    this.dna.visible = false;
    this.exp.scene.add(this.dna);
  }

  _buildCells() {
    // Simple cell division: one sphere → two → four
    this.cells = new THREE.Group();
    const cellGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const cellMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
    });

    for (let i = 0; i < 8; i++) {
      const cell = new THREE.Mesh(cellGeo, cellMat.clone());
      cell.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 4
      );
      this.cells.add(cell);
    }
    this.cells.visible = false;
    this.exp.scene.add(this.cells);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -2, 8),
      new THREE.Vector3(2,  0, 5),
      new THREE.Vector3(0,  1, 3),
      new THREE.Vector3(-1, 0, 2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.oceanVolume.visible = true;
    this.bio.visible = true;
    this.bioGlow.visible = true;
    this.dna.visible = true;
    this.cells.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bio.material.opacity = t * 0.7;
      this.bioGlow.material.opacity = t * 0.3;
      this.oceanVolume.material.opacity = t * 0.6;
      this.dnaStrand1.material.opacity = t * 0.9;
      this.dnaStrand2.material.opacity = t * 0.9;
      this.dnaRungs?.forEach(m => m.opacity = t * 0.5);
      this.cells.children.forEach(c => c.material.opacity = t * 0.6);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const bioOp = this.bio.material.opacity;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.bio.material.opacity = bioOp * f;
      this.bioGlow.material.opacity = 0.3 * f;
      this.oceanVolume.material.opacity = 0.6 * f;
      this.dnaStrand1.material.opacity = 0.9 * f;
      this.dnaStrand2.material.opacity = 0.9 * f;
      this.dnaRungs?.forEach(m => m.opacity = 0.5 * f);
      this.cells.children.forEach(c => c.material.opacity = 0.6 * f);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.bio.visible = false;
        this.bioGlow.visible = false;
        this.oceanVolume.visible = false;
        this.dna.visible = false;
        this.cells.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // DNA helix reveals progressively
    this.dna.rotation.y = t * Math.PI * 4;
    // Cells multiply (scale)
    this.cells.children.forEach((c, i) => {
      const localT = Math.max(0, t - i * 0.1);
      c.scale.setScalar(localT * 2);
    });
  }

  update(time) {
    if (!this.visible) return;
    this.dna.rotation.y += 0.005;
    // Bioluminescent drift upward
    this.bio.position.y = Math.sin(time * 0.2) * 0.5;
    this.cells.children.forEach((c, i) => {
      c.position.y += Math.sin(time * 0.5 + i) * 0.001;
    });
  }
}
