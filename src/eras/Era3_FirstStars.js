import * as THREE from 'three';

/**
 * Era 3 — FIRST STARS
 * High-performance, majestic spiral galaxies.
 * Uses custom soft-glow shader for stars instead of noisy pixel rendering.
 */
export class Era3_FirstStars {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildGalaxies();
  }

  _buildGalaxies() {
    const numGalaxies = 4;
    this.galaxies = [];
    
    for(let g = 0; g < numGalaxies; g++) {
      // Drastically reduced particle count to fix lag (5,000 instead of 20,000)
      const particleCount = 5000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      const insideColor = new THREE.Color(0xffbb77); // Warm bright core
      const outsideColor = new THREE.Color(0x3388ff); // Deep blue arms
      
      const branches = 3 + Math.floor(Math.random() * 3);
      const spin = 2.5;
      const radius = 25 + Math.random() * 15;

      for(let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const r = Math.random() * radius;
        const branchAngle = (i % branches) / branches * Math.PI * 2;
        const spinAngle = r * spin;

        // Tighter core, looser arms (exponential distribution)
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.15);
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.15);
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.15);

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY * 0.4; // Flattened disc
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        // Color mix
        const mixColor = outsideColor.clone();
        mixColor.lerp(insideColor, Math.pow(1.0 - (r / radius), 2.0));
        
        colors[i3    ] = mixColor.r;
        colors[i3 + 1] = mixColor.g;
        colors[i3 + 2] = mixColor.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Custom soft-glow shader for perfect, non-noisy stars
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0 }
        },
        vertexShader: `
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            // Size depends on distance to camera, making it volumetric
            gl_PointSize = 150.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            // Calculate distance from center of the point (0.5, 0.5)
            float dist = distance(gl_PointCoord, vec2(0.5));
            // Soft radial glow (0 at edges, bright at center)
            float strength = 0.05 / dist - 0.1;
            
            // Discard harsh edges
            if (strength < 0.0) discard;
            
            gl_FragColor = vec4(vColor, strength * uOpacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
      });

      const mesh = new THREE.Points(geo, mat);
      
      mesh.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 100 - 30
      );
      
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      this.group.add(mesh);
      this.galaxies.push(mesh);
    }
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, 80),
      new THREE.Vector3(30, 5, 40),
      new THREE.Vector3(-20, -5, 0),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -50) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    this.galaxies.forEach(g => g.material.uniforms.uOpacity.value = 0);
    
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.galaxies.forEach(g => g.material.uniforms.uOpacity.value = t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.galaxies.forEach(g => g.material.uniforms.uOpacity.value = (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Not used for galaxies
  }

  update(time) {
    if (!this.visible) return;
    this.galaxies.forEach((g, index) => {
      g.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1);
    });
  }
}
