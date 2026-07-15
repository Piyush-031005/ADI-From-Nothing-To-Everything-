import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 11 — THE UNKNOWN WORLD
 * The final frontier. Incorporates the 'space.glb' premium model alongside the Holographic Specimen anomaly.
 */
export class Era11_Unknown {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.clock = new THREE.Clock();
    this.mixers = [];

    this._buildSpecimenAnomaly();
    this._loadSpaceModel();
  }

  _loadSpaceModel() {
    const loader = new GLTFLoader();
    
    // Load the user's space.glb
    loader.load('/models/space.glb', (gltf) => {
      this.spaceModel = gltf.scene;
      
      // Position it in the vast background or around the anomaly
      this.spaceModel.position.set(0, 0, -100);
      this.spaceModel.scale.set(50, 50, 50); // Scale up massively to serve as an environment
      
      this.group.add(this.spaceModel);
      
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.spaceModel);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    }, undefined, (e) => console.error("Error loading space.glb", e));
    
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.group.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xaaccff, 2.0);
    dirLight.position.set(100, 100, 50);
    this.group.add(dirLight);
  }

  _buildSpecimenAnomaly() {
    // The massive, iridescent, holographic alien anomaly
    const geo = new THREE.IcosahedronGeometry(25, 64);
    
    this.mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vNoise;
        
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
          
          float n = snoise(position * 0.1 + time * 0.3) * 5.0;
          vNoise = n;
          
          vec3 newPos = position + normal * n;
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
          // Iridescent / Specimen Inverted Colors
          vec3 color1 = vec3(0.0, 1.0, 0.8); // Cyan
          vec3 color2 = vec3(1.0, 0.0, 0.5); // Magenta
          vec3 color3 = vec3(0.5, 0.0, 1.0); // Purple
          
          vec3 mix1 = mix(color1, color2, sin(vNoise + time) * 0.5 + 0.5);
          vec3 baseColor = mix(mix1, color3, cos(vNoise - time) * 0.5 + 0.5);
          
          // Fresnel Holographic Edge
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnelTerm = dot(viewDir, normal);
          fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
          fresnelTerm = pow(fresnelTerm, 1.5);
          
          // Inverted / X-Ray look: Dark core, glowing edges
          vec3 finalColor = baseColor * fresnelTerm * 2.0;
          
          // Scanlines
          float scanline = sin(vUv.y * 200.0 - time * 10.0) * 0.5 + 0.5;
          finalColor += vec3(0.1) * scanline * fresnelTerm;
          
          gl_FragColor = vec4(finalColor, fresnelTerm);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    this.anomaly = new THREE.Mesh(geo, this.mat);
    this.group.add(this.anomaly);
    
    // Background deep space dust
    const dustGeo = new THREE.BufferGeometry();
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 400;
      pos[i*3+1] = (Math.random() - 0.5) * 400;
      pos[i*3+2] = (Math.random() - 0.5) * 400 - 50;
    }
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 0.8, color: 0x88ccff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending
    }));
    this.group.add(this.dust);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 120),
      new THREE.Vector3(50, 20, 60),
      new THREE.Vector3(-30, -20, 30),
      new THREE.Vector3(0, 0, 10), // Dive right into the anomaly
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -20) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    this.anomaly.scale.set(0.01, 0.01, 0.01);
    
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      const easeT = 1.0 - Math.pow(1.0 - t, 3);
      this.anomaly.scale.set(easeT, easeT, easeT);
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
      this.anomaly.scale.set(easeT, easeT, easeT);
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // If we reach the absolute end, trigger the final message via DOM (already handled in main.js)
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();
    
    this.mat.uniforms.time.value = time;
    this.anomaly.rotation.y = time * 0.15;
    this.anomaly.rotation.z = time * 0.1;
    this.dust.rotation.y = time * -0.02;

    this.mixers.forEach(m => m.update(delta));

    if (this.spaceModel) {
      this.spaceModel.rotation.y = time * 0.05;
    }
  }
}
