import * as THREE from 'three';

/**
 * Era 7 — CAMBRIAN EXPLOSION
 * Procedural underwater 3D scene with caustics, plankton, and kelp.
 */
export class Era7_Cambrian {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildWater();
    this._buildPlankton();
    this._buildKelp();
  }

  _buildWater() {
    const geo = new THREE.CylinderGeometry(50, 50, 60, 32, 1, true);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorTop: { value: new THREE.Color(0x0044ff) },
        colorBottom: { value: new THREE.Color(0x000511) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        varying vec2 vUv;
        varying vec3 vPosition;

        // Simple 2D noise for caustics
        float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
        float noise(vec2 x) {
          vec2 i = floor(x); vec2 f = fract(x);
          float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          float depth = smoothstep(-30.0, 30.0, vPosition.y);
          vec3 baseColor = mix(colorBottom, colorTop, depth);
          
          // Caustics effect
          vec2 uvCaustic = vUv * 15.0;
          float c = noise(uvCaustic + time * 0.5) * noise(uvCaustic - time * 0.3);
          c = smoothstep(0.1, 0.4, c);
          
          // Light rays from top
          float ray = noise(vec2(vUv.x * 20.0 + time * 0.1, 0.0)) * smoothstep(1.0, 0.2, vUv.y);
          
          vec3 finalColor = baseColor + (vec3(0.5, 0.8, 1.0) * c * 0.3) + (vec3(0.3, 0.6, 1.0) * ray * 0.5);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.water = new THREE.Mesh(geo, mat);
    this.group.add(this.water);
  }

  _buildPlankton() {
    const count = 10000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 60;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = (Math.random() - 0.5) * 60;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        void main() {
          vec3 p = position;
          p.x += sin(time * 0.5 + p.y) * 0.5;
          p.z += cos(time * 0.4 + p.x) * 0.5;
          p.y += sin(time * 0.2 + p.z) * 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (2.0 + sin(time + p.x)) * (20.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(0.5, 1.0, 0.8, (0.5 - dist) * 2.0 * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.plankton = new THREE.Points(geo, mat);
    this.group.add(this.plankton);
  }

  _buildKelp() {
    const count = 200;
    const geo = new THREE.CylinderGeometry(0.1, 0.2, 10, 8, 10);
    geo.translate(0, 5, 0); // origin at base
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          // sway based on height
          float sway = sin(time + p.y * 0.5) * p.y * 0.1;
          p.x += sway;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(vec3(0.0, 0.2, 0.1), vec3(0.2, 0.8, 0.4), vUv.y);
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.kelp = new THREE.InstancedMesh(geo, mat, count);
    
    const dummy = new THREE.Object3D();
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      dummy.position.set(Math.cos(angle)*radius, -20, Math.sin(angle)*radius);
      dummy.scale.set(1, 0.5 + Math.random()*2, 1);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      this.kelp.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(this.kelp);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 15),
      new THREE.Vector3(5, -5, 8),
      new THREE.Vector3(0, -10, 2),
      new THREE.Vector3(-3, -15, 0),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -15, -5) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.water.material.opacity = t;
      this.plankton.material.uniforms.opacity.value = t;
      this.kelp.material.uniforms.opacity.value = t;
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
      this.water.material.opacity = f;
      this.plankton.material.uniforms.opacity.value = f;
      this.kelp.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.group.rotation.y = t * 0.5;
  }

  update(time) {
    if (!this.visible) return;
    this.water.material.uniforms.time.value = time;
    this.plankton.material.uniforms.time.value = time;
    this.kelp.material.uniforms.time.value = time;
  }
}
