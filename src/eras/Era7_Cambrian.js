import * as THREE from 'three';

/**
 * Era 7 — CAMBRIAN
 * Option B: Procedural Masterpiece (Bioluminescent Jellyfish)
 */
export class Era7_Cambrian {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildEnvironment();
    this._buildJellyfish();
  }

  _buildEnvironment() {
    // Deep underwater lighting and fog effect
    const ambient = new THREE.AmbientLight(0x001122, 1.0);
    this.group.add(ambient);
    
    // Caustic-like top light
    const topLight = new THREE.DirectionalLight(0x00ffcc, 1.5);
    topLight.position.set(0, 20, 0);
    this.group.add(topLight);

    // Floating plankton particles
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 40;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = (Math.random() - 0.5) * 40;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const mat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    this.plankton = new THREE.Points(geo, mat);
    this.group.add(this.plankton);
  }

  _buildJellyfish() {
    this.jellyGroup = new THREE.Group();
    
    // 1. The Bell (Hemisphere)
    const bellGeo = new THREE.SphereGeometry(3, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.6);
    this.bellMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec3 p = position;
          // Pulse animation based on height (y)
          float pulse = sin(uTime * 2.0 - p.y * 1.5);
          p.x += normal.x * pulse * 0.3;
          p.z += normal.z * pulse * 0.3;
          // Flap the bottom edge
          if (p.y < 0.5) {
            p.y += sin(uTime * 4.0 + p.x * 2.0) * 0.2;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          // Inner bioluminescence
          vec3 baseColor = vec3(0.0, 0.4, 0.8);
          vec3 glowColor = vec3(0.0, 1.0, 0.8);
          
          // Fresnel rim lighting
          float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          rim = smoothstep(0.6, 1.0, rim);
          
          // Rib patterns
          float ribs = abs(sin(vUv.x * 3.14159 * 20.0));
          ribs = pow(ribs, 10.0);
          
          vec3 finalColor = mix(baseColor, glowColor, rim + ribs * 0.5);
          
          // Fade bottom edge
          float alpha = smoothstep(1.0, 0.7, vUv.y);
          
          gl_FragColor = vec4(finalColor, alpha * uOpacity * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const bell = new THREE.Mesh(bellGeo, this.bellMat);
    this.jellyGroup.add(bell);

    // 2. The Tentacles (Instanced Lines / Ribbons)
    // We will use multiple thin tubes that wave
    const tentacleCount = 12;
    this.tentacles = [];
    
    for(let i=0; i<tentacleCount; i++) {
      // 20 segments per tentacle
      const segments = 20;
      const geo = new THREE.CylinderGeometry(0.05, 0.01, 10, 4, segments, true);
      // Shift origin to top so they dangle
      geo.translate(0, -5, 0);
      
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uOffset: { value: Math.random() * Math.PI * 2 }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uOffset;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            // Wave based on depth (y)
            float wave = sin(uTime * 1.5 + p.y * 0.5 + uOffset);
            float wave2 = cos(uTime * 1.0 + p.y * 0.3 + uOffset);
            
            // Amplitude increases further down the tentacle (negative y)
            float amp = smoothstep(0.0, -10.0, p.y) * 2.0;
            p.x += wave * amp;
            p.z += wave2 * amp;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            // Fade out towards the bottom
            float alpha = smoothstep(0.0, 0.2, vUv.y);
            gl_FragColor = vec4(0.0, 0.8, 1.0, alpha * uOpacity * 0.6);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const tentacle = new THREE.Mesh(geo, mat);
      
      // Position them in a ring under the bell
      const angle = (i / tentacleCount) * Math.PI * 2;
      const radius = 2.0;
      tentacle.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
      
      this.tentacles.push(tentacle);
      this.jellyGroup.add(tentacle);
    }

    this.jellyGroup.position.set(0, 0, -15);
    this.group.add(this.jellyGroup);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -10, 10),
      new THREE.Vector3(5, 0, 5),
      new THREE.Vector3(0, 2, -5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -2, -15) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bellMat.uniforms.uOpacity.value = t;
      this.tentacles.forEach(tn => tn.material.uniforms.uOpacity.value = t);
      this.plankton.material.opacity = t * 0.3;
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
      this.bellMat.uniforms.uOpacity.value = f;
      this.tentacles.forEach(tn => tn.material.uniforms.uOpacity.value = f);
      this.plankton.material.opacity = f * 0.3;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // The jellyfish swims up slowly
    if (this.jellyGroup) {
      this.jellyGroup.position.y = -5 + t * 10;
      this.jellyGroup.rotation.y = t * Math.PI;
    }
  }

  update(time) {
    if (!this.visible) return;
    this.bellMat.uniforms.uTime.value = time;
    this.tentacles.forEach(tn => tn.material.uniforms.uTime.value = time);
    
    // Float plankton slowly upwards
    this.plankton.rotation.y = time * 0.05;
    this.plankton.position.y = (time * 0.5) % 40;
  }
}
