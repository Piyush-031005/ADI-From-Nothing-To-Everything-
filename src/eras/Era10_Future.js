import * as THREE from 'three';

/**
 * Era 10 — FUTURE
 * Procedural Holographic Cyber Planet & Dyson Sphere.
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
    const geo = new THREE.IcosahedronGeometry(12, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.planet = new THREE.Mesh(geo, mat);
    this.group.add(this.planet);

    // Inner core
    const coreGeo = new THREE.SphereGeometry(11.5, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x050011,
      transparent: true,
      opacity: 0
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Atmosphere
    const atmGeo = new THREE.SphereGeometry(13.5, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      opacity: 0
    });
    this.atmosphere = new THREE.Mesh(atmGeo, atmMat);
    this.group.add(this.atmosphere);
  }

  _buildDysonRings() {
    this.rings = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const r1 = new THREE.Mesh(new THREE.TorusGeometry(18, 0.2, 8, 64), mat);
    r1.rotation.x = Math.PI * 0.5;
    this.rings.add(r1);

    const r2 = new THREE.Mesh(new THREE.TorusGeometry(22, 0.1, 8, 64), mat);
    r2.rotation.y = Math.PI * 0.25;
    r2.rotation.x = Math.PI * 0.5;
    this.rings.add(r2);

    const r3 = new THREE.Mesh(new THREE.TorusGeometry(26, 0.4, 3, 64), mat);
    r3.rotation.y = -Math.PI * 0.25;
    r3.rotation.x = Math.PI * 0.5;
    this.rings.add(r3);

    this.group.add(this.rings);
  }

  _buildMatrixStreams() {
    const count = 10000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 60;
      pos[i*3+1] = -40 + Math.random() * 80;
      pos[i*3+2] = (Math.random() - 0.5) * 60;
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
          p.y += time * 10.0;
          p.y = mod(p.y + 40.0, 80.0) - 40.0;
          vAlpha = smoothstep(-40.0, -30.0, p.y) * smoothstep(40.0, 30.0, p.y);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (2.0 + sin(p.x * 10.0)) * (20.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(0.0, 1.0, 0.5, vAlpha * opacity * 0.5);
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
      new THREE.Vector3(0, 5, 40),
      new THREE.Vector3(-15, 10, 30),
      new THREE.Vector3(-20, -5, 20),
      new THREE.Vector3(0, 0, 15),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.planet.material.opacity = t * 0.5;
      this.core.material.opacity = t * 0.9;
      this.atmosphere.material.opacity = t * 0.3;
      this.rings.children.forEach(r => r.material.opacity = t * 0.3);
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
      this.planet.material.opacity = f * 0.5;
      this.core.material.opacity = f * 0.9;
      this.atmosphere.material.opacity = f * 0.3;
      this.rings.children.forEach(r => r.material.opacity = f * 0.3);
      this.streams.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Zoom planet in
    const scale = 1.0 + t * 0.5;
    this.planet.scale.set(scale, scale, scale);
    this.core.scale.set(scale, scale, scale);
    this.atmosphere.scale.set(scale, scale, scale);
  }

  update(time) {
    if (!this.visible) return;
    this.planet.rotation.y = time * 0.2;
    this.planet.rotation.z = time * 0.1;
    
    this.rings.children[0].rotation.z = time * 0.5;
    this.rings.children[1].rotation.x = Math.PI * 0.5 + Math.sin(time) * 0.1;
    this.rings.children[1].rotation.z = -time * 0.3;
    this.rings.children[2].rotation.z = time * 0.1;

    this.streams.material.uniforms.time.value = time;
  }
}
