import * as THREE from 'three';

/**
 * Era 3 — FIRST STARS
 * Thousands of sharp, high-definition stars forming massive spiral galaxies.
 * Smooth, majestic presentation without extreme zooming.
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
    const numGalaxies = 5;
    this.galaxies = [];
    
    for(let g = 0; g < numGalaxies; g++) {
      const particleCount = 20000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      const insideColor = new THREE.Color(0xffaa55); // Warm core
      const outsideColor = new THREE.Color(0x55aaff); // Blue arms
      
      const branches = 3 + Math.floor(Math.random() * 3);
      const spin = 2.0;
      const radius = 20 + Math.random() * 20;

      for(let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const r = Math.random() * radius;
        const branchAngle = (i % branches) / branches * Math.PI * 2;
        const spinAngle = r * spin;

        // Tighter core, looser arms
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.1);
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.1);
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.1);

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY * 0.5; // Flattened disc
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        // Color mix
        const mixColor = outsideColor.clone();
        mixColor.lerp(insideColor, 1.0 - (r / radius));
        
        colors[i3    ] = mixColor.r;
        colors[i3 + 1] = mixColor.g;
        colors[i3 + 2] = mixColor.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Crisp, small points
      const mat = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8
      });

      const mesh = new THREE.Points(geo, mat);
      
      // Randomly position galaxies in space
      mesh.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 150 - 50
      );
      
      // Random tilt
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      this.group.add(mesh);
      this.galaxies.push(mesh);
    }
  }

  getCameraPath() {
    // Smooth cinematic pan, NO extreme zoom
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
    this.galaxies.forEach(g => g.material.opacity = 0);
    
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.galaxies.forEach(g => g.material.opacity = t * 0.8);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    let start = performance.now();
    const tick = () => {
      let t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.galaxies.forEach(g => g.material.opacity = (1 - t) * 0.8);
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
    // Slow, majestic rotation
    this.galaxies.forEach((g, index) => {
      g.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1);
    });
  }
}
