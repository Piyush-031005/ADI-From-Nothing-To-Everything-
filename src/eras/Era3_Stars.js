import * as THREE from 'three';

/**
 * Era 3 — FIRST STARS
 * Particles slow from explosion into star clusters.
 * Nebula colors. One star goes supernova → black hole forms.
 * Black hole uses Simon Bröer disc + particle shaders.
 */
export class Era3_Stars {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildStarClusters();
    this._buildNebula();
    this._buildBlackHole();
  }

  _buildStarClusters() {
    const count = 100000;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffe4c4'),
      new THREE.Color('#aad4ff'),
      new THREE.Color('#fff3a0'),
      new THREE.Color('#ffa07a'),
    ];

    for (let i = 0; i < count; i++) {
      // Create multiple spiral galaxies
      const galaxyIndex = Math.floor(Math.random() * 5);
      const galaxyOffsets = [
        [0, 0, 0], [20, 10, -30], [-15, -5, 20], [30, -15, 10], [-25, 20, -15]
      ];
      const offset = galaxyOffsets[galaxyIndex];
      
      // Spiral math
      const radius = Math.pow(Math.random(), 2.0) * 15; // denser in center
      const spinAngle = radius * 0.5; // spiral twist
      const branchAngle = (i % 3) * ((Math.PI * 2) / 3); // 3 arms
      
      const randomOffset = (Math.random() - 0.5) * 1.5;
      
      positions[i*3]   = offset[0] + Math.cos(spinAngle + branchAngle) * radius + randomOffset;
      positions[i*3+1] = offset[1] + (Math.random() - 0.5) * (2.0 - radius * 0.1); // flatter disc
      positions[i*3+2] = offset[2] + Math.sin(spinAngle + branchAngle) * radius + randomOffset;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i*3]   = col.r;
      colors[i*3+1] = col.g;
      colors[i*3+2] = col.b;
      sizes[i] = Math.random() * 0.8 + 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.Float32BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = pow(1.0 - (dist * 2.0), 1.5);
          gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.stars = new THREE.Points(geo, mat);
    this.stars.visible = false;
    this.exp.scene.add(this.stars);
  }

  _buildNebula() {
    this.nebula = new THREE.Group();
    const nebulaColors = [
      '#7b8cde', '#c084fc', '#f43f5e', '#fb923c', '#34d399'
    ];
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(4 + Math.random() * 8, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nebulaColors[i % nebulaColors.length]),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      this.nebula.add(mesh);
    }
    this.nebula.visible = false;
    this.exp.scene.add(this.nebula);
  }

  _buildBlackHole() {
    // Simplified black hole at era climax
    // Disc: CylinderGeometry with additive material
    const discGeo = new THREE.CylinderGeometry(4, 0.5, 0, 64, 8, true);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xffa040,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.bhDisc = new THREE.Mesh(discGeo, discMat);

    // Core: bright sphere
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.bhCore = new THREE.Mesh(coreGeo, coreMat);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.38, 0.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd080,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.bhRing = new THREE.Mesh(ringGeo, ringMat);
    this.bhRing.rotation.x = Math.PI * 0.5;

    this.blackHole = new THREE.Group();
    this.blackHole.add(this.bhDisc, this.bhCore, this.bhRing);
    this.blackHole.position.set(3, 0, -5);
    this.blackHole.visible = false;
    this.exp.scene.add(this.blackHole);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,  2, 15),
      new THREE.Vector3(5,  1, 10),
      new THREE.Vector3(3,  0, 5),
      new THREE.Vector3(3,  0.5, 2),
    ]);
    return { curve, lookAt: new THREE.Vector3(2, 0, -2) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.stars.visible  = true;
    this.nebula.visible = true;
    this.blackHole.visible = true;

    const mat = this.stars.material;
    mat.uniforms.uOpacity.value = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      mat.uniforms.uOpacity.value = t * 0.85;
      this.nebula.children.forEach(m => m.material.opacity = t * 0.04);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const startOp = this.stars.material.uniforms.uOpacity.value;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.stars.material.uniforms.uOpacity.value = startOp * (1 - t);
      this.nebula.children.forEach(m => m.material.opacity *= (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.stars.visible = false;
        this.nebula.visible = false;
        this.blackHole.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Black hole appears at end of era
    const bhProgress = Math.max(0, (t - 0.7) / 0.3);
    this.bhDisc.material.opacity = bhProgress * 0.6;
    this.bhRing.material.opacity = bhProgress * 0.9;
    this.blackHole.rotation.y = t * Math.PI * 2;
    this.bhDisc.rotation.y += 0.01;
  }

  update(time) {
    if (!this.visible) return;
    this.stars.rotation.y = time * 0.005;
    this.nebula.rotation.y = time * 0.003;
    this.bhDisc.rotation.y = time * 0.8;
  }
}
