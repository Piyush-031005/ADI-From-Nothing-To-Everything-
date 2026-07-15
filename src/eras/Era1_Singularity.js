import * as THREE from 'three';

/**
 * Era 1 — SINGULARITY
 * True 360 3D Volumetric Black Hole
 * Replaces the 2D plane with 3D spheres, accretion disk planes, and volumetric particles.
 */
export class Era1_Singularity {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildBlackHole();
  }

  _buildBlackHole() {
    // 1. Event Horizon (Pure Black Sphere)
    const ehGeo = new THREE.SphereGeometry(2, 64, 64);
    const ehMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eventHorizon = new THREE.Mesh(ehGeo, ehMat);
    this.group.add(this.eventHorizon);

    // 2. Photon Sphere (Intense glowing outline around Event Horizon)
    const psGeo = new THREE.SphereGeometry(2.1, 64, 64);
    const psMat = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vNormal;
        void main() {
          // Fresnel rim glow
          float intensity = pow(1.0 - max(dot(vNormal, vec3(0, 0, 1)), 0.0), 3.0);
          gl_FragColor = vec4(1.0, 0.9, 0.7, intensity * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.photonSphere = new THREE.Mesh(psGeo, psMat);
    this.group.add(this.photonSphere);

    // 3. Volumetric Accretion Disk (Particles)
    const count = 50000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rand = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute in a flat torus shape around the black hole
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 20; // Disk spans from 2.5 to 22.5
      
      // Make it thicker near the center
      const ySpread = (20 / radius) * (Math.random() - 0.5) * 0.5;
      
      positions[i*3] = Math.cos(angle) * radius;
      positions[i*3+1] = ySpread;
      positions[i*3+2] = Math.sin(angle) * radius;
      
      rand[i] = Math.random();
      
      // Color based on radius (hotter/whiter near center, redder/darker at edges)
      const t = (radius - 2.5) / 20.0;
      const c = new THREE.Color().setHSL(0.1 - t * 0.1, 1.0, 0.8 - t * 0.7);
      colors[i*3] = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    const adGeo = new THREE.BufferGeometry();
    adGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    adGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    adGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 1));

    const adMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        attribute float aRand;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec3 p = position;
          
          // Differential rotation (faster near center)
          float r = length(p.xz);
          float speed = 5.0 / (r + 0.1);
          float angle = time * speed;
          float s = sin(angle);
          float c = cos(angle);
          p.xz = mat2(c, -s, s, c) * p.xz;
          
          // Turbulence
          p.y += sin(time * 2.0 + aRand * 10.0) * 0.1;
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (15.0 * aRand) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          float alpha = (0.5 - ll) * 2.0;
          gl_FragColor = vec4(vColor, alpha * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.accretionDisk = new THREE.Points(adGeo, adMat);
    // Tilt the disk slightly for drama
    this.accretionDisk.rotation.x = Math.PI * 0.1;
    this.group.add(this.accretionDisk);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, 40),
      new THREE.Vector3(-15, 5, 20),
      new THREE.Vector3(-5, 1, 8),
      new THREE.Vector3(0, 0, 5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.photonSphere.material.uniforms.opacity.value = t;
      this.accretionDisk.material.uniforms.opacity.value = t;
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
      this.photonSphere.material.uniforms.opacity.value = f;
      this.accretionDisk.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Zoom in on black hole
    const scale = 1.0 + t * 0.5;
    this.group.scale.setScalar(scale);
  }

  update(time) {
    if (!this.visible) return;
    this.accretionDisk.material.uniforms.time.value = time;
  }
}
