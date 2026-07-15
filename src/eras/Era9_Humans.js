import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Era 9 — HUMANS
 * Loads 'human.glb' from public/models/
 */
export class Era9_Humans {
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
    // Warm fire / sunset lighting
    const ambient = new THREE.AmbientLight(0x442211, 0.5);
    this.group.add(ambient);
    
    const fireLight = new THREE.PointLight(0xff5500, 300, 50);
    fireLight.position.set(2, -2, -5);
    this.group.add(fireLight);

    const rimLight = new THREE.DirectionalLight(0xaabbff, 1.0);
    rimLight.position.set(-10, 5, -15);
    this.group.add(rimLight);
  }

  _loadModel() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      '/models/human.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(2);
        model.position.set(0, -4, -10);
        this.modelGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.warn("No human.glb found. Please download one and place in public/models/. Rendering placeholder.");
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 6, 16),
          new THREE.MeshStandardMaterial({ color: 0xffaa55, wireframe: true })
        );
        mesh.position.set(0, -2, -10);
        this.modelGroup.add(mesh);
      }
    );
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(5, 2, 0),
      new THREE.Vector3(0, 0, -5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -2, -10) };
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
