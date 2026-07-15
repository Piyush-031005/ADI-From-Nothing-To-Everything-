import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 10 — THE FUTURE
 * Ultra-premium Cyberpunk City using multiple 3D models.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.mixers = [];
    this.clock = new THREE.Clock();

    // Remove the old procedural boxes and use the premium 3D models
    this._loadModels();
  }

  _loadModels() {
    const loader = new GLTFLoader();

    // 1. Cyberpunk City Environment
    loader.load('/models/future/cyberpunk_city_-_1.glb', (gltf) => {
      this.city = gltf.scene;
      this.city.position.set(0, -30, -50);
      this.city.scale.set(0.1, 0.1, 0.1); // Scale adjustment
      
      // Enhance emissive materials in the city for the cyberpunk glow
      this.city.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.emissive) {
            child.material.emissiveIntensity = 2.0;
          }
        }
      });

      this.group.add(this.city);
    }, undefined, (e) => console.error("Error loading City", e));

    // 2. Flying Hovercar
    loader.load('/models/future/free_cyberpunk_hovercar.glb', (gltf) => {
      this.car = gltf.scene;
      this.car.position.set(0, 10, -20);
      this.car.scale.set(0.05, 0.05, 0.05);
      this.group.add(this.car);
      
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.car);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    }, undefined, (e) => console.error("Error loading Hovercar", e));

    // 3. Ground Robot
    loader.load('/models/future/biped_robot.glb', (gltf) => {
      this.robot = gltf.scene;
      // Position robot on a platform or foreground
      this.robot.position.set(-10, -10, 10);
      this.robot.rotation.y = Math.PI / 4;
      this.robot.scale.set(2.0, 2.0, 2.0); 
      this.group.add(this.robot);
      
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.robot);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    }, undefined, (e) => console.error("Error loading Robot", e));
    
    // Lighting for the city
    const ambient = new THREE.AmbientLight(0xffaaee, 2.0); // Pink/Purple Cyberpunk ambient
    this.group.add(ambient);
    
    const blueSpot = new THREE.SpotLight(0x00aaff, 50.0);
    blueSpot.position.set(50, 50, 50);
    blueSpot.lookAt(0,0,0);
    this.group.add(blueSpot);

    const pinkSpot = new THREE.SpotLight(0xff00ff, 50.0);
    pinkSpot.position.set(-50, 50, -50);
    pinkSpot.lookAt(0,0,0);
    this.group.add(pinkSpot);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 20, 80),   // High overview
      new THREE.Vector3(-20, 5, 30),  // Swoop down near robot
      new THREE.Vector3(10, 5, 0),    // Fly past hovercar
      new THREE.Vector3(0, 10, -30),  // Deep into city
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 5, -50) };
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
    // Optional
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();

    // Update animations
    this.mixers.forEach(mixer => mixer.update(delta));

    // Animate Hovercar flying through the city
    if (this.car) {
      this.car.position.x = Math.sin(time * 0.5) * 30;
      this.car.position.z = Math.cos(time * 0.5) * 30 - 20;
      this.car.position.y = 10 + Math.sin(time * 2.0) * 2.0; // Hover bobbing
      
      // Point car in direction of travel
      const targetX = Math.sin((time + 0.1) * 0.5) * 30;
      const targetZ = Math.cos((time + 0.1) * 0.5) * 30 - 20;
      this.car.lookAt(targetX, this.car.position.y, targetZ);
    }
    
    // Slow city rotation for cinematic feel
    if (this.city) {
      this.city.rotation.y = Math.sin(time * 0.1) * 0.2;
    }
  }
}
