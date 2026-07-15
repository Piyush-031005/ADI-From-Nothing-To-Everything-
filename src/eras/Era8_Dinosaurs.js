import * as THREE from 'three';

/**
 * Era 8 — DINOSAURS (Digital Ecology Scan)
 * X-Ray Wireframe Meteor Impact to simulate a data scan of the past.
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
    const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
    geo.rotateX(-Math.PI * 0.5);
    
    // X-Ray Wireframe shader
    this.terrainMat = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0 },
        uImpact: { value: 0 } 
      },
      vertexShader: `
        uniform float time;
        uniform float uImpact;
        varying vec3 vPos;
        
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
          vec3 pos = position;
          float h = snoise(pos.xz * 0.05) * 6.0;
          
          float dist = length(pos.xz);
          float crater = smoothstep(40.0, 0.0, dist) * -15.0;
          float rim = smoothstep(60.0, 30.0, dist) * smoothstep(10.0, 30.0, dist) * 5.0;
          
          pos.y = mix(h, h + crater + rim, uImpact);
          vPos = pos;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float uImpact;
        varying vec3 vPos;
        
        void main() {
          // Grid / Scanline effect
          float gridX = step(0.95, fract(vPos.x * 0.5));
          float gridZ = step(0.95, fract(vPos.z * 0.5));
          float grid = max(gridX, gridZ);
          
          vec3 color = vec3(0.0, 1.0, 0.5) * grid; // Green scan
          
          // Flash red on impact
          color = mix(color, vec3(1.0, 0.0, 0.2) * grid, uImpact);
          
          float dist = gl_FragCoord.z / gl_FragCoord.w;
          float fog = smoothstep(20.0, 100.0, dist);
          color = mix(color, vec3(0.0), fog);

          gl_FragColor = vec4(color, grid * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      wireframe: true // Force wireframe for X-Ray aesthetic
    });
    this.terrain = new THREE.Mesh(geo, this.terrainMat);
    this.terrain.position.y = -10;
    this.group.add(this.terrain);
  }

  _buildMeteor() {
    this.meteorGroup = new THREE.Group();
    
    // Data Core of the meteor
    const geo = new THREE.IcosahedronGeometry(3, 1);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0xff3366, 
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.meteorCore = new THREE.Mesh(geo, mat);
    this.meteorGroup.add(this.meteorCore);
    
    // Trail (Particles as data points)
    const tGeo = new THREE.BufferGeometry();
    const count = 15000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 6;
      pos[i*3+1] = Math.random() * 50; 
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
          p.x += sin(p.y * 0.5 + time * 15.0) * (p.y * 0.05);
          p.z += cos(p.y * 0.5 + time * 15.0) * (p.y * 0.05);
          gl_PointSize = (4.0 / p.y) * (15.0 / - (modelViewMatrix * vec4(p, 1.0)).z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vY;
        void main() {
          float alpha = smoothstep(50.0, 0.0, vY);
          vec3 col = mix(vec3(1.0, 0.0, 0.2), vec3(1.0, 0.8, 0.2), alpha);
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

    // Scan Flash
    const flashGeo = new THREE.PlaneGeometry(200, 200);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
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
      const easeMt = Math.pow(mt, 3.0);
      this.meteorGroup.position.set(
        THREE.MathUtils.lerp(-100, 0, easeMt),
        THREE.MathUtils.lerp(100, -10, easeMt),
        THREE.MathUtils.lerp(-100, 0, easeMt)
      );
      this.meteorGroup.visible = true;
      this.terrainMat.uniforms.uImpact.value = 0; 
      this.flash.material.opacity = 0;
    } else {
      this.meteorGroup.visible = false;
      const postT = (t - 0.7) / 0.3; 
      this.terrainMat.uniforms.uImpact.value = 1.0; 
      
      if (postT < 0.2) {
        this.flash.material.opacity = 1.0; 
      } else {
        this.flash.material.opacity = 1.0 - ((postT - 0.2) / 0.8);
      }
    }
  }

  update(time) {
    if (!this.visible) return;
    this.terrainMat.uniforms.time.value = time;
    this.meteorTrail.material.uniforms.time.value = time;
    this.meteorCore.rotation.x = time * 2;
    this.meteorCore.rotation.y = time * 1.5;
  }
}
