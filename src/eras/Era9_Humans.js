import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Time-lapse city lights (top-down). Fire→villages→cities→rockets→AI.
 * All done with particles + line segments — no textures needed.
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildEarth();
    this._buildCityLights();
    this._buildRockets();
    this._buildSatelliteGrid();
    this._buildNeuralNet();
  }

  _buildEarth() {
    // Dark Earth sphere (night side view)
    const geo = new THREE.SphereGeometry(3, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x050a05,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    this.earthDark = new THREE.Mesh(geo, mat);
    this.earthDark.visible = false;
    this.exp.scene.add(this.earthDark);

    const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
    this.exp.scene.add(ambientLight);
  }

  _buildCityLights() {
    // Distributed light points on sphere surface
    const count = 25000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const lightColors = [
      new THREE.Color('#ffd700'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffaa44'),
      new THREE.Color('#aad4ff'),
      new THREE.Color('#ff6644'),
    ];

    for (let i = 0; i < count; i++) {
      // Project onto sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 3.02 + Math.random() * 0.02;

      pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i*3+2] = Math.cos(phi) * r;

      const c = lightColors[Math.floor(Math.random() * lightColors.length)];
      // Denser near equator for more city-like look
      const density = Math.pow(1 - Math.abs(Math.cos(phi)), 0.7);
      col[i*3]   = c.r * density;
      col[i*3+1] = c.g * density;
      col[i*3+2] = c.b * density;
      sizes[i] = Math.random() * density;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.cityLights = new THREE.Points(geo, mat);
    this.cityLights.visible = false;
    this.exp.scene.add(this.cityLights);

    // Glow copy for bloom
    const glowMat = mat.clone();
    glowMat.size = 0.12;
    glowMat.opacity = 0;
    this.cityGlow = new THREE.Points(geo, glowMat);
    this.exp.glowScene.add(this.cityGlow);
  }

  _buildRockets() {
    this.rockets = [];
    for (let i = 0; i < 5; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const origin = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * 3,
        Math.sin(phi) * Math.sin(theta) * 3,
        Math.cos(phi) * 3
      );
      const dest = origin.clone().normalize().multiplyScalar(12);

      // Trail line
      const points = [origin.clone(), origin.clone()];
      const geo    = new THREE.BufferGeometry().setFromPoints(points);
      const mat    = new THREE.LineBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      this.exp.scene.add(line);

      this.rockets.push({ origin, dest, progress: Math.random(), line, geo, points });
    }
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
    this.earthDark.visible = true;
    this.cityLights.visible = true;
    this.satelliteRings.visible = true;
    this.neuralNet.visible = true;
    this.rockets.forEach(r => r.line.visible = true);

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.earthDark.material.opacity = t * 0.95;
      this.cityLights.material.opacity = t * 0.8;
      this.cityGlow.material.opacity = t * 0.3;
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
      this.earthDark.material.opacity = 0.95 * f;
      this.cityLights.material.opacity = 0.8 * f;
      this.cityGlow.material.opacity = 0.3 * f;
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.earthDark.visible = false;
        this.cityLights.visible = false;
        this.satelliteRings.visible = false;
        this.neuralNet.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
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
    this.earthDark.rotation.y = time * 0.04;
    this.cityLights.rotation.y = time * 0.04;
    this.cityGlow.rotation.y = time * 0.04;
    this.satelliteRings.rotation.y = time * 0.1;

    // Animate rockets
    this.rockets.forEach(r => {
      r.progress = (r.progress + 0.003) % 1;
      const p = r.progress;
      const current = r.origin.clone().lerp(r.dest, p);
      const trail   = r.origin.clone().lerp(r.dest, Math.max(0, p - 0.15));
      r.geo.setFromPoints([trail, current]);
      r.geo.attributes.position.needsUpdate = true;
      r.line.material.opacity = Math.sin(p * Math.PI) * 0.9;
    });

    // Neural net pulse
    this.neuralNet.rotation.y = time * 0.08;
    this.neuralNet.children.forEach((c, i) => {
      if (c.type === 'Mesh') {
        c.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.3);
      }
    });
  }
}
