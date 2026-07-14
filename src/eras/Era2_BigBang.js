import * as THREE from 'three';
import explosionVertex   from '../shaders/explosion/vertex.glsl';
import explosionFragment from '../shaders/explosion/fragment.glsl';

/**
 * Era 2 — THE BIG BANG
 * Hero era. 600k particles explode outward from origin.
 * Scroll drives explosion progress. Flash on era entry.
 */
export class Era2_BigBang {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._explosionProgress = 0;
    this._buildExplosionParticles();
    this._buildShockwave();
    this._buildNebulaGlow();
  }

  _buildExplosionParticles() {
    const count = 600000;

    const positions  = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes      = new Float32Array(count);
    const temps      = new Float32Array(count);
    const lives      = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Origin: tiny random cluster at center
      positions[i*3]   = (Math.random() - 0.5) * 0.1;
      positions[i*3+1] = (Math.random() - 0.5) * 0.1;
      positions[i*3+2] = (Math.random() - 0.5) * 0.1;

      // Velocity: spherical random direction, varied speed
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const speed = 0.3 + Math.random() * 1.0;
      velocities[i*3]   = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i*3+2] = Math.cos(phi) * speed;

      sizes[i] = 0.2 + Math.random() * 0.8;
      temps[i] = Math.random();          // temperature: 0=cooler, 1=hotter
      lives[i] = Math.random() * 0.4;   // stagger onset
    }

    this.explosionUniforms = {
      uTime:             { value: 0 },
      uExplosionProgress:{ value: 0 },
      uViewHeight:       { value: this.exp.sizes.height },
    };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',  new THREE.Float32BufferAttribute(positions,  3));
    geo.setAttribute('aVelocity', new THREE.Float32BufferAttribute(velocities, 3));
    geo.setAttribute('aSize',     new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aTemp',     new THREE.Float32BufferAttribute(temps, 1));
    geo.setAttribute('aLife',     new THREE.Float32BufferAttribute(lives, 1));

    const mat = new THREE.RawShaderMaterial({
      vertexShader:   explosionVertex,
      fragmentShader: explosionFragment,
      uniforms:       this.explosionUniforms,
      glslVersion:    THREE.GLSL3,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false,
    });

    this.explosion = new THREE.Points(geo, mat);
    this.explosion.frustumCulled = false;
    this.explosion.visible = false;
    this.exp.scene.add(this.explosion);
    this.exp.glowScene.add(this.explosion.clone()); // Also in glow pass for bloom
  }

  _buildShockwave() {
    // Expanding ring in screen space
    const geo = new THREE.RingGeometry(0.01, 0.015, 128);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.shockwave = new THREE.Mesh(geo, mat);
    this.shockwave.rotation.x = -Math.PI * 0.5;
    this.shockwave.visible = false;
    this.exp.scene.add(this.shockwave);
  }

  _buildNebulaGlow() {
    this.particles = new THREE.Group();

    // Blue/red sparkly aftermath of big bang
    const count = 10000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.pow(Math.random(), 0.3) * 30; // Dense center, sparse edges

      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);

      // Blue to red transition
      const color = new THREE.Color();
      if (Math.random() > 0.5) {
        color.setHSL(0.55 + Math.random() * 0.1, 1.0, 0.6); // Cyan/Blue
      } else {
        color.setHSL(0.95 + Math.random() * 0.1, 1.0, 0.5); // Red/Orange
      }
      col[i*3]   = color.r;
      col[i*3+1] = color.g;
      col[i*3+2] = color.b;
      
      sizes[i] = Math.random() * 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader for smooth particles
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (0.5 - dist) * 2.0;
          gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.plasma = new THREE.Points(geo, mat);
    this.particles.add(this.plasma);
    
    this.particles.visible = false;
    this.exp.scene.add(this.particles);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,  0,  1),   // inside the bang
      new THREE.Vector3(2,  1,  4),   // pulled back
      new THREE.Vector3(-1, 2,  8),   // wide view
      new THREE.Vector3(0,  3,  12),  // far view
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 0.8) {
    this.visible = true;
    this.explosion.visible = true;
    this.shockwave.visible = true;
    this.particles.visible = true;

    // Animate shockwave
    this._triggerShockwave();

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      if (this.plasma) {
        this.plasma.material.uniforms.uOpacity.value = t;
      }
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _triggerShockwave() {
    const mat = this.shockwave.material;
    mat.opacity = 1.0;
    this.shockwave.scale.setScalar(0.1);
    const start = performance.now();
    const dur = 1200;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      this.shockwave.scale.setScalar(0.1 + ease * 60);
      mat.opacity = (1 - t) * 0.8;
      if (t < 1) requestAnimationFrame(tick);
      else mat.opacity = 0;
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.8) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      if (this.plasma) {
        this.plasma.material.uniforms.uOpacity.value = f;
      }
      this.explosion.material.uniforms.uExplosionProgress.value = f;
      
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.explosion.visible = false;
        this.shockwave.visible = false;
        this.particles.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this._explosionProgress = t;
    this.explosionUniforms.uExplosionProgress.value = t;

    // Expand particles outwards based on scroll
    if (this.particles) {
      this.particles.scale.setScalar(1 + t * 10);
      
      // fade out as they expand too much
      if (this.plasma) {
         this.plasma.material.uniforms.uOpacity.value = this.visible ? (1.0 - t * 0.8) : 0;
      }
    }
  }

  update(time) {
    if (!this.visible) return;
    this.explosionUniforms.uTime.value = time;
    if (this.plasma) {
      this.plasma.material.uniforms.uTime.value = time;
      this.particles.rotation.y = time * 0.05;
      this.particles.rotation.z = time * 0.02;
    }
  }
}
