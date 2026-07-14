import * as THREE from 'three';
import Noises from './blackhole/Noises.js';
import BlackHoleDiscMaterial from './blackhole/Materials/BlackHoleDiscMaterial.js';
import BlackHoleParticlesMaterial from './blackhole/Materials/BlackHoleParticlesMaterial.js';
import BlackHoleDistortionActiveMaterial from './blackhole/Materials/BlackHoleDistortionActiveMaterial.js';
import BlackHoleDistortionMaskMaterial from './blackhole/Materials/BlackHoleDistortionMaskMaterial.js';

export class Era4_BlackHole {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.noises = new Noises(experience);

    this.commonUniforms = {
      uInnerColor: { value: new THREE.Color('#ff8080') },
      uOuterColor: { value: new THREE.Color('#3633ff') }
    };

    // Store black hole screen space position in experience for Renderer to use
    if (!this.exp.blackHolePosition) {
      this.exp.blackHolePosition = new THREE.Vector2(0.5, 0.5);
    }

    this._setParticles();
    this._setDisc();
    this._setDistortion();
    
    // Hide initially
    this.disc.mesh.visible = false;
    this.particles.points.visible = false;
    this.distortion.active.mesh.visible = false;
    this.distortion.mask.mesh.visible = false;
  }

  _setDisc() {
    this.disc = {};
    this.disc.geometry = new THREE.CylinderGeometry(5, 1, 0, 64, 10, true);
    this.disc.noiseTexture = this.noises.create(128, 128);
    this.disc.material = new BlackHoleDiscMaterial();
    this.disc.material.uniforms.uNoiseTexture.value = this.disc.noiseTexture;
    this.disc.material.uniforms.uInnerColor = this.commonUniforms.uInnerColor;
    this.disc.material.uniforms.uOuterColor = this.commonUniforms.uOuterColor;
    
    this.disc.mesh = new THREE.Mesh(this.disc.geometry, this.disc.material);
    this.exp.scene.add(this.disc.mesh);
  }

  _setParticles() {
    this.particles = {};
    this.particles.count = 50000;
    const distanceArray = new Float32Array(this.particles.count);
    const sizeArray = new Float32Array(this.particles.count);
    const randomArray = new Float32Array(this.particles.count);
    
    for(let i = 0; i < this.particles.count; i++) {
        distanceArray[i] = Math.random();
        sizeArray[i] = Math.random();
        randomArray[i] = Math.random();
    }

    this.particles.geometry = new THREE.BufferGeometry();
    this.particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(distanceArray, 1));
    this.particles.geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizeArray, 1));
    this.particles.geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomArray, 1));

    this.particles.material = new BlackHoleParticlesMaterial();
    this.particles.material.uniforms.uViewHeight.value = this.exp.sizes.height * this.exp.sizes.pixelRatio;
    this.particles.material.uniforms.uInnerColor = this.commonUniforms.uInnerColor;
    this.particles.material.uniforms.uOuterColor = this.commonUniforms.uOuterColor;

    this.particles.points = new THREE.Points(this.particles.geometry, this.particles.material);
    this.particles.points.frustumCulled = false;
    this.exp.scene.add(this.particles.points);
  }

  _setDistortion() {
    this.distortion = { active: {}, mask: {} };
    
    this.distortion.active.geometry = new THREE.PlaneGeometry(1, 1);
    this.distortion.active.material = new BlackHoleDistortionActiveMaterial();
    this.distortion.active.mesh = new THREE.Mesh(this.distortion.active.geometry, this.distortion.active.material);
    this.distortion.active.mesh.scale.set(10, 10, 10);
    this.exp.distortionScene.add(this.distortion.active.mesh);

    this.distortion.mask.geometry = new THREE.PlaneGeometry(1, 1);
    this.distortion.mask.material = new BlackHoleDistortionMaskMaterial();
    this.distortion.mask.mesh = new THREE.Mesh(this.distortion.mask.geometry, this.distortion.mask.material);
    this.distortion.mask.mesh.scale.set(10, 10, 10);
    this.distortion.mask.mesh.rotation.x = Math.PI * 0.5;
    this.exp.distortionScene.add(this.distortion.mask.mesh);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),
      new THREE.Vector3(5, 2, 10),
      new THREE.Vector3(0, 0.5, 6),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 0.8) {
    this.visible = true;
    this.disc.mesh.visible = true;
    this.particles.points.visible = true;
    this.distortion.active.mesh.visible = true;
    this.distortion.mask.mesh.visible = true;
  }

  hide(duration = 0.5) {
    this.visible = false;
    this.disc.mesh.visible = false;
    this.particles.points.visible = false;
    this.distortion.active.mesh.visible = false;
    this.distortion.mask.mesh.visible = false;
    
    // Clear black hole position distortion
    this.exp.blackHolePosition.set(-10, -10);
  }

  onScrollT(t) {
    // Optional scaling based on scroll
  }

  update(time) {
    if (!this.visible) return;

    // Project black hole 3D position to 2D screen space
    const screenPosition = new THREE.Vector3(0, 0, 0);
    screenPosition.project(this.exp.camera.instance);
    screenPosition.x = screenPosition.x * 0.5 + 0.5;
    screenPosition.y = screenPosition.y * 0.5 + 0.5;
    this.exp.blackHolePosition.copy(screenPosition);

    // Update shaders
    this.disc.material.uniforms.uTime.value = time;
    this.particles.material.uniforms.uTime.value = time + 9999.0;
    this.distortion.active.mesh.lookAt(this.exp.camera.instance.position);
  }
}
