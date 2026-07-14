import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

/**
 * Era 5 — EARTH
 * Planet fully cools. Ocean fills. Atmosphere thickens.
 * Clouds roll. Lightning. Time-lapse rotation.
 */
export class Era5_Earth {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildPlanet();
    this._buildClouds();
    this._buildMoon();
    this._buildStarfield();
  }

  _buildPlanet() {
    this.planetUniforms = {
      uTime:         { value: 0 },
      uCoolProgress: { value: 1.0 },
      uOceanProgress:{ value: 0.0 },   // grows with scroll
      uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    };

    const geo = new THREE.SphereGeometry(2, 128, 128);
    const mat = new THREE.RawShaderMaterial({
      vertexShader:   planetVertex,
      fragmentShader: planetFragment,
      uniforms:       this.planetUniforms,
      glslVersion:    THREE.GLSL3,
    });

    this.planet = new THREE.Mesh(geo, mat);
    this.planet.visible = false;
    this.exp.scene.add(this.planet);

    // Atmosphere (thicker than solar system era)
    const atmoGeo = new THREE.SphereGeometry(2.22, 64, 64);
    this.atmoUniforms = {
      uSunDirection:       { value: this.planetUniforms.uSunDirection.value },
      uAtmosphereColor:    { value: new THREE.Color('#60a5fa') },
      uAtmosphereStrength: { value: 0.0 },
    };
    const atmoMat = new THREE.RawShaderMaterial({
      vertexShader:   atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms: this.atmoUniforms,
      glslVersion:  THREE.GLSL3,
      transparent:  true,
      depthWrite:   false,
      side:         THREE.FrontSide,
      blending:     THREE.AdditiveBlending,
    });
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.atmosphere.visible = false;
    this.exp.scene.add(this.atmosphere);
  }

  _buildClouds() {
    // Wispy cloud layer
    const geo = new THREE.SphereGeometry(2.09, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      wireframe: false,
    });
    this.clouds = new THREE.Mesh(geo, mat);
    this.clouds.visible = false;
    this.exp.scene.add(this.clouds);
  }

  _buildMoon() {
    const geo = new THREE.SphereGeometry(0.5, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 1,
      metalness: 0,
    });
    const light = new THREE.DirectionalLight(0xfff4e0, 1.5);
    light.position.set(10, 5, 5);
    this.exp.scene.add(light);

    this.moon = new THREE.Mesh(geo, mat);
    this.moon.position.set(4, 0.5, -1);
    this.moon.visible = false;
    this.exp.scene.add(this.moon);
  }

  _buildStarfield() {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 100;
      pos[i*3]   = Math.sin(p) * Math.cos(t) * r;
      pos[i*3+1] = Math.sin(p) * Math.sin(t) * r;
      pos[i*3+2] = Math.cos(p) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.4, color: 0xffffff, transparent: true, opacity: 0,
    }));
    this.bgStars.visible = false;
    this.exp.scene.add(this.bgStars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5,  2, 5),
      new THREE.Vector3(3,  1, 4),
      new THREE.Vector3(2,  0.5, 3),
      new THREE.Vector3(1.5, 0, 2.5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.planet.visible = true;
    this.atmosphere.visible = true;
    this.clouds.visible = true;
    this.moon.visible = true;
    this.bgStars.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = t * 0.8;
      this.clouds.material.opacity  = t * 0.25;
      this.atmoUniforms.uAtmosphereStrength.value = t * 1.2;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = 0.8 * (1 - t);
      this.clouds.material.opacity  = 0.25 * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.planet.visible = false;
        this.atmosphere.visible = false;
        this.clouds.visible = false;
        this.moon.visible = false;
        this.bgStars.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Ocean fills progressively
    this.planetUniforms.uOceanProgress.value = t;
    this.atmoUniforms.uAtmosphereStrength.value = 0.8 + t * 0.5;
    // Moon orbit
    const angle = t * Math.PI * 2;
    this.moon.position.set(Math.cos(angle) * 4, Math.sin(angle * 0.3) * 0.5, Math.sin(angle) * 4);
  }

  update(time) {
    if (!this.visible) return;
    this.planetUniforms.uTime.value = time;
    this.planet.rotation.y = time * 0.03;
    this.clouds.rotation.y = time * 0.025;
    this.atmosphere.rotation.y = time * 0.03;
  }
}
