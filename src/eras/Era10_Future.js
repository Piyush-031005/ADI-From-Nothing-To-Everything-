import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 10 — THE FUTURE
 * Cyberpunk Space Wheel (space_station_3.glb) + Hovercars + Robots.
 * Uses Auto-Scaling to ensure all 3D assets fit the viewport.
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

    this._loadModels();
  }

  // Auto-scaler ensures models of any size fit perfectly into the scene
  _autoScale(model, targetSize, keepBottomAtZero = true) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim === 0) return;
    
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);
    
    if (keepBottomAtZero) {
      // Re-calculate box after scaling to offset Y so it stands on the ground
      const newBox = new THREE.Box3().setFromObject(model);
      const bottomY = newBox.min.y;
      model.position.y -= bottomY; 
    }
  }

  _loadModels() {
    const loader = new GLTFLoader();

    // 1. Cyberpunk Wheel Environment (space_station_3.glb)
    loader.load('/models/future/space_station_3.glb', (gltf) => {
      this.city = gltf.scene;
      this.group.add(this.city);

      this._autoScale(this.city, 300, false); // Massive environment
      this.city.position.set(0, -100, -150); 
      
      this.city.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.emissive) {
            child.material.emissiveIntensity = 2.0;
          }
          child.material.envMapIntensity = 1.0;
          child.material.depthWrite = true;
        }
      });

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.city);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    });

    // 2. Flying Hovercar
    loader.load('/models/future/free_cyberpunk_hovercar.glb', (gltf) => {
      this.car = gltf.scene;
      this.group.add(this.car);
      
      this._autoScale(this.car, 8, false); // 8 units big
      this.car.position.set(0, 10, -30);
      
      this.car.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1.0;
          child.material.depthWrite = true;
        }
      });

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.car);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    });

    // 3. Ground Robot
    loader.load('/models/future/biped_robot.glb', (gltf) => {
      this.robot = gltf.scene;
      this.group.add(this.robot);
      
      // Auto-scale robot to be 15 units tall (perfect screen size)
      this._autoScale(this.robot, 15);
      
      this.robot.position.set(-10, -15, 10);
      this.robot.rotation.y = Math.PI / 4;
      
      this.robot.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1.0;
          child.material.depthWrite = true;
        }
      });

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.robot);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    });
    
    // Cyberpunk Lighting
    const ambient = new THREE.AmbientLight(0xffaaee, 2.0); // Pink/Purple ambient
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
      new THREE.Vector3(0, 20, 80),   
      new THREE.Vector3(-20, 5, 30),  
      new THREE.Vector3(10, 5, 0),    
      new THREE.Vector3(0, 10, -30),  
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
    // Timeline logic
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();

    this.mixers.forEach(mixer => mixer.update(delta));

    // Animate Hovercar flying
    if (this.car) {
      this.car.position.x = Math.sin(time * 0.5) * 40;
      this.car.position.z = Math.cos(time * 0.5) * 40 - 40;
      this.car.position.y = 10 + Math.sin(time * 2.0) * 2.0; 
      
      const targetX = Math.sin((time + 0.1) * 0.5) * 40;
      const targetZ = Math.cos((time + 0.1) * 0.5) * 40 - 40;
      this.car.lookAt(targetX, this.car.position.y, targetZ);
    }
    
    // Rotate massive wheel environment
    if (this.city) {
      this.city.rotation.y = time * 0.02;
    }
  }
}
