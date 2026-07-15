import * as THREE from 'three';

/**
 * Era 10 — FUTURE
 * Procedural Holographic Cyber Planet & Dyson Sphere.
 * Upgraded to cinematic quality with InstancedMesh cities and volumetric glow.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildCyberPlanet();
    this._buildDysonRings();
    this._buildMatrixStreams();
  }

  _buildCyberPlanet() {
    // Solid Core
    const coreGeo = new THREE.SphereGeometry(14.8, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x050114,
      transparent: true,
      opacity: 0
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Instanced Cityscape
    const bGeo = new THREE.BoxGeometry(0.3, 0.3, 1.0);
    bGeo.translate(0, 0, 0.5); // base alignment
    
    const bMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    
    const count = 8000;
    this.city = new THREE.InstancedMesh(bGeo, bMat, count);
    const dummy = new THREE.Object3D();
    const vec3 = new THREE.Vector3();
    const color = new THREE.Color();
    
    for(let i=0; i<count; i++) {
      const phi = Math.acos((Math.random() * 2) - 1);
      const theta = Math.random() * Math.PI * 2;
      vec3.setFromSphericalCoords(14.8, phi, theta);
      
      dummy.position.copy(vec3);
      dummy.lookAt(0,0,0);
      
      // Variable building heights, some massive skyscrapers
      const height = Math.random() > 0.95 ? 4 + Math.random() * 6 : 0.5 + Math.random() * 2;
      dummy.scale.set(1, 1, height);
      dummy.updateMatrix();
      
      this.city.setMatrixAt(i, dummy.matrix);
      
      // Neon color palette (Cyberpunk/Sci-Fi)
      const hue = Math.random() > 0.5 ? 0.55 + Math.random() * 0.1 : 0.8 + Math.random() * 0.1;
      color.setHSL(hue, 1.0, 0.5);
      this.city.setColorAt(i, color);
    }
    this.group.add(this.city);

    // Volumetric Atmosphere Glow
    const atmGeo = new THREE.SphereGeometry(18, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0) * intensity * opacity;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.atmosphere = new THREE.Mesh(atmGeo, atmMat);
    this.group.add(this.atmosphere);
  }

  _buildDysonRings() {
    this.rings = new THREE.Group();
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          // Scrolling tech data pattern
          float pattern = sin(vUv.x * 200.0 + time * 10.0) * sin(vUv.y * 20.0);
          pattern = step(0.8, pattern);
          
          // Edge glow
          float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          
          vec3 col = mix(vec3(0.5, 0.0, 1.0), vec3(0.0, 1.0, 1.0), vUv.y);
          gl_FragColor = vec4(col * (0.2 + pattern * 0.8), edge * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Multiple nested flat rings
    const r1 = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 1.5, 64, 1, true), mat);
    r1.rotation.x = Math.PI * 0.5;
    this.rings.add(r1);

    const r2 = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 0.5, 64, 1, true), mat);
    r2.rotation.y = Math.PI * 0.25;
    r2.rotation.x = Math.PI * 0.5;
    this.rings.add(r2);

    const r3 = new THREE.Mesh(new THREE.CylinderGeometry(32, 32, 3.0, 64, 1, true), mat);
    r3.rotation.y = -Math.PI * 0.25;
    r3.rotation.x = Math.PI * 0.5;
    this.rings.add(r3);

    this.group.add(this.rings);
  }

  _buildMatrixStreams() {
    const count = 15000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 80;
      pos[i*3+1] = -50 + Math.random() * 100;
      pos[i*3+2] = (Math.random() - 0.5) * 80;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y += time * 15.0; // Fast upward data stream
          p.y = mod(p.y + 50.0, 100.0) - 50.0;
          
          // Fade at top and bottom
          vAlpha = smoothstep(-50.0, -30.0, p.y) * smoothstep(50.0, 30.0, p.y);
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          
          // Data pulse size
          gl_PointSize = (1.5 + sin(p.x * 20.0 + time * 5.0)) * (30.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(0.0, 0.8, 1.0, vAlpha * opacity * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.streams = new THREE.Points(geo, mat);
    this.group.add(this.streams);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 50),
      new THREE.Vector3(-25, 15, 35),
      new THREE.Vector3(-30, -5, 20),
      new THREE.Vector3(0, 0, 18),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.core.material.opacity = t;
      this.city.material.opacity = t * 0.8;
      this.atmosphere.material.uniforms.opacity.value = t;
      this.rings.children.forEach(r => r.material.uniforms.opacity.value = t);
      this.streams.material.uniforms.opacity.value = t;
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
      this.core.material.opacity = f;
      this.city.material.opacity = f * 0.8;
      this.atmosphere.material.uniforms.opacity.value = f;
      this.rings.children.forEach(r => r.material.uniforms.opacity.value = f);
      this.streams.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Zoom planet in
    const scale = 1.0 + t * 0.3;
    this.core.scale.set(scale, scale, scale);
    this.city.scale.set(scale, scale, scale);
    this.atmosphere.scale.set(scale, scale, scale);
  }

  update(time) {
    if (!this.visible) return;
    this.core.rotation.y = time * 0.1;
    this.city.rotation.y = time * 0.1;
    
    this.rings.children[0].rotation.z = time * 0.4;
    this.rings.children[1].rotation.x = Math.PI * 0.5 + Math.sin(time) * 0.15;
    this.rings.children[1].rotation.z = -time * 0.2;
    this.rings.children[2].rotation.z = time * 0.1;

    this.rings.children.forEach(r => {
      r.material.uniforms.time.value = time;
    });
    this.streams.material.uniforms.time.value = time;
  }
}
