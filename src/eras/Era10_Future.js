import * as THREE from 'three';

/**
 * Era 10 — FUTURE
 * Cyber-Grid City & Hovering Procedural Sci-Fi Drones.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildCyberPlanet();
    this._buildDysonRings();
    this._buildMatrixStreams();
    this._buildDrones();
  }

  _buildCyberPlanet() {
    const coreGeo = new THREE.SphereGeometry(14.8, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x050114, transparent: true, opacity: 0 });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    const bGeo = new THREE.BoxGeometry(0.3, 0.3, 1.0);
    bGeo.translate(0, 0, 0.5); 
    const bMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    
    const count = 10000;
    this.city = new THREE.InstancedMesh(bGeo, bMat, count);
    const dummy = new THREE.Object3D();
    const vec3 = new THREE.Vector3();
    const color = new THREE.Color();
    
    for(let i=0; i<count; i++) {
      const phi = Math.acos((Math.random() * 2) - 1);
      const theta = Math.random() * Math.PI * 2;
      vec3.setFromSphericalCoords(14.8, phi, theta);
      dummy.position.copy(vec3);
      dummy.lookAt(0,0,0);
      
      const height = Math.random() > 0.95 ? 4 + Math.random() * 8 : 0.5 + Math.random() * 2;
      dummy.scale.set(1, 1, height);
      dummy.updateMatrix();
      this.city.setMatrixAt(i, dummy.matrix);
      
      const r = Math.random();
      if (r < 0.33) color.setHex(0x00ffff);
      else if (r < 0.66) color.setHex(0xff00ff);
      else color.setHex(0x9900ff);
      
      this.city.setColorAt(i, color);
    }
    this.group.add(this.city);

    const atmGeo = new THREE.SphereGeometry(18, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.2, 0.0, 0.8, 1.0) * intensity * opacity;
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
    });
    this.atmosphere = new THREE.Mesh(atmGeo, atmMat);
    this.group.add(this.atmosphere);
  }

  _buildDrones() {
    // Highly stylized procedural Sci-Fi Drones
    this.drones = new THREE.Group();
    
    const droneGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const droneMat = new THREE.MeshStandardMaterial({ 
      color: 0x222222, metalness: 0.9, roughness: 0.2 
    });
    
    const eyeGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
    eyeGeo.rotateZ(Math.PI / 2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    this.droneObjects = [];

    for(let i=0; i<15; i++) {
      const drone = new THREE.Group();
      
      const body = new THREE.Mesh(droneGeo, droneMat);
      drone.add(body);
      
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0, 0.45);
      drone.add(eye);
      
      // Floating rings around drone
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.02, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = Math.PI / 2;
      drone.add(ring);
      
      // Random position slightly above the planet surface
      const phi = Math.acos((Math.random() * 2) - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 5; 
      
      const pos = new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
      drone.position.copy(pos);
      drone.lookAt(0,0,0);
      
      // Keep track for animation
      this.droneObjects.push({
        mesh: drone,
        basePos: pos.clone(),
        speed: 0.5 + Math.random(),
        offset: Math.random() * Math.PI * 2
      });

      this.drones.add(drone);
    }

    // Add a light to make the drones look metallic
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 20, 10);
    this.group.add(dirLight);

    this.group.add(this.drones);
  }

  _buildDysonRings() {
    this.rings = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float time; uniform float opacity; varying vec2 vUv;
        void main() {
          float pattern = step(0.8, sin(vUv.x * 200.0 + time * 10.0) * sin(vUv.y * 20.0));
          float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          gl_FragColor = vec4(mix(vec3(0.5, 0.0, 1.0), vec3(0.0, 1.0, 1.0), vUv.y) * (0.2 + pattern * 0.8), edge * opacity);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    });

    const r1 = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 1.5, 64, 1, true), mat);
    r1.rotation.x = Math.PI * 0.5;
    this.rings.add(r1);

    const r2 = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 0.5, 64, 1, true), mat);
    r2.rotation.y = Math.PI * 0.25; r2.rotation.x = Math.PI * 0.5;
    this.rings.add(r2);

    this.group.add(this.rings);
  }

  _buildMatrixStreams() {
    const count = 15000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 80;
      pos[i*3+1] = -50 + Math.random() * 100;
      pos[i*3+2] = (Math.random() - 0.5) * 80;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time; varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + time * 15.0 + 50.0, 100.0) - 50.0;
          vAlpha = smoothstep(-50.0, -30.0, p.y) * smoothstep(50.0, 30.0, p.y);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (2.0 + sin(p.x * 20.0 + time * 5.0)) * (30.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity; varying float vAlpha;
        void main() { gl_FragColor = vec4(0.0, 0.8, 1.0, vAlpha * opacity * 0.6); }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.streams = new THREE.Points(geo, mat);
    this.group.add(this.streams);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 50),
      new THREE.Vector3(-25, 15, 35),
      new THREE.Vector3(-30, -5, 20),
      new THREE.Vector3(0, 0, 18),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.core.material.opacity = t;
      this.city.material.opacity = t * 0.8;
      this.atmosphere.material.uniforms.opacity.value = t;
      this.rings.children.forEach(r => r.material.uniforms.opacity.value = t);
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
      this.core.material.opacity = f;
      this.city.material.opacity = f * 0.8;
      this.atmosphere.material.uniforms.opacity.value = f;
      this.rings.children.forEach(r => r.material.uniforms.opacity.value = f);
      this.streams.material.uniforms.opacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    const scale = 1.0 + t * 0.3;
    this.core.scale.setScalar(scale);
    this.city.scale.setScalar(scale);
    this.atmosphere.scale.setScalar(scale);
  }

  update(time) {
    if (!this.visible) return;
    this.core.rotation.y = time * 0.1;
    this.city.rotation.y = time * 0.1;
    
    this.rings.children[0].rotation.z = time * 0.4;
    this.rings.children[1].rotation.x = Math.PI * 0.5 + Math.sin(time) * 0.15;
    this.rings.children[1].rotation.z = -time * 0.2;
    this.rings.children.forEach(r => r.material.uniforms.time.value = time);
    this.streams.material.uniforms.time.value = time;
    
    // Hover drones
    this.droneObjects.forEach(d => {
      // Bob up and down along their local Z (which points towards the planet core because of lookAt)
      const hoverOffset = Math.sin(time * d.speed + d.offset) * 2.0;
      
      // To move them along their local Z axis, we need their forward vector
      const forward = new THREE.Vector3(0,0,1).applyQuaternion(d.mesh.quaternion);
      d.mesh.position.copy(d.basePos).add(forward.multiplyScalar(hoverOffset));
      
      // Spin the rings
      d.mesh.children[2].rotation.z = time * 2 * d.speed;
    });
  }
}
