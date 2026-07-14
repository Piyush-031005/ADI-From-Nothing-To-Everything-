import * as THREE from 'three';
import vertexShader   from '../shaders/singularity/vertex.glsl';
import fragmentShader from '../shaders/singularity/fragment.glsl';

/**
 * Era 1 — SINGULARITY
 * All of spacetime compressed to an infinite density point.
 * Gravitational lensing intensifies, photon ring appears.
 */
export class Era1_Singularity {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildLensQuad();
    this._buildParticleRing();
  }

  _buildLensQuad() {
    this.uniforms = {
      uTime:       { value: 0 },
      uProgress:   { value: 1.0 },
      uDistortion: { value: 0.8 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const mat = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geo, mat);
    this.quad.frustumCulled = false;
    this.quad.visible = false;
    this.exp.scene.add(this.quad);
  }

  _buildParticleRing() {
    // Swirling particles falling into singularity
    const count = 30000;
    const dist     = new Float32Array(count);
    const sizes    = new Float32Array(count);
    const randoms  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      dist[i]    = Math.random();
      sizes[i]   = Math.random();
      randoms[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(dist, 1));
    geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aRandom',  new THREE.Float32BufferAttribute(randoms, 1));

    // Reuse Simon Bröer's particle pattern: angle from time*progress in vertex shader
    // But we use inline material here
    const mat = new THREE.PointsMaterial({
      size:  0.05,
      color: new THREE.Color('#c8a96e'),
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ring = new THREE.Points(geo, mat);
    this.ring.visible = false;
    this.exp.scene.add(this.ring);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 6),
      new THREE.Vector3(1, 0.5, 4),
      new THREE.Vector3(0, 0,   2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 0.8) {
    this.visible = true;
    this.quad.visible = true;
    this.ring.visible = true;
    this.ring.material.opacity = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.ring.material.opacity = t * 0.7;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.5) {
    this.visible = false;
    const quad = this.quad;
    const ring = this.ring;
    const start = performance.now();
    const startOpacity = ring.material.opacity;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      ring.material.opacity = startOpacity * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { quad.visible = false; ring.visible = false; }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Lensing maxes out at end of era
    this.uniforms.uDistortion.value = 0.5 + t * 1.5;
    this.uniforms.uProgress.value   = 0.8 + t * 0.2;
    // Ring spins faster and shrinks toward center
    if (this.ring) {
      this.ring.scale.setScalar(1.0 - t * 0.4);
    }
  }

  update(time) {
    if (!this.visible) return;
    this.uniforms.uTime.value = time;
    // Rotate ring around y
    if (this.ring) {
      this.ring.rotation.y = time * 0.3;
      this.ring.rotation.x = 0.4;
    }
  }
}
