import * as THREE from 'three';

/**
 * Era 11 — THE UNKNOWN WORLD (Specimen Scan)
 * A massive, iridescent, holographic alien blob being scanned by the HUD.
 */
export class Era11_Unknown {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildSpecimen();
    this._buildDeepSpace();
  }

  _buildSpecimen() {
    // High poly sphere for smooth vertex displacement
    const geo = new THREE.SphereGeometry(6, 256, 256);
    
    // The "Specimen" Shader - Iridescent, inverted, glitching holographic fluid
    this.specimenMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
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
          vNormal = normalize(normalMatrix * normal);
          
          vec3 p = position;
          
          // Violent, glitchy liquid morphing
          float noise = snoise(p * 0.4 + uTime * 0.8) * 2.0;
          
          // Add micro-glitches based on time
          float glitch = step(0.98, fract(sin(dot(p.xy, vec2(12.9898,78.233))) * 43758.5453 + uTime)) * 0.5;
          
          p += normal * (noise + glitch);
          vNoise = noise;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        void main() {
          // X-Ray / Holographic Colors
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = dot(viewDir, vNormal);
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          
          // Striations/Bands to simulate scan lines on the organism
          float scan = step(0.5, fract(vUv.y * 50.0 + vNoise));
          
          // "Blue Flax" / Digital Ecology Palette: Electric Blue, White, Cyan
          vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
          vec3 color2 = vec3(1.0, 1.0, 1.0); // Pure White core
          vec3 color3 = vec3(0.1, 0.2, 1.0); // Deep Blue
          
          vec3 baseColor = mix(color3, color1, smoothstep(0.0, 0.8, fresnel));
          baseColor = mix(baseColor, color2, pow(fresnel, 3.0));
          
          // Apply scan lines
          baseColor *= (0.5 + scan * 0.5);
          
          // Edge glow
          float edgeGlow = pow(fresnel, 4.0) * 3.0;
          
          vec3 finalColor = baseColor + vec3(edgeGlow);
          
          gl_FragColor = vec4(finalColor, uOpacity * fresnel * 1.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.specimen = new THREE.Mesh(geo, this.specimenMat);
    this.group.add(this.specimen);
    
    // Add an inner wireframe to make it look like a technical model
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });
    this.specimenWire = new THREE.Mesh(geo, wireMat);
    this.specimenWire.scale.setScalar(1.01);
    this.group.add(this.specimenWire);
  }

  _buildDeepSpace() {
    // Technical data points floating around the specimen
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const r = 20 + Math.random() * 50;
      const phi = Math.acos((Math.random() * 2) - 1);
      const theta = Math.random() * Math.PI * 2;
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff3366, size: 0.2, transparent: true, opacity: 0.8
    });
    this.stars = new THREE.Points(geo, mat);
    this.group.add(this.stars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 40),
      new THREE.Vector3(-10, 5, 25),
      new THREE.Vector3(0, 0, 15),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    
    // Trigger final message from UI
    const finalMsg = document.getElementById('final-message');
    if (finalMsg) finalMsg.classList.add('visible');

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.specimenMat.uniforms.uOpacity.value = t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    
    const finalMsg = document.getElementById('final-message');
    if (finalMsg) finalMsg.classList.remove('visible');

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const f = 1 - t;
      this.specimenMat.uniforms.uOpacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Specimen pulses based on scroll
    const scale = 1.0 + t * 0.3;
    this.specimen.scale.setScalar(scale);
    this.specimenWire.scale.setScalar(scale * 1.01);
  }

  update(time) {
    if (!this.visible) return;
    this.specimenMat.uniforms.uTime.value = time;
    this.specimen.rotation.y = time * 0.3;
    this.specimen.rotation.z = time * 0.15;
    
    // Copy rotation to wireframe but displace vertex slightly using same time
    this.specimenWire.rotation.copy(this.specimen.rotation);
    // Since wireframe is a BasicMaterial, it won't displace on GPU unless we use ShaderMaterial, 
    // but the rotation match is enough to look like a scanning shell.
    
    this.stars.rotation.y = time * -0.05;
  }
}
