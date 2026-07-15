import * as THREE from 'three';

/**
 * Era 6 — EARTH
 * Highly realistic procedural Earth shader.
 * Features continents, glowing magma trenches, and a cinematic atmospheric Fresnel edge-glow.
 */
export class Era6_Earth {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildEarth();
  }

  _buildEarth() {
    const geo = new THREE.SphereGeometry(15, 128, 128);

    // Advanced Atmospheric & Topographical Shader
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        // Simplex 3D Noise
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
          vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
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
          vNormal = normalize(normalMatrix * normal);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          // Generate continent / ocean noise
          float n1 = snoise(position * 0.15 + time * 0.05);
          float n2 = snoise(position * 0.4 - time * 0.02) * 0.5;
          float n3 = snoise(position * 2.0) * 0.1;
          vNoise = n1 + n2 + n3;
          
          // Slight physical displacement for mountains
          vec3 newPos = position;
          if (vNoise > 0.1) {
            newPos += normal * (vNoise * 0.5);
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        void main() {
          // Palette
          vec3 ocean = vec3(0.01, 0.05, 0.15); // Deep space blue
          vec3 magma = vec3(1.0, 0.3, 0.0);    // Volcanic trenches
          vec3 land = vec3(0.05, 0.04, 0.03);  // Cooling basalt crust
          vec3 atmosphere = vec3(0.4, 0.7, 1.0); // Majestic blue atmosphere
          
          // Determine terrain type
          vec3 baseColor;
          if (vNoise < -0.2) {
            // Magma cracks
            float glow = smoothstep(-0.2, -0.6, vNoise) * (0.8 + 0.2 * sin(time * 5.0));
            baseColor = mix(ocean, magma, glow);
          } else if (vNoise < 0.1) {
            // Oceans
            baseColor = ocean;
          } else {
            // Continents
            baseColor = land;
          }
          
          // Calculate Fresnel (Atmospheric Edge Glow)
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnelTerm = dot(viewDir, normal);
          fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
          fresnelTerm = pow(fresnelTerm, 3.0); // Sharpness of the edge
          
          // Add atmosphere to the edge
          vec3 finalColor = baseColor + (atmosphere * fresnelTerm * 1.5);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.group.add(this.mesh);
    
    // Distant background starfield
    const starGeo = new THREE.BufferGeometry();
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 400;
      pos[i*3+1] = (Math.random() - 0.5) * 400;
      pos[i*3+2] = (Math.random() - 0.5) * 400 - 100;
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.5, color: 0xffffff, transparent: true, opacity: 0.3 }));
    this.group.add(this.stars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(20, 5, 20),
      new THREE.Vector3(-10, -5, -15),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    this.mesh.scale.set(0.01, 0.01, 0.01);
    
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const easeT = 1.0 - Math.pow(1.0 - t, 3);
      this.mesh.scale.set(easeT, easeT, easeT);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const easeT = 1.0 - Math.pow(t, 3);
      this.mesh.scale.set(easeT, easeT, easeT);
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Optional timeline interactions
  }

  update(time) {
    if (!this.visible) return;
    this.mat.uniforms.time.value = time;
    this.mesh.rotation.y = time * 0.1;
  }
}
