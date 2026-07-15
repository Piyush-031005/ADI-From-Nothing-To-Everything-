import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Pure digital data scan. Massive glowing DNA strand morphing into a complex Neural Net.
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
    const particleCount = 15000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const indices = new Float32Array(particleCount);

    const c1 = new THREE.Color(0x00ffff); // Cyan (Scan color)
    const c2 = new THREE.Color(0xff3366); // Highlight Red

    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 40; 
      const radius = 5.0;
      const strand = i % 2; 
      const angle = t + (strand * Math.PI); 
      const noise = (Math.random() - 0.5) * 0.5;
      
      positions[i*3] = Math.cos(angle) * radius + noise;
      positions[i*3+1] = (i / particleCount) * 100 - 50; 
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
        uMorph: { value: 0 } // 0 = Helix, 1 = Neural Net chaos
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorph;
        attribute float aIndex;
        varying vec3 vColor;
        
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        void main() {
          vColor = color;
          vec3 p = position;
          
          float angle = uTime * 0.5;
          float s = sin(angle);
          float c = cos(angle);
          p.xz = mat2(c, -s, s, c) * p.xz;

          // Target neural net position
          vec3 brainPos = vec3(
            (hash(aIndex) - 0.5) * 50.0,
            (hash(aIndex * 1.5) - 0.5) * 40.0,
            (hash(aIndex * 2.0) - 0.5) * 50.0
          );
          
          brainPos *= 1.0 + sin(uTime * 2.0 + aIndex) * 0.1;
          
          // Glitch / Scan jitter
          float glitch = step(0.98, hash(uTime * aIndex)) * 5.0;
          p.x += glitch;
          
          p = mix(p, brainPos, uMorph);
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = mix(3.0, 8.0, uMorph) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          // Sharp data points instead of soft dots
          gl_FragColor = vec4(vColor, 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.dna = new THREE.Points(geo, this.dnaMat);
    this.group.add(this.dna);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -30, 20),
      new THREE.Vector3(10, 0, 15),
      new THREE.Vector3(-10, 20, 10),
      new THREE.Vector3(0, 0, 0), 
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -20) };
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
    // 0 to 1.0: DNA morphs to Neural Net continuously
    this.dnaMat.uniforms.uMorph.value = t;
  }

  update(time) {
    if (!this.visible) return;
    this.dnaMat.uniforms.uTime.value = time;
  }
}
