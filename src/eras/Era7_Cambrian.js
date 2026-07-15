import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Era 7 — CAMBRIAN
 * Loads 'cambrian.glb' from public/models/
 */
export class Era7_Cambrian {
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
    // Underwater Caustic Lighting
    const ambient = new THREE.AmbientLight(0x004455, 0.5);
    this.group.add(ambient);
    
    const topLight = new THREE.DirectionalLight(0x55ccff, 2.0);
    topLight.position.set(0, 20, 0);
    this.group.add(topLight);
    
    // Add some volumetric fog/godrays simulation using point light
    const pointLight = new THREE.PointLight(0x00ffaa, 50, 100);
    pointLight.position.set(0, 10, -5);
    this.group.add(pointLight);
  }

  _loadModel() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      '/models/cambrian.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(3);
        model.position.set(0, 0, -10);
        this.modelGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.warn("No cambrian.glb found. Please download one and place in public/models/. Rendering placeholder.");
        const mesh = new THREE.Mesh(
          new THREE.TorusKnotGeometry(2, 0.5, 64, 8),
          new THREE.MeshStandardMaterial({ color: 0x00ffaa, wireframe: true })
        );
        mesh.position.set(0, 0, -10);
        this.modelGroup.add(mesh);
      }
    );
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 15),
      new THREE.Vector3(-5, 2, 5),
      new THREE.Vector3(0, 0, -5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -10) };
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
      this.mixer.update(0.016);
    }
  }
}
