import * as THREE from 'three';

/**
 * Era 9 — HUMANS
 * Procedural Human Civilization: Glowing Earth with city lights, data links, satellites.
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildEarth();
    this._buildCities();
    this._buildDataLinks();
    this._buildSatellites();
  }

  _buildEarth() {
    const geo = new THREE.SphereGeometry(10, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x020510,
      transparent: true,
      opacity: 0
    });
    this.earth = new THREE.Mesh(geo, mat);
    this.group.add(this.earth);
  }

  _buildCities() {
    // Generate city dots on the sphere
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 10.05;
      
      // clump them randomly
      if (Math.random() > 0.3) {
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.cos(phi);
        pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      } else {
        pos[i*3] = 0; pos[i*3+1] = 0; pos[i*3+2] = 0; // hide
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffdd88,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
      depthWrite: false
    });
    this.cities = new THREE.Points(geo, mat);
    this.group.add(this.cities);
  }

  _buildDataLinks() {
    // Curves between cities
    const lines = new THREE.Group();
    const count = 100;
    
    const mat = new THREE.LineBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for(let i=0; i<count; i++) {
      const p1 = this._getRandomSpherePoint(10.05);
      const p2 = this._getRandomSpherePoint(10.05);
      
      const dist = p1.distanceTo(p2);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(10.05 + dist * 0.3); // curve outwards
      
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
      lines.add(new THREE.Line(geo, mat));
    }
    this.dataLinks = lines;
    this.group.add(this.dataLinks);
  }

  _getRandomSpherePoint(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  _buildSatellites() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const p = this._getRandomSpherePoint(12 + Math.random() * 5);
      pos[i*3] = p.x; pos[i*3+1] = p.y; pos[i*3+2] = p.z;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x00ffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0
    });
    this.satellites = new THREE.Points(geo, mat);
    this.group.add(this.satellites);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(15, 5, 20),
      new THREE.Vector3(20, -5, 10),
      new THREE.Vector3(15, 0, 5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.earth.material.opacity = t * 0.9;
      this.cities.material.opacity = t;
      this.satellites.material.opacity = t * 0.8;
      this.dataLinks.children.forEach(c => c.material.opacity = t * 0.5);
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
      this.earth.material.opacity = f * 0.9;
      this.cities.material.opacity = f;
      this.satellites.material.opacity = f * 0.8;
      this.dataLinks.children.forEach(c => c.material.opacity = f * 0.5);
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // T goes 0 to 1
    // Slowly build up civilization density
    this.dataLinks.visible = t > 0.3;
    this.satellites.visible = t > 0.5;
    
    // Scale up opacity of lights
    this.cities.material.opacity = t * 1.5;
  }

  update(time) {
    if (!this.visible) return;
    this.group.rotation.y = time * 0.1;
    this.satellites.rotation.y = time * 0.2;
    this.satellites.rotation.z = time * 0.1;
  }
}
