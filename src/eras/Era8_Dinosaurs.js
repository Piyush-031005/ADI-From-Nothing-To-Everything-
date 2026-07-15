import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS
 * Option B: Procedural Masterpiece (Massive Meteor Impact & Lava Terrain)
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildTerrain();
    this._buildMeteor();
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(200, 200, 256, 256);
    geo.rotateX(-Math.PI * 0.5);
    
    this.terrainMat = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0 },
        uImpact: { value: 0 } // 0 = peaceful, 1 = cracked with lava
      },
      vertexShader: `
        uniform float time;
        uniform float uImpact;
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
          // Rugged terrain
          float h = snoise(pos.xz * 0.05) * 6.0;
          
          // Crater logic (deep depression in the center based on impact)
          float dist = length(pos.xz);
          float crater = smoothstep(40.0, 0.0, dist) * -15.0;
          float rim = smoothstep(60.0, 30.0, dist) * smoothstep(10.0, 30.0, dist) * 5.0;
          
          pos.y = mix(h, h + crater + rim, uImpact);
          vHeight = pos.y;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float uImpact;
        varying vec2 vUv;
        varying float vHeight;
        
        // Pseudo-random hash
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

        void main() {
          vec3 rock = vec3(0.1, 0.15, 0.1); // Greenish pre-impact
          vec3 scorched = vec3(0.05, 0.05, 0.05); // Ash
          vec3 lava = vec3(1.0, 0.3, 0.0);
          
          // Cracks and Lava
          float crackNoise = hash(floor(vUv * 50.0));
          float isCrack = step(0.95, crackNoise);
          
          // Lava glow pulses and gets stronger deep in the crater
          float lavaGlow = smoothstep(-2.0, -10.0, vHeight) * isCrack;
          lavaGlow *= (0.8 + 0.2 * sin(time * 3.0 + vUv.x * 20.0));
          
          vec3 baseColor = mix(rock, scorched, uImpact);
          vec3 color = mix(baseColor, lava, lavaGlow * uImpact);
          
          // Fog fade out
          float dist = gl_FragCoord.z / gl_FragCoord.w;
          float fog = smoothstep(40.0, 100.0, dist);
          color = mix(color, vec3(0.0), fog);

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    this.terrain = new THREE.Mesh(geo, this.terrainMat);
    this.terrain.position.y = -10;
    this.group.add(this.terrain);
  }

  _buildMeteor() {
    this.meteorGroup = new THREE.Group();
    
    // Core of the meteor
    const geo = new THREE.IcosahedronGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.meteorCore = new THREE.Mesh(geo, mat);
    this.meteorGroup.add(this.meteorCore);
    
    // Trail (Particles)
    const tGeo = new THREE.BufferGeometry();
    const count = 15000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 6;
      pos[i*3+1] = Math.random() * 50; // Trail stretches up
      pos[i*3+2] = (Math.random() - 0.5) * 6;
    }
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const tMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 1 } },
      vertexShader: `
        uniform float time;
        varying float vY;
        void main() {
          vec3 p = position;
          vY = p.y;
          // Fire turbulence
          p.x += sin(p.y * 0.5 + time * 15.0) * (p.y * 0.05);
          p.z += cos(p.y * 0.5 + time * 15.0) * (p.y * 0.05);
          gl_PointSize = (15.0 / p.y) * (15.0 / - (modelViewMatrix * vec4(p, 1.0)).z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vY;
        void main() {
          // Circular particle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          if (length(xy) > 0.5) discard;

          float alpha = smoothstep(50.0, 0.0, vY);
          vec3 col = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.8, 0.2), alpha);
          gl_FragColor = vec4(col, alpha * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.meteorTrail = new THREE.Points(tGeo, tMat);
    this.meteorGroup.add(this.meteorTrail);

    this.meteorGroup.position.set(-100, 100, -100);
    this.meteorGroup.lookAt(0, -10, 0);
    this.group.add(this.meteorGroup);

    // Impact Flash (Screen space bloom effect via simple quad)
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

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, 30),
      new THREE.Vector3(-15, 12, 15),
      new THREE.Vector3(-10, 5, 0),
      new THREE.Vector3(0, 4, -10),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -10, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
  }

  hide(duration = 0.6) {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    // Meteor travels and crashes at t=0.7
    if (t < 0.7) {
      const mt = t / 0.7;
      // Exponential fall to feel fast at the end
      const easeMt = Math.pow(mt, 3.0);
      this.meteorGroup.position.set(
        THREE.MathUtils.lerp(-100, 0, easeMt),
        THREE.MathUtils.lerp(100, -10, easeMt),
        THREE.MathUtils.lerp(-100, 0, easeMt)
      );
      this.meteorGroup.visible = true;
      this.terrainMat.uniforms.uImpact.value = 0; // Peaceful
      this.flash.material.opacity = 0;
    } else {
      this.meteorGroup.visible = false;
      
      // Impact logic
      const postT = (t - 0.7) / 0.3; // 0 to 1 after impact
      
      this.terrainMat.uniforms.uImpact.value = 1.0; // Crater & Lava appear instantly
      
      // Flash fade out
      if (postT < 0.2) {
        this.flash.material.opacity = 1.0; // Instant massive flash
      } else {
        this.flash.material.opacity = 1.0 - ((postT - 0.2) / 0.8);
      }
    }
  }

  update(time) {
    if (!this.visible) return;
    this.terrainMat.uniforms.time.value = time;
    this.meteorTrail.material.uniforms.time.value = time;
    this.meteorCore.rotation.x = time * 5;
    this.meteorCore.rotation.y = time * 3;
  }
}
