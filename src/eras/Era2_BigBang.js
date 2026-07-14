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
    // Background nebula cloud — large semi-transparent sprites
    this.nebulas = new THREE.Group();
    const colors = ['#ff6b35', '#fbbf24', '#7b8cde', '#f43f5e'];

    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(3 + Math.random() * 6, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
        transparent: true,
        opacity: 0,
        wireframe: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20
      );
      this.nebulas.add(mesh);
    }
    this.nebulas.visible = false;
    this.exp.scene.add(this.nebulas);
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
    this.nebulas.visible   = true;
    // Animate shockwave expand
    this._triggerShockwave();
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

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const startOpacity = this.nebulas.children[0]?.material.opacity || 0;
    const exp = this.explosion;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.nebulas.children.forEach(m => m.material.opacity = startOpacity * (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else {
        exp.visible = false;
        this.shockwave.visible = false;
        this.nebulas.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this._explosionProgress = t;
    this.explosionUniforms.uExplosionProgress.value = t;

    // Nebula fades in as explosion expands
    const nebulaOpacity = Math.max(0, (t - 0.3) / 0.7) * 0.08;
    this.nebulas.children.forEach(m => m.material.opacity = nebulaOpacity);
  }

  update(time) {
    if (!this.visible) return;
    this.explosionUniforms.uTime.value = time;
    // Slow nebula drift
    this.nebulas.rotation.y = time * 0.01;
  }
}
