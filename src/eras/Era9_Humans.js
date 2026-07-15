import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Procedural primitive cave wall with glowing handprints, morphing into DNA / Neural Net.
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildCaveWall();
    this._buildDNAHelix();
  }

  _buildCaveWall() {
    // A massive rock wall representing primitive humanity
    const geo = new THREE.PlaneGeometry(80, 40, 128, 64);
    
    // Displace the wall to look like a cave
    const pos = geo.attributes.position;
    for(let i=0; i<pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Simple math noise
      const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3.0 + Math.sin(x * 0.5) * 0.5;
      pos.setZ(i, noise);
    }
    geo.computeVertexNormals();

    this.caveMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 0 } // 0 = Cave visible, 1 = Cave shattered/invisible
      },
      vertexShader: `
        uniform float uFade;
        varying vec2 vUv;
        varying float vZ;
        void main() {
          vUv = uv;
          vec3 p = position;
          // Shatter effect when morphing
          p.z -= uFade * 20.0 * (sin(p.x * 10.0) * cos(p.y * 10.0));
          p.y -= uFade * 10.0;
          vZ = p.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFade;
        varying vec2 vUv;
        varying float vZ;
        
        void main() {
          vec3 rockColor = vec3(0.15, 0.1, 0.05) + (vZ * 0.02);
          
          // Procedural Handprints (circles for palms, lines for fingers - highly simplified for shader)
          // We'll place a few glowing "paintings" using distance fields
          vec2 center1 = vec2(0.4, 0.5);
          vec2 center2 = vec2(0.6, 0.4);
          
          float d1 = length(vUv - center1);
          float d2 = length(vUv - center2);
          
          float hand1 = smoothstep(0.05, 0.04, d1);
          float hand2 = smoothstep(0.04, 0.03, d2);
          
          vec3 paintColor = vec3(0.8, 0.3, 0.1); // Ochre red
          // Flickering firelight effect on the paint
          paintColor *= 0.8 + 0.4 * sin(uTime * 5.0 + vUv.y * 10.0);
          
          vec3 finalColor = mix(rockColor, paintColor, max(hand1, hand2));
          
          float alpha = 1.0 - uFade;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.cave = new THREE.Mesh(geo, this.caveMat);
    this.cave.position.set(0, 0, -10);
    this.group.add(this.cave);
  }

  _buildDNAHelix() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const indices = new Float32Array(particleCount);

    const c1 = new THREE.Color(0x00ffff); // Digital Cyan
    const c2 = new THREE.Color(0xff00ff); // Digital Magenta

    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 20; 
      const radius = 2.0;
      const strand = i % 2; 
      const angle = t + (strand * Math.PI); 
      const noise = (Math.random() - 0.5) * 0.3;
      
      positions[i*3] = Math.cos(angle) * radius + noise;
      positions[i*3+1] = (i / particleCount) * 40 - 20; 
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
        
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        void main() {
          vColor = color;
          vec3 p = position;
          
          float angle = uTime * 0.5;
          float s = sin(angle);
          float c = cos(angle);
          p.xz = mat2(c, -s, s, c) * p.xz;

          vec3 brainPos = vec3(
            (hash(aIndex) - 0.5) * 30.0,
            (hash(aIndex * 1.5) - 0.5) * 20.0,
            (hash(aIndex * 2.0) - 0.5) * 30.0
          );
          
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
    this.dna.position.set(0, 0, -25); // Behind the cave wall initially
    this.group.add(this.dna);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),
      new THREE.Vector3(2, 2, 10),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(0, 0, -15), // Pushes through the cave into the digital net
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -25) };
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
    // 0 to 0.4: View Cave
    // 0.4 to 0.6: Cave fades out/shatters
    // 0.6 to 1.0: DNA morphs to Neural Net
    const caveFade = Math.max(0, Math.min(1, (t - 0.3) * 5.0));
    this.caveMat.uniforms.uFade.value = caveFade;
    
    // Reveal DNA as cave fades
    this.dnaMat.uniforms.uOpacity.value = caveFade;

    const morph = Math.max(0, Math.min(1, (t - 0.6) * 2.5));
    this.dnaMat.uniforms.uMorph.value = morph;
  }

  update(time) {
    if (!this.visible) return;
    this.caveMat.uniforms.uTime.value = time;
    this.dnaMat.uniforms.uTime.value = time;
  }
}
