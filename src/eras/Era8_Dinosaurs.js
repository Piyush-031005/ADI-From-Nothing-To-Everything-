import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS
 * Procedural volcanic terrain with asteroid impact.
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
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
    geo.rotateX(-Math.PI * 0.5);
    
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
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
          // create rugged terrain
          float h = snoise(pos.xz * 0.1) * 3.0;
          h += snoise(pos.xz * 0.5) * 0.5;
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
          vec3 rock = vec3(0.1, 0.1, 0.1);
          vec3 lava = vec3(0.9, 0.2, 0.0);
          
          // Lava in valleys
          float lavaGlow = smoothstep(0.5, -1.5, vHeight);
          lavaGlow *= (0.8 + 0.2 * sin(time * 2.0 + vUv.x * 50.0));
          
          vec3 color = mix(rock, lava, lavaGlow * 0.8);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.position.y = -5;
    this.group.add(this.terrain);
  }

  _buildAtmosphere() {
    const geo = new THREE.SphereGeometry(60, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x220500,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.atmosphere = new THREE.Mesh(geo, mat);
    this.group.add(this.atmosphere);
  }

  _buildMeteor() {
    const geo = new THREE.BufferGeometry();
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 4;
      pos[i*3+1] = (Math.random() - 0.5) * 4;
      pos[i*3+2] = (Math.random() - 0.5) * 4;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffaa00,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
      depthWrite: false
    });
    this.meteor = new THREE.Points(geo, mat);
    this.meteor.position.set(-30, 40, -40);
    this.group.add(this.meteor);

    // Impact flash
    const flashGeo = new THREE.PlaneGeometry(100, 100);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.flash = new THREE.Mesh(flashGeo, flashMat);
    this.flash.position.set(0, 0, -20);
    this.group.add(this.flash);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),
      new THREE.Vector3(-10, 8, 10),
      new THREE.Vector3(-5, 3, 0),
      new THREE.Vector3(0, 5, -10),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -2, -15) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.atmosphere.material.opacity = t * 0.8;
      this.meteor.material.opacity = t;
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
      this.atmosphere.material.opacity = f * 0.8;
      this.meteor.material.opacity = f;
      this.flash.material.opacity *= f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // T goes 0 to 1
    // Meteor travels and crashes at t=0.8
    if (t < 0.8) {
      const mt = t / 0.8;
      this.meteor.position.set(
        THREE.MathUtils.lerp(-30, 0, mt),
        THREE.MathUtils.lerp(40, -5, mt),
        THREE.MathUtils.lerp(-40, -10, mt)
      );
    }

    // Impact at t=0.85
    if (t > 0.85 && !this._impactTriggered) {
      this._impactTriggered = true;
      this._triggerImpact();
    }

    // Darkness closes in post-impact
    if (t > 0.9) {
      const darkness = (t - 0.9) / 0.1;
      this.backdrop.material.color.setRGB(1.0 - darkness, 1.0 - darkness, 1.0 - darkness);
    } else {
      this.backdrop.material.color.setHex(0xffffff);
    }
  }

  _triggerImpact() {
    this.impactFlash.visible = true;
    const mat = this.impactFlash.material;
    mat.opacity = 1;
    const start = performance.now();
    const dur = 1500;
    const tick = () => {
      const t = Math.min((performance.now() - start) / dur, 1);
      this.impactFlash.scale.setScalar(1 + t * 80);
      mat.opacity = 1 - t;
      if (t < 1) requestAnimationFrame(tick);
      else this.impactFlash.visible = false;
    };
    requestAnimationFrame(tick);
  }

  update(time) {
    if (!this.visible) return;
  }
}
