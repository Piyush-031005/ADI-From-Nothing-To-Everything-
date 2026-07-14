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

    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 60;
      pos[i*3+1] = -40 + Math.random() * 80;
      pos[i*3+2] = (Math.random() - 0.5) * 60;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        void main() {
          vec3 p = position;
          p.y += time * 10.0;
          p.y = mod(p.y + 40.0, 80.0) - 40.0;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 1.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        void main() {
          gl_FragColor = vec4(0.0, 1.0, 0.8, opacity * 0.3);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.streams = new THREE.Points(geo, mat);
    this.group.add(this.streams);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 60),
      new THREE.Vector3(20, 10, 40),
      new THREE.Vector3(0, 0, 25),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.planet.material.opacity = t * 0.5;
      this.core.material.opacity = t * 0.9;
      this.atmosphere.material.opacity = t * 0.3;
      this.rings.children.forEach(r => r.material.opacity = t * 0.3);
      this.streams.material.uniforms.opacity.value = t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.planet.material.opacity = f * 0.5;
      this.core.material.opacity = f * 0.9;
      this.atmosphere.material.opacity = f * 0.3;
      this.rings.children.forEach(r => r.material.opacity = f * 0.3);
      this.streams.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    const scale = 1.0 + t * 0.5;
    this.planet.scale.set(scale, scale, scale);
    this.core.scale.set(scale, scale, scale);
    this.atmosphere.scale.set(scale, scale, scale);
  }

  update(time) {
    if (!this.visible) return;
    this.planet.rotation.y = time * 0.2;
    this.planet.rotation.z = time * 0.1;
    
    this.rings.children[0].rotation.z = time * 0.5;
    this.rings.children[1].rotation.x = Math.PI * 0.5 + Math.sin(time) * 0.1;
    this.rings.children[1].rotation.z = -time * 0.3;
    this.rings.children[2].rotation.z = time * 0.1;

    this.streams.material.uniforms.time.value = time;
  }
}
