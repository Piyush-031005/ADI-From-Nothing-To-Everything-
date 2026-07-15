import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Option B: Procedural Masterpiece (Glowing DNA Helix morphing to Neural Net)
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildDNAHelix();
  }

  _buildDNAHelix() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const indices = new Float32Array(particleCount);

    const c1 = new THREE.Color(0xff0088); // Pink
    const c2 = new THREE.Color(0x0088ff); // Blue

    for (let i = 0; i < particleCount; i++) {
      // Create two interwoven strands
      const t = (i / particleCount) * Math.PI * 20; // 10 turns
      const radius = 2.0;
      const strand = i % 2; // 0 or 1
      
      const angle = t + (strand * Math.PI); // Offset by 180 deg
      
      // Add slight noise to the structure
      const noise = (Math.random() - 0.5) * 0.3;
      
      positions[i*3] = Math.cos(angle) * radius + noise;
      positions[i*3+1] = (i / particleCount) * 40 - 20; // Y from -20 to 20
      positions[i*3+2] = Math.sin(angle) * radius + noise;
      
      const col = strand === 0 ? c1 : c2;
      colors[i*3] = col.r;
      colors[i*3+1] = col.g;
      colors[i*3+2] = col.b;
      
      indices[i] = i;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('aIndex', new THREE.Float32BufferAttribute(indices, 1));

    this.dnaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uMorph: { value: 0 } // 0 = Helix, 1 = Neural Net chaos
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorph;
        attribute float aIndex;
        varying vec3 vColor;
        
        // Pseudo-random hash
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        void main() {
          vColor = color;
          vec3 p = position;
          
          // Original helix rotation
          float angle = uTime * 0.5;
          float s = sin(angle);
          float c = cos(angle);
          p.xz = mat2(c, -s, s, c) * p.xz;

          // Morph to Neural Net (Chaos + connecting logic done visually)
          // We'll scatter the particles outwards to form a "brain" cloud
          vec3 brainPos = vec3(
            (hash(aIndex) - 0.5) * 20.0,
            (hash(aIndex * 1.5) - 0.5) * 15.0,
            (hash(aIndex * 2.0) - 0.5) * 20.0
          );
          
          // Expand brain volume slightly pulsing
          brainPos *= 1.0 + sin(uTime * 2.0 + aIndex) * 0.1;
          
          p = mix(p, brainPos, uMorph);
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = mix(6.0, 15.0, uMorph) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          float alpha = (0.5 - ll) * 2.0;
          
          gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.dna = new THREE.Points(geo, this.dnaMat);
    this.dna.position.set(0, 0, -15);
    this.group.add(this.dna);

    // Neural connections (Lines that only appear during morph)
    // To keep it performant, we'll draw lines between random points in the cloud
    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(particleCount * 3); // 1000 lines
    // Just map line vertices to particle vertices (shuffled)
    for(let i=0; i<particleCount*3; i++) {
      linePos[i] = positions[Math.floor(hash(i)*particleCount)*3 + (i%3)];
    }
    
    // Hash function in JS
    function hash(n) { return (Math.sin(n) * 43758.5453123) % 1.0; }
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 10),
      new THREE.Vector3(5, 0, 5),
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(0, 0, -5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -15) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.dnaMat.uniforms.uOpacity.value = t;
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
      this.dnaMat.uniforms.uOpacity.value = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Morph from DNA to Neural Net (Brain) as time progresses
    // Sharp transition around t=0.6
    const morph = Math.max(0, Math.min(1, (t - 0.5) * 3.0));
    this.dnaMat.uniforms.uMorph.value = morph;
    
    // Rise up slowly
    this.dna.position.y = t * 10 - 5;
  }

  update(time) {
    if (!this.visible) return;
    this.dnaMat.uniforms.uTime.value = time;
  }
}
