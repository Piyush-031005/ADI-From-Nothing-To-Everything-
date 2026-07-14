import * as THREE from 'three';
import vertexShader   from './shaders/final/vertex.glsl';
import fragmentShader from './shaders/final/fragment.glsl';

/**
 * Renderer — Multi-pass pipeline:
 *   Pass 1: Main scene      → renderTarget.main    (2× supersampled)
 *   Pass 2: Glow scene      → renderTarget.glow    (½ res, for bloom)
 *   Pass 3: Final composite → screen
 *           (chroma + bloom + grain + vignette + flash)
 */
export class Renderer {
  constructor(experience) {
    this.exp    = experience;
    this.sizes  = experience.sizes;
    this.canvas = experience.canvas;

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping      = THREE.NoToneMapping;
    this.instance.autoClear        = false;
    this.instance.setClearColor(0x000000, 1);

    this._createTargets();
    this._createComposite();
  }

  _createTargets() {
    const w = this.sizes.width  * this.sizes.pixelRatio;
    const h = this.sizes.height * this.sizes.pixelRatio;

    const opts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    this.mainTarget = new THREE.WebGLRenderTarget(w * 1.5, h * 1.5, opts);  // supersampled
    this.glowTarget = new THREE.WebGLRenderTarget(w * 0.5, h * 0.5, opts);  // half-res bloom
  }

  _createComposite() {
    this.compositeUniforms = {
      uMainTexture:  { value: this.mainTarget.texture },
      uGlowTexture:  { value: this.glowTarget.texture },
      uTime:         { value: 0 },
      uChromaRadius: { value: 0.002 },
      uGrainStrength:{ value: 0.012 },
      uBloomStrength:{ value: 0.5 },
      uVignette:     { value: 0.5 },
      uFlashAlpha:   { value: 0.0 },
    };

    const mat = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.compositeUniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1,-1,0, 3,-1,0, -1,3,0], 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute([0,0, 2,0, 0,2], 2));

    this.compositeMesh  = new THREE.Mesh(geo, mat);
    this.compositeScene = new THREE.Scene();
    this.compositeScene.add(this.compositeMesh);
    this.compositeCamera = new THREE.OrthographicCamera(-1,1,1,-1, 0, 1);
  }

  render() {
    const { exp } = this;
    const time = exp.time.elapsed;
    this.compositeUniforms.uTime.value = time;

    // Pass 1: main scene → mainTarget
    this.instance.setClearColor(0x000000, 1);
    this.instance.setRenderTarget(this.mainTarget);
    this.instance.clear(true, true, true);
    this.instance.render(exp.scene, exp.camera.instance);

    // Pass 2: glow scene → glowTarget
    this.instance.setRenderTarget(this.glowTarget);
    this.instance.clear(true, true, true);
    this.instance.render(exp.glowScene, exp.camera.instance);

    // Pass 3: composite → screen
    this.instance.setRenderTarget(null);
    this.instance.clear(true, true, true);
    this.instance.render(this.compositeScene, this.compositeCamera);

    // Overlay scene on top (UI particles, etc.)
    this.instance.render(exp.overlayScene, exp.camera.instance);
  }

  resize() {
    const { sizes } = this;
    this.instance.setSize(sizes.width, sizes.height);
    this.instance.setPixelRatio(sizes.pixelRatio);

    const w = sizes.width  * sizes.pixelRatio;
    const h = sizes.height * sizes.pixelRatio;
    this.mainTarget.setSize(w * 1.5, h * 1.5);
    this.glowTarget.setSize(w * 0.5, h * 0.5);
  }

  /** Trigger big bang white flash */
  flash(duration = 0.8) {
    let start = null;
    const anim = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      this.compositeUniforms.uFlashAlpha.value = Math.sin(p * Math.PI);
      if (p < 1) requestAnimationFrame(anim);
      else this.compositeUniforms.uFlashAlpha.value = 0;
    };
    requestAnimationFrame(anim);
  }
}
