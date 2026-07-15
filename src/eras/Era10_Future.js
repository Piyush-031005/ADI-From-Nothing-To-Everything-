import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Era 10 — FUTURE
 * Loads 'cybercity.glb' from public/models/
 */
export class Era10_Future {
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
    // Cyberpunk Neon Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    this.group.add(ambient);
    
    const neonPink = new THREE.PointLight(0xff00ff, 200, 100);
    neonPink.position.set(-10, 10, -10);
    this.group.add(neonPink);

    const neonCyan = new THREE.PointLight(0x00ffff, 200, 100);
    neonCyan.position.set(10, 5, 0);
    this.group.add(neonCyan);
  }

  _loadModel() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      '/models/cybercity.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(0.5);
        model.position.set(0, -5, 0);
        this.modelGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.warn("No cybercity.glb found. Please download one and place in public/models/. Rendering placeholder.");
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(10, 10, 2, 32),
          new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: true })
        );
        mesh.position.set(0, -5, 0);
        this.modelGroup.add(mesh);
      }
    );
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 50),
      new THREE.Vector3(-25, 15, 35),
      new THREE.Vector3(-30, -5, 20),
      new THREE.Vector3(0, 0, 18),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
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
      this.modelGroup.rotation.y = t * Math.PI * 0.1;
    }
  }

  update(time) {
    if (!this.visible) return;
    if (this.mixer) {
      this.mixer.update(0.016);
    }
  }
}
