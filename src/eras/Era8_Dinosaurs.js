import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Era 8 — DINOSAURS
 * Loads 'trex.glb' from public/models/
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this._buildEnvironment();
    this._loadModel();
  }

  _buildEnvironment() {
    // Cinematic Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.group.add(ambient);
    
    const spot = new THREE.SpotLight(0xffaa55, 500);
    spot.position.set(-10, 20, -10);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    this.group.add(spot);

    const rim = new THREE.DirectionalLight(0x5588ff, 2.0);
    rim.position.set(10, 5, -20);
    this.group.add(rim);

    // Simple ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    this.group.add(ground);
  }

  _loadModel() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      '/models/trex.glb',
      (gltf) => {
        const model = gltf.scene;
        // Center and scale model depending on its native size
        // We'll apply a generic scale, the user can adjust in Blender if needed
        model.scale.setScalar(2);
        model.position.set(0, -2, -15);
        this.modelGroup.add(model);
        
        // Handle animations if they exist
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.warn("No trex.glb found. Please download one and place in public/models/. Rendering placeholder.");
        // Placeholder
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(4, 8, 12),
          new THREE.MeshStandardMaterial({ color: 0xff3300, wireframe: true })
        );
        mesh.position.set(0, 2, -15);
        this.modelGroup.add(mesh);
      }
    );
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),
      new THREE.Vector3(-15, 8, 10),
      new THREE.Vector3(-8, 3, 0),
      new THREE.Vector3(0, 4, -8),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 2, -15) };
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
    if (this.modelGroup) {
      this.modelGroup.rotation.y = t * Math.PI * 0.2;
    }
  }

  update(time) {
    if (!this.visible) return;
    if (this.mixer) {
      this.mixer.update(0.016); // Approx 60fps delta
    }
  }
}
