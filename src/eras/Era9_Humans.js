import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Cinematic backdrop. Fire to Metropolis evolution. Neural Net.
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildCinematicBackground();
    this._buildSatelliteGrid();
    this._buildNeuralNet();
  }

  _buildCinematicBackground() {
    const texLoader = new THREE.TextureLoader();
    const tex = texLoader.load('/assets/humans.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    
    // Massive cinematic cylinder backdrop
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

  _buildSatelliteGrid() {
    // Orbital rings as line loops
    this.satelliteRings = new THREE.Group();
    const ringColors = [0xaad4ff, 0x7b8cde, 0x4ade80];

    for (let i = 0; i < 5; i++) {
      const radius = 4 + i * 0.5;
      const points = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: ringColors[i % 3],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Line(geo, mat);
      ring.rotation.x = (i / 5) * Math.PI;
      ring.rotation.z = (i / 5) * 0.5;
      this.satelliteRings.add(ring);
    }
    this.satelliteRings.visible = false;
    this.exp.scene.add(this.satelliteRings);
  }

  _buildNeuralNet() {
    // Neural network visualization: nodes + edges
    this.neuralNet = new THREE.Group();
    const nodeCount = 40;
    const nodePos = [];
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nodeGeo = new THREE.SphereGeometry(0.06, 6, 6);

    for (let i = 0; i < nodeCount; i++) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10
      );
      nodePos.push(p);
      const node = new THREE.Mesh(nodeGeo, nodeMat.clone());
      node.position.copy(p);
      this.neuralNet.add(node);
    }

    // Connect nearby nodes
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x7b8cde,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i+1; j < nodeCount; j++) {
        if (nodePos[i].distanceTo(nodePos[j]) < 3.5) {
          const edgeGeo = new THREE.BufferGeometry().setFromPoints([nodePos[i], nodePos[j]]);
          this.neuralNet.add(new THREE.Line(edgeGeo, edgeMat.clone()));
        }
      }
    }

    this.neuralNet.position.set(8, 0, 0);
    this.neuralNet.visible = false;
    this.exp.scene.add(this.neuralNet);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 8, 8),
      new THREE.Vector3(4, 5, 6),
      new THREE.Vector3(6, 2, 4),
      new THREE.Vector3(8, 0, 2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.backdrop.visible = true;
    this.satelliteRings.visible = true;
    this.neuralNet.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.backdrop.material.opacity = t * 1.0;
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
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.backdrop.visible = false;
        this.satelliteRings.visible = false;
        this.neuralNet.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.backdrop.rotation.y = t * 0.3;

    // Satellite rings appear at t>0.4
    const ringT = Math.max(0, (t - 0.4) / 0.6);
    this.satelliteRings.children.forEach((r, i) => {
      r.material.opacity = Math.max(0, ringT - i * 0.08) * 0.6;
    });

    // Neural net at t>0.7
    const netT = Math.max(0, (t - 0.7) / 0.3);
    this.neuralNet.children.forEach(c => c.material.opacity = netT * 0.8);
  }

  update(time) {
    if (!this.visible) return;
    this.satelliteRings.rotation.y = time * 0.1;

    // Neural net pulse
    this.neuralNet.rotation.y = time * 0.08;
    this.neuralNet.children.forEach((c, i) => {
      if (c.type === 'Mesh') {
        c.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.3);
      }
    });
  }
}
