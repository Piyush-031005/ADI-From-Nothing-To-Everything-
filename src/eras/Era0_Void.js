import * as THREE from 'three';
import vertexShader   from '../shaders/singularity/vertex.glsl';
import fragmentShader from '../shaders/singularity/fragment.glsl';

/**
 * Era 0 — THE VOID
 * Absolute darkness. One pulsing singularity point.
 * A screen-quad shader fills the scene with the gravitational glow.
 */
export class Era0_Void {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildSingularityQuad();
    this._buildStarfieldPoints();
  }

  _buildSingularityQuad() {
    this.uniforms = {
      uTime:       { value: 0 },
      uProgress:   { value: 0.6 },   // singularity glow amount
      uDistortion: { value: 0.2 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const mat = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      glslVersion: THREE.GLSL3,
      depthTest:  false,
      depthWrite: false,
      transparent: true,
    });

    // Full-screen quad
    const geo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geo, mat);
    this.quad.frustumCulled = false;
    this.quad.visible = false;
    this.exp.scene.add(this.quad);
  }

  _buildStarfieldPoints() {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 80 + Math.random() * 200;
      positions[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
      sizes[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size:  0.4,
      color: 0xffffff,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });

    this.stars = new THREE.Points(geo, mat);
    this.stars.visible = false;
    this.exp.scene.add(this.stars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 3),
      new THREE.Vector3(0.2, 0.1, 2.8),
      new THREE.Vector3(0, 0, 2.5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 0.8) {
    this.visible = true;
    this.quad.visible  = true;
    this.stars.visible = true;

    // Fade in opacity
    const mat = this.stars.material;
    mat.opacity = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      mat.opacity = t * 0.5;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const mat  = this.stars.material;
    const quad = this.quad;
    const start = performance.now();
    const startOpacity = mat.opacity;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      mat.opacity = startOpacity * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { quad.visible = false; this.stars.visible = false; }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // As user scrolls within void, singularity brightens slightly
    this.uniforms.uProgress.value   = 0.4 + t * 0.6;
    this.uniforms.uDistortion.value = t * 0.5;
  }

  update(time) {
    if (!this.visible) return;
    this.uniforms.uTime.value = time;
    // Very slow star rotation
    this.stars.rotation.y = time * 0.008;
    this.stars.rotation.x = time * 0.003;
  }
}
