import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

/**
 * Era 4 — SOLAR SYSTEM
 * Molten planet forms from debris. Asteroid ring orbits.
 * fbm vertex displacement makes terrain alive with lava.
 */
export class Era4_SolarSystem {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildSun();
    this._buildPlanet();
    this._buildDebrisRing();
    this._buildStarfield();
  }

  _buildSun() {
    // Distant star/sun — bright sphere
    const geo = new THREE.SphereGeometry(1.2, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff4c2,
      transparent: false,
    });
    this.sun = new THREE.Mesh(geo, mat);
    this.sun.position.set(30, 10, -60);

    // Glow around sun
    const glowGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.sun.add(this.sunGlow);

    this.sun.visible = false;
    this.exp.scene.add(this.sun);
  }

  _buildPlanet() {
    this.planetUniforms = {
      uTime:         { value: 0 },
      uCoolProgress: { value: 0.0 },   // 0=lava, 1=cooled (set per era)
      uOceanProgress:{ value: 0.0 },
      uSunDirection: { value: new THREE.Vector3(1, 0.5, 0.3).normalize() },
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

    // Atmosphere shell
    const atmoGeo = new THREE.SphereGeometry(2.18, 64, 64);
    const atmoMat = new THREE.RawShaderMaterial({
      vertexShader:   atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms: {
        uSunDirection:       { value: this.planetUniforms.uSunDirection.value },
        uAtmosphereColor:    { value: new THREE.Color('#4a90ff') },
        uAtmosphereStrength: { value: 0.0 },
      },
      glslVersion:  THREE.GLSL3,
      transparent:  true,
      depthWrite:   false,
      side:         THREE.FrontSide,
      blending:     THREE.AdditiveBlending,
    });
    this.atmoUniforms = atmoMat.uniforms;
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.atmosphere.visible = false;
    this.exp.scene.add(this.atmosphere);
  }

  _buildDebrisRing() {
    // Instanced debris around planet
    const count = 3000;
    const geo = new THREE.SphereGeometry(0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x888877 });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 2.5;
      const tilt   = (Math.random() - 0.5) * 0.4;
      dummy.position.set(
        Math.cos(angle) * radius,
        tilt,
        Math.sin(angle) * radius
      );
      dummy.scale.setScalar(0.3 + Math.random() * 0.7);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.debris = mesh;
    this.debris.visible = false;
    this.exp.scene.add(this.debris);
  }

  _buildStarfield() {
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 150 + Math.random() * 100;
      pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i*3+2] = Math.cos(phi) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.3, color: 0xffffff, transparent: true, opacity: 0 }));
    this.bgStars.visible = false;
    this.exp.scene.add(this.bgStars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8,  3,  8),
      new THREE.Vector3(5,  1,  5),
      new THREE.Vector3(3,  0,  3),
      new THREE.Vector3(2,  0.5, 2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.planet.visible = true;
    this.atmosphere.visible = true;
    this.debris.visible = true;
    this.sun.visible = true;
    this.bgStars.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = t * 0.6;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = 0.6 * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.planet.visible = false;
        this.atmosphere.visible = false;
        this.debris.visible = false;
        this.sun.visible = false;
        this.bgStars.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Planet cools slightly, atmosphere strengthens
    this.planetUniforms.uCoolProgress.value = t * 0.3;
    this.atmoUniforms.uAtmosphereStrength.value = t * 0.3;
  }

  update(time) {
    if (!this.visible) return;
    this.planetUniforms.uTime.value = time;
    this.planet.rotation.y = time * 0.05;
    this.atmosphere.rotation.y = time * 0.05;
    this.debris.rotation.y = time * 0.1;
  }
}
