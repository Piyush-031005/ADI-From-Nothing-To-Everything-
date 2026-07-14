import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

import sunVertex from '../shaders/sun/vertex.glsl';
import sunFragment from '../shaders/sun/fragment.glsl';

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
    this.sunUniforms = { uTime: { value: 0 } };
    const geo = new THREE.SphereGeometry(1.5, 64, 64);
    const mat = new THREE.RawShaderMaterial({
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      uniforms: this.sunUniforms,
      glslVersion: THREE.GLSL3,
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
      tDiffuse:      { value: null },
      tSpecular:     { value: null },
      tNormal:       { value: null }
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
    // Inner asteroid debris ring
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
    
    // Other planetary bodies (Gas Giant, Ice World)
    this.otherPlanets = new THREE.Group();
    this.exp.scene.add(this.otherPlanets);
    this.otherPlanets.visible = false;
    
    // Gas Giant
    const gasGeo = new THREE.SphereGeometry(3.5, 64, 64);
    const gasMat = new THREE.MeshStandardMaterial({
      color: 0xcfb997,
      roughness: 0.8,
      metalness: 0.1
    });
    const gasGiant = new THREE.Mesh(gasGeo, gasMat);
    gasGiant.position.set(-25, -5, -40);
    this.otherPlanets.add(gasGiant);
    
    // Gas Giant Ring
    const ringGeo = new THREE.RingGeometry(4.5, 7.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa89f91,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const gasRing = new THREE.Mesh(ringGeo, ringMat);
    gasRing.rotation.x = Math.PI / 2 + 0.2;
    gasRing.rotation.y = 0.1;
    gasGiant.add(gasRing);
    
    // Ice planet
    const iceGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x88bbff,
      roughness: 0.4,
      metalness: 0.2
    });
    const icePlanet = new THREE.Mesh(iceGeo, iceMat);
    icePlanet.position.set(15, 8, -25);
    this.otherPlanets.add(icePlanet);
    
    // Ambient light so standard materials are visible
    this.ambientLight = new THREE.AmbientLight(0x222233, 1);
    this.ambientLight.visible = false;
    this.exp.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffeedd, 3);
    this.sunLight.position.set(30, 10, -60);
    this.sunLight.visible = false;
    this.exp.scene.add(this.sunLight);
  }

  _buildStarfield() {
    this.bgGroup = new THREE.Group();
    this.exp.scene.add(this.bgGroup);
    
    // 1. Core glowing milky way band
    const mwCount = 20000;
    const mwPos = new Float32Array(mwCount * 3);
    const mwCol = new Float32Array(mwCount * 3);
    for(let i=0; i<mwCount; i++) {
      // Create a band across the sky
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      // Squash into a band
      let y = Math.sin(phi) * Math.sin(theta);
      y *= 0.15; // Flatten the sphere into a disc/band
      
      const r = 200 + Math.random() * 50;
      
      const x = Math.sin(phi) * Math.cos(theta);
      const z = Math.cos(phi);
      
      // Rotate band
      const axis = new THREE.Vector3(1, 0.5, 0.2).normalize();
      const pos = new THREE.Vector3(x, y, z).normalize().multiplyScalar(r);
      pos.applyAxisAngle(axis, Math.PI / 4);
      
      mwPos[i*3] = pos.x;
      mwPos[i*3+1] = pos.y;
      mwPos[i*3+2] = pos.z;
      
      const intensity = 0.5 + Math.random() * 0.5;
      mwCol[i*3] = 0.8 * intensity;
      mwCol[i*3+1] = 0.9 * intensity;
      mwCol[i*3+2] = 1.0 * intensity;
    }
    
    const mwGeo = new THREE.BufferGeometry();
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCol, 3));
    
    const mwMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.milkyWay = new THREE.Points(mwGeo, mwMat);
    this.bgGroup.add(this.milkyWay);

    // 2. Distant generic stars
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
    this.bgGroup.add(this.bgStars);
    
    this.bgGroup.visible = false;
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
    this.bgGroup.visible = true;
    this.otherPlanets.visible = true;
    this.ambientLight.visible = true;
    this.sunLight.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = t * 0.6;
      this.milkyWay.material.opacity = t * 1.0;
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
      this.milkyWay.material.opacity = 1.0 * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.planet.visible = false;
        this.atmosphere.visible = false;
        this.debris.visible = false;
        this.sun.visible = false;
        this.bgGroup.visible = false;
        this.otherPlanets.visible = false;
        this.ambientLight.visible = false;
        this.sunLight.visible = false;
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
    if (this.sunUniforms) this.sunUniforms.uTime.value = time;
    
    this.planet.rotation.y = time * 0.05;
    this.atmosphere.rotation.y = time * 0.05;
    this.debris.rotation.y = time * 0.1;
    
    // Animate other planets
    if (this.otherPlanets) {
      this.otherPlanets.children.forEach((p, i) => {
        p.rotation.y = time * (0.02 + i * 0.01);
        p.position.y += Math.sin(time * 0.5 + i) * 0.01;
      });
    }
  }
}
