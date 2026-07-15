import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS
 * Cinematic procedural fossil T-Rex made of glowing ember particles.
 * Intense meteor impact with screen-space bloom flashes.
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildTerrain();
    this._buildAtmosphere();
    this._buildMeteor();
    this._buildParticleRex();
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(200, 200, 256, 256);
    geo.rotateX(-Math.PI * 0.5);
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vHeight;
        
        // Simplex noise (simplified)
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ; m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vUv = uv;
          vec3 pos = position;
          // Rugged volcanic terrain
          float h = snoise(pos.xz * 0.05) * 6.0;
          h += snoise(pos.xz * 0.2) * 1.5;
          pos.y = h;
          vHeight = h;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          vec3 rock = vec3(0.05, 0.05, 0.06);
          vec3 lava = vec3(1.0, 0.3, 0.0);
          
          // Lava in deep valleys
          float lavaGlow = smoothstep(2.0, -2.0, vHeight);
          lavaGlow *= (0.8 + 0.2 * sin(time * 3.0 + vUv.x * 20.0));
          
          vec3 color = mix(rock, lava, lavaGlow * 0.9);
          
          // Fog fade out
          float dist = gl_FragCoord.z / gl_FragCoord.w;
          float fog = smoothstep(30.0, 100.0, dist);
          color = mix(color, vec3(0.0), fog);

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.position.y = -8;
    this.group.add(this.terrain);
  }

  _buildAtmosphere() {
    const geo = new THREE.SphereGeometry(120, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x110200,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.atmosphere = new THREE.Mesh(geo, mat);
    this.group.add(this.atmosphere);
  }

  _buildMeteor() {
    this.meteorGroup = new THREE.Group();
    
    // Core
    const geo = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.meteorCore = new THREE.Mesh(geo, mat);
    this.meteorGroup.add(this.meteorCore);
    
    // Trail particles
    const tGeo = new THREE.BufferGeometry();
    const count = 10000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 5;
      pos[i*3+1] = Math.random() * 30; // Trail goes up in local space
      pos[i*3+2] = (Math.random() - 0.5) * 5;
    }
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const tMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vY;
        void main() {
          vec3 p = position;
          vY = p.y;
          // Expand trail upwards
          p.x += sin(p.y * 0.5 + time * 10.0) * (p.y * 0.05);
          p.z += cos(p.y * 0.5 + time * 10.0) * (p.y * 0.05);
          gl_PointSize = (10.0 / p.y) * (10.0 / - (modelViewMatrix * vec4(p, 1.0)).z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying float vY;
        void main() {
          float alpha = smoothstep(30.0, 0.0, vY);
          vec3 col = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.8, 0.2), alpha);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.meteorTrail = new THREE.Points(tGeo, tMat);
    this.meteorGroup.add(this.meteorTrail);

    this.meteorGroup.position.set(-80, 80, -100);
    this.meteorGroup.lookAt(0, -10, 0); // Point towards origin
    this.group.add(this.meteorGroup);

    // Impact flash
    const flashGeo = new THREE.PlaneGeometry(200, 200);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.flash = new THREE.Mesh(flashGeo, flashMat);
    this.flash.position.set(0, 0, -20);
    this.group.add(this.flash);
  }

  _buildParticleRex() {
    // Procedural Particle T-Rex Skull
    const count = 40000;
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    
    // Helper to generate points inside ellipsoid
    let i = 0;
    const addEllipsoid = (x,y,z, rx,ry,rz, pointsCount) => {
      for(let j=0; j<pointsCount; j++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = Math.pow(Math.random(), 1/3); // uniformly distribute in volume
        pos[i*3] = x + r * rx * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = y + r * ry * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = z + r * rz * Math.cos(phi);
        rand[i] = Math.random();
        i++;
      }
    };

    // Main skull
    addEllipsoid(0, 4, -5,  2, 3, 5,  15000);
    // Snout
    addEllipsoid(0, 3, 0,  1.2, 1.5, 4,  10000);
    // Lower jaw
    addEllipsoid(0, 0.5, -1,  1.5, 1, 4.5, 10000);
    // Neck
    addEllipsoid(0, -2, -10,  2.5, 4, 3,  5000);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 1));
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: `
        uniform float time;
        attribute float aRand;
        varying float vIntensity;
        void main() {
          vec3 p = position;
          // Float/wobble effect
          p.x += sin(time * 2.0 + p.y) * 0.1;
          p.y += cos(time * 1.5 + p.x) * 0.1;
          
          // Breathing / roaring jaw
          if (p.y < 2.0 && p.z > -4.0) { // jaw area
            p.y -= abs(sin(time * 3.0)) * 1.5 * aRand;
            p.z += abs(sin(time * 3.0)) * 0.5;
          }

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (15.0 * aRand) / -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
          
          vIntensity = sin(time * 5.0 + aRand * 10.0) * 0.5 + 0.5;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vIntensity;
        void main() {
          // Ember color
          vec3 col = mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 0.8, 0.2), vIntensity);
          
          // Soft particle circle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if(ll > 0.5) discard;
          float alpha = (0.5 - ll) * 2.0;

          gl_FragColor = vec4(col, alpha * opacity * (0.3 + 0.7 * vIntensity));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.trex = new THREE.Points(geo, mat);
    this.trex.position.set(0, -2, -15);
    this.trex.rotation.y = -Math.PI / 6; // Angled slightly
    this.group.add(this.trex);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),
      new THREE.Vector3(-15, 8, 10),
      new THREE.Vector3(-8, 3, 0),
      new THREE.Vector3(0, 4, -8),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 2, -15) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.atmosphere.material.opacity = t * 0.6;
      this.trex.material.uniforms.opacity.value = t;
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
      this.atmosphere.material.opacity = f * 0.6;
      this.trex.material.uniforms.opacity.value = f;
      this.flash.material.opacity *= f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Meteor travels and crashes at t=0.8
    if (t < 0.8) {
      const mt = t / 0.8;
      // Exponential fall to feel fast at the end
      const easeMt = Math.pow(mt, 3.0);
      this.meteorGroup.position.set(
        THREE.MathUtils.lerp(-80, 0, easeMt),
        THREE.MathUtils.lerp(80, -10, easeMt),
        THREE.MathUtils.lerp(-100, -20, easeMt)
      );
      this.meteorGroup.visible = true;
    } else {
      this.meteorGroup.visible = false;
    }

    // Impact at t=0.8
    if (t >= 0.8 && !this._impactTriggered) {
      this._impactTriggered = true;
      this._triggerImpact();
    } else if (t < 0.8) {
      this._impactTriggered = false;
    }

    // Darkness closes in post-impact (extinction)
    if (t > 0.8) {
      const darkness = (t - 0.8) / 0.2;
      this.atmosphere.material.color.setRGB(0.06 - darkness*0.06, 0.01 - darkness*0.01, 0.0);
      this.trex.material.uniforms.opacity.value = 1.0 - darkness; // T-Rex fades to dust
    } else {
      this.atmosphere.material.color.setHex(0x110200);
      this.trex.material.uniforms.opacity.value = 1.0;
    }
  }

  _triggerImpact() {
    this.flash.visible = true;
    const mat = this.flash.material;
    mat.opacity = 1.0;
    
    // Camera shake trigger via event bus could be added here, 
    // but for now we'll do an intense bloom flash.
    
    const start = performance.now();
    const dur = 2000;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      // Fast attack, slow release flash
      if (t < 0.1) {
        mat.opacity = t * 10;
      } else {
        mat.opacity = 1.0 - ((t - 0.1) / 0.9);
      }
      if (t < 1) requestAnimationFrame(tick);
      else this.flash.visible = false;
    };
    requestAnimationFrame(tick);
  }

  update(time) {
    if (!this.visible) return;
    this.terrain.material.uniforms.time.value = time;
    this.meteorTrail.material.uniforms.time.value = time;
    if (this.trex) {
      this.trex.material.uniforms.time.value = time;
    }
  }
}
