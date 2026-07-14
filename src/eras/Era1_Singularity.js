import * as THREE from 'three';
import vertexShader   from '../shaders/singularity/vertex.glsl';
import fragmentShader from '../shaders/singularity/fragment.glsl';

/**
 * Era 1 — SINGULARITY
 * All of spacetime compressed to an infinite density point.
 * Gravitational lensing intensifies, photon ring appears.
 */
export class Era1_Singularity {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildLensQuad();
    this._buildParticleRing();
  }

  _buildLensQuad() {
    this.uniforms = {
      uTime:       { value: 0 },
      uProgress:   { value: 1.0 },
      uDistortion: { value: 0.8 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const mat = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geo, mat);
    this.quad.frustumCulled = false;
    this.quad.visible = false;
    this.exp.scene.add(this.quad);
  }

  _buildParticleRing() {
    const geo = new THREE.SphereGeometry(0.8, 64, 64);
    
    this.coreUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#ffffff') },
      uColor2: { value: new THREE.Color('#c8a96e') }
    };
    
    const mat = new THREE.ShaderMaterial({
      uniforms: this.coreUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) { 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }
        
        void main() {
          vUv = uv;
          vNormal = normal;
          
          // Throb and distort
          float noise = snoise(position * 2.0 + uTime * 2.0);
          vec3 newPos = position + normal * (noise * 0.1);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          float pulse = sin(uTime * 5.0 + vUv.y * 10.0) * 0.5 + 0.5;
          vec3 color = mix(uColor1, uColor2, pulse);
          
          // Fresnel edge glow
          float viewDot = max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
          float edgeGlow = pow(1.0 - viewDot, 2.0);
          
          gl_FragColor = vec4(color * (1.0 + edgeGlow * 2.0), 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.core = new THREE.Mesh(geo, mat);
    this.core.visible = false;
    this.exp.scene.add(this.core);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 6),
      new THREE.Vector3(1, 0.5, 4),
      new THREE.Vector3(0, 0,   2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 0.8) {
    this.visible = true;
    this.quad.visible = true;
    this.core.visible = true;
    this.core.material.opacity = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.core.material.opacity = t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.5) {
    this.visible = false;
    const quad = this.quad;
    const core = this.core;
    const start = performance.now();
    const startOpacity = core.material.opacity;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      core.material.opacity = startOpacity * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { quad.visible = false; core.visible = false; }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Lensing maxes out at end of era
    this.uniforms.uDistortion.value = 0.5 + t * 1.5;
    this.uniforms.uProgress.value   = 0.8 + t * 0.2;
    // Core scales up and throbs more
    if (this.core) {
      this.core.scale.setScalar(1.0 + t * 0.5);
    }
  }

  update(time) {
    if (!this.visible) return;
    this.uniforms.uTime.value = time;
    if (this.core) {
      this.coreUniforms.uTime.value = time;
      this.core.rotation.y = time * 0.5;
      this.core.rotation.x = time * 0.2;
    }
  }
}
