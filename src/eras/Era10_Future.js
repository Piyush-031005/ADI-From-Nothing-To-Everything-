import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

/**
 * Era 10 — THE FUTURE
 * Cyber-Earth. Dyson sphere rings. Data streams. Cinematic Backdrop.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildCinematicBackground();
    this._buildCyberPlanet();
    this._buildTechRings();
    this._buildDataStreams();
  }

  _buildCinematicBackground() {
    const texLoader = new THREE.TextureLoader();
    const tex = texLoader.load('/assets/future.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    
    // Massive cinematic cylinder backdrop
    const geo = new THREE.CylinderGeometry(40, 40, 30, 64, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    
    this.backdrop = new THREE.Mesh(geo, mat);
    this.backdrop.position.set(0, 5, 0);
    this.backdrop.visible = false;
    this.exp.scene.add(this.backdrop);
  }

  _buildCyberPlanet() {
    this.planetUniforms = {
      uTime:         { value: 0 },
      uCoolProgress: { value: 1.0 }, 
      uOceanProgress:{ value: 1.0 },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.3, 1.0).normalize() },
      tDiffuse:      { value: null },
      tSpecular:     { value: null },
      tNormal:       { value: null }
    };

    const geo = new THREE.SphereGeometry(2.5, 128, 128);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.2,
      metalness: 1.0,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });

    this.planet = new THREE.Mesh(geo, mat);
    this.planet.visible = false;
    this.exp.scene.add(this.planet);
    
    // Solid core underneath wireframe
    const coreGeo = new THREE.SphereGeometry(2.48, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x050510 });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.core.visible = false;
    this.planet.add(this.core);

    // Glowing atmosphere
    const atmoGeo = new THREE.SphereGeometry(2.7, 64, 64);
    this.atmoUniforms = {
      uSunDirection:       { value: this.planetUniforms.uSunDirection.value },
      uAtmosphereColor:    { value: new THREE.Color('#00ffcc') },
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

  _buildTechRings() {
    this.rings = new THREE.Group();
    
    // Dyson Sphere / Orbital Rings
    for(let i=0; i<3; i++) {
      const geo = new THREE.TorusGeometry(3.5 + i * 0.8, 0.02, 16, 100);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        rx: (Math.random() - 0.5) * 0.05,
        ry: (Math.random() - 0.5) * 0.05
      };
      
      // Add data nodes to rings
      for(let j=0; j<8; j++) {
        const nodeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        const angle = (j/8) * Math.PI * 2;
        node.position.set(Math.cos(angle) * (3.5 + i*0.8), Math.sin(angle) * (3.5 + i*0.8), 0);
        ring.add(node);
      }
      this.rings.add(ring);
    }
    
    this.rings.visible = false;
    this.exp.scene.add(this.rings);
  }

  _buildDataStreams() {
    // Holographic data particles floating up
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 15;
      pos[i*3+1] = (Math.random() - 0.5) * 15;
      pos[i*3+2] = (Math.random() - 0.5) * 15;
      
      const c = new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1.0, 0.6); // Cyan to purple
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));

    this.streams = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.streams.visible = false;
    this.exp.scene.add(this.streams);
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
    this.backdrop.visible = true;
    this.planet.visible = true;
    this.core.visible = true;
    this.atmosphere.visible = true;
    this.rings.visible = true;
    this.streams.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.backdrop.material.opacity = t * 1.0;
      this.streams.material.opacity = t * 0.8;
      this.planet.material.opacity = t * 0.5;
      this.atmoUniforms.uAtmosphereStrength.value = t * 1.5;
      this.rings.children.forEach(r => {
        r.material.opacity = t * 0.5;
      });
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
      this.backdrop.material.opacity = 1.0 * f;
      this.streams.material.opacity = 0.8 * f;
      this.planet.material.opacity = 0.5 * f;
      this.atmoUniforms.uAtmosphereStrength.value = 1.5 * f;
      this.rings.children.forEach(r => r.material.opacity = 0.5 * f);
      
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.backdrop.visible = false;
        this.planet.visible = false;
        this.core.visible = false;
        this.atmosphere.visible = false;
        this.rings.visible = false;
        this.streams.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.backdrop.rotation.y = t * 0.3;
    this.atmoUniforms.uAtmosphereStrength.value = 1.2 + t * 0.5;
    this.planet.material.emissiveIntensity = 0.1 + t * 0.5;
  }

  update(time) {
    if (!this.visible) return;
    this.planet.rotation.y = time * 0.05;
    this.atmosphere.rotation.y = time * 0.05;
    
    // Matrix data streams flowing upwards
    const positions = this.streams.geometry.attributes.position.array;
    for(let i=0; i<positions.length; i+=3) {
      positions[i+1] += 0.05;
      if(positions[i+1] > 15) {
        positions[i+1] = -15;
      }
    }
    this.streams.geometry.attributes.position.needsUpdate = true;

    // Orbit tech rings
    this.rings.children.forEach(ring => {
      ring.rotation.x += ring.userData.rx;
      ring.rotation.y += ring.userData.ry;
    });
  }
}
