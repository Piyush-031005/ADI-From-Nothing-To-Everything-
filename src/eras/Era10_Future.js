import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

/**
 * Era 10 — THE FUTURE (Unknown Planet)
 * Purple oceans. Floating islands. Crystal structures.
 * Bioluminescent alien world. Two moons. Final message.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildAlienPlanet();
    this._buildFloatingIslands();
    this._buildAlienStarfield();
    this._buildTwoMoons();
    this._buildAlienParticles();
  }

  _buildAlienPlanet() {
    // Reuse planet shader but with alien color palette via uniforms
    this.planetUniforms = {
      uTime:         { value: 0 },
      uCoolProgress: { value: 0.7 },  // partially cooled = alien mix
      uOceanProgress:{ value: 0.8 },  // lots of ocean
      uSunDirection: { value: new THREE.Vector3(0.5, 0.3, 1.0).normalize() },
    };

    const geo = new THREE.SphereGeometry(2.5, 128, 128);
    const mat = new THREE.RawShaderMaterial({
      vertexShader:   planetVertex,
      fragmentShader: planetFragment,
      uniforms:       this.planetUniforms,
      glslVersion:    THREE.GLSL3,
    });

    // Override colors to purple/teal
    this.planet = new THREE.Mesh(geo, mat);
    this.planet.visible = false;
    this.exp.scene.add(this.planet);

    // Purple atmosphere
    const atmoGeo = new THREE.SphereGeometry(2.75, 64, 64);
    this.atmoUniforms = {
      uSunDirection:       { value: this.planetUniforms.uSunDirection.value },
      uAtmosphereColor:    { value: new THREE.Color('#a855f7') },
      uAtmosphereStrength: { value: 0.0 },
    };
    const atmoMat = new THREE.RawShaderMaterial({
      vertexShader:   atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms:       this.atmoUniforms,
      glslVersion:    THREE.GLSL3,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.FrontSide,
      blending:       THREE.AdditiveBlending,
    });
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.atmosphere.visible = false;
    this.exp.scene.add(this.atmosphere);
  }

  _buildFloatingIslands() {
    this.islands = new THREE.Group();

    for (let i = 0; i < 8; i++) {
      // Each island: flattened sphere with crystals on top
      const islandGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 8);
      const islandMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.75 + Math.random() * 0.2, 0.5, 0.2),
        transparent: true,
        opacity: 0,
      });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.scale.y = 0.3;

      // Crystal cluster on top
      for (let j = 0; j < 4; j++) {
        const crystalGeo = new THREE.ConeGeometry(0.04, 0.3 + Math.random() * 0.3, 5);
        const crystalMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.78 + Math.random() * 0.1, 1, 0.6),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        const a = (j / 4) * Math.PI * 2;
        crystal.position.set(Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.15);
        island.add(crystal);
      }

      // Position: floating around the planet at medium distance
      const angle = (i / 8) * Math.PI * 2;
      const dist  = 3.5 + Math.random() * 2;
      island.position.set(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * dist
      );
      island.userData.floatOffset = Math.random() * Math.PI * 2;
      island.userData.floatSpeed  = 0.3 + Math.random() * 0.4;

      this.islands.add(island);
    }
    this.islands.visible = false;
    this.exp.scene.add(this.islands);
  }

  _buildTwoMoons() {
    this.moons = [];
    const moonColors = [0xd8b4fe, 0x7dd3fc];
    const sizes = [0.4, 0.25];
    const distances = [6, 8];

    for (let i = 0; i < 2; i++) {
      const geo = new THREE.SphereGeometry(sizes[i], 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: moonColors[i],
        transparent: true,
        opacity: 0,
      });
      const moon = new THREE.Mesh(geo, mat);
      this.exp.scene.add(moon);
      this.moons.push({ mesh: moon, distance: distances[i], speed: 0.08 - i * 0.03, angle: i * Math.PI });
    }
  }

  _buildAlienStarfield() {
    // Denser, more colorful alien sky
    const count = 20000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 100;
      pos[i*3]   = Math.sin(p) * Math.cos(t) * r;
      pos[i*3+1] = Math.sin(p) * Math.sin(t) * r;
      pos[i*3+2] = Math.cos(p) * r;

      const c = new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 0.8, 0.7);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));

    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    }));
    this.stars.visible = false;
    this.exp.scene.add(this.stars);
  }

  _buildAlienParticles() {
    // Floating alien spores
    const count = 15000;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 20;
      pos[i*3+1] = (Math.random() - 0.5) * 15;
      pos[i*3+2] = (Math.random() - 0.5) * 20;
      const c = new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 1.0, 0.6);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));

    this.spores = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.spores.visible = false;
    this.exp.scene.add(this.spores);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(10, 3, 10),
      new THREE.Vector3(6,  2, 7),
      new THREE.Vector3(4,  1, 5),
      new THREE.Vector3(3,  0.5, 4),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.5) {
    this.visible = true;
    this.planet.visible = true;
    this.atmosphere.visible = true;
    this.islands.visible = true;
    this.stars.visible = true;
    this.spores.visible = true;
    this.moons.forEach(m => m.mesh.visible = true);

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.stars.material.opacity = t * 0.9;
      this.spores.material.opacity = t * 0.6;
      this.atmoUniforms.uAtmosphereStrength.value = t * 1.5;
      this.islands.children.forEach(island => {
        island.material.opacity = t * 0.85;
        island.children.forEach(c => c.material.opacity = t);
      });
      this.moons.forEach(m => m.mesh.material.opacity = t * 0.9);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.8) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.stars.material.opacity = 0.9 * f;
      this.spores.material.opacity = 0.6 * f;
      this.atmoUniforms.uAtmosphereStrength.value = 1.5 * f;
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.planet.visible = false;
        this.atmosphere.visible = false;
        this.islands.visible = false;
        this.stars.visible = false;
        this.spores.visible = false;
        this.moons.forEach(m => m.mesh.visible = false);
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.atmoUniforms.uAtmosphereStrength.value = 1.2 + t * 0.5;
  }

  update(time) {
    if (!this.visible) return;
    this.planetUniforms.uTime.value = time;
    this.planet.rotation.y = time * 0.02;
    this.atmosphere.rotation.y = time * 0.02;
    this.spores.rotation.y = time * 0.03;
    this.stars.rotation.y = time * 0.002;

    // Float islands
    this.islands.children.forEach((island, i) => {
      const off = island.userData.floatOffset;
      const spd = island.userData.floatSpeed;
      island.position.y += Math.sin(time * spd + off) * 0.003;
      island.rotation.y = time * 0.1 + off;
    });

    // Orbit moons
    this.moons.forEach(m => {
      m.angle += m.speed * 0.01;
      m.mesh.position.set(
        Math.cos(m.angle) * m.distance,
        Math.sin(m.angle * 0.3) * 1.5,
        Math.sin(m.angle) * m.distance
      );
    });
  }
}
