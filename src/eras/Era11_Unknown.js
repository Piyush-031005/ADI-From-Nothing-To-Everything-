import * as THREE from 'three';

/**
 * Era 11 — THE UNKNOWN WORLD
 * A surreal, beautiful multiverse landscape.
 * Floating islands, bioluminescent flora, multiple moons.
 */
export class Era11_Unknown {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildSky();
    this._buildFloatingIslands();
    this._buildEnergyCore();
  }

  _buildSky() {
    // Multi-moon surreal sky
    this.moons = new THREE.Group();
    
    const mat1 = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 });
    const moon1 = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 32), mat1);
    moon1.position.set(-60, 40, -100);
    this.moons.add(moon1);
    
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
    const moon2 = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), mat2);
    moon2.position.set(40, 60, -120);
    this.moons.add(moon2);

    this.group.add(this.moons);

    // Nebula fog
    const geo = new THREE.SphereGeometry(150, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a0033,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.nebula = new THREE.Mesh(geo, mat);
    this.group.add(this.nebula);
  }

  _buildFloatingIslands() {
    this.islands = new THREE.Group();
    
    const iGeo = new THREE.CylinderGeometry(5, 0, 10, 6, 1, false);
    const iMat = new THREE.MeshStandardMaterial({ 
      color: 0x0a1a2a, 
      roughness: 0.9, 
      flatShading: true 
    });

    const fGeo = new THREE.SphereGeometry(0.5, 8, 8); // Flora
    const fMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

    for (let i = 0; i < 15; i++) {
      const island = new THREE.Group();
      
      const rock = new THREE.Mesh(iGeo, iMat);
      // add some procedural noise displacement to the rock geometry
      const pos = rock.geometry.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setY(j, pos.getY(j) + (Math.random() - 0.5) * 2);
      }
      rock.geometry.computeVertexNormals();
      island.add(rock);

      // Add glowing flora
      for(let k=0; k<5; k++) {
        const flora = new THREE.Mesh(fGeo, fMat);
        flora.position.set(
          (Math.random() - 0.5) * 6,
          5 + Math.random() * 2,
          (Math.random() - 0.5) * 6
        );
        island.add(flora);
      }

      island.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40 - 10,
        -20 - Math.random() * 60
      );
      
      // Store random phase for floating animation
      island.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        baseY: island.position.y
      };

      this.islands.add(island);
    }
    
    // Add ambient light for the islands
    const light = new THREE.HemisphereLight(0xff00ff, 0x00ffff, 1.0);
    this.group.add(light);
    
    this.group.add(this.islands);
  }

  _buildEnergyCore() {
    // A mysterious glowing core in the center
    const geo = new THREE.IcosahedronGeometry(3, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.core = new THREE.Mesh(geo, mat);
    this.core.position.set(0, 0, -30);
    this.group.add(this.core);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(-10, -5, 0),
      new THREE.Vector3(5, 5, -15),
      new THREE.Vector3(0, 0, -25),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -30) };
  }

  show(duration = 1.5) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.nebula.material.opacity = t * 0.8;
      this.core.material.opacity = t;
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
      this.nebula.material.opacity = f * 0.8;
      this.core.material.opacity = f;
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Spin the core as we approach
    this.core.rotation.y = t * Math.PI * 2;
    this.core.rotation.x = t * Math.PI;
    this.core.scale.setScalar(1.0 + t * 2.0);
  }

  update(time) {
    if (!this.visible) return;
    
    // Float islands
    this.islands.children.forEach(island => {
      island.position.y = island.userData.baseY + Math.sin(time * island.userData.speed + island.userData.phase) * 2.0;
      island.rotation.y = time * 0.1 * island.userData.speed;
    });

    this.core.rotation.z = time * 0.5;
  }
}
