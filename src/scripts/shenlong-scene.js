import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function modelUrl(base) {
  return `${base.replace(/\/?$/, '/')}models/shenlong.glb`;
}

export function fitCameraDistance(bounds, fov, aspect) {
  const halfHeight = Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y));
  const halfWidth = Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x));
  const projectedRadius = Math.max(halfHeight, halfWidth / aspect);
  return bounds.max.z + projectedRadius / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.1;
}

function disposeModel(root) {
  root.traverse((object) => {
    object.geometry?.dispose();
    for (const material of [object.material].flat().filter(Boolean)) {
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
}

export function mountShenlong(stage, base = import.meta.env?.BASE_URL || '/') {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return () => {};
  }
  const canvas = renderer.domElement;
  canvas.className = 'shenron-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
  scene.add(new THREE.HemisphereLight(0xe6ffe6, 0x263d32, 2));
  const light = new THREE.DirectionalLight(0xffeac6, 2.5);
  light.position.set(3, 5, 6);
  scene.add(light);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let model, mixer, frame, observer, stopped = false;
  const clock = new THREE.Clock();
  const resize = () => {
    const width = stage.clientWidth || 1, height = stage.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (model) {
      const bounds = new THREE.Box3().setFromObject(model);
      camera.position.z = Math.max(fitCameraDistance(bounds, camera.fov, camera.aspect), 1);
      camera.far = Math.max(camera.position.z * 10, 100);
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  };
  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('resize', resize);
    reducedMotion.removeEventListener?.('change', motionChanged);
    canvas.removeEventListener('webglcontextlost', contextLost);
    stage.classList.remove('has-3d-dragon');
    if (model) disposeModel(model);
    mixer?.stopAllAction();
    renderer.dispose();
    canvas.remove();
  };
  const contextLost = (event) => { event.preventDefault(); cleanup(); };
  const animate = () => {
    if (stopped || reducedMotion.matches || !model) return;
    frame = requestAnimationFrame(animate);
    mixer?.update(Math.min(clock.getDelta(), 0.1));
    model.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.08;
    renderer.render(scene, camera);
  };
  const motionChanged = () => {
    cancelAnimationFrame(frame);
    if (model) {
      model.rotation.y = 0;
      renderer.render(scene, camera);
      if (!reducedMotion.matches) { clock.getDelta(); animate(); }
    }
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  reducedMotion.addEventListener?.('change', motionChanged);
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(resize);
    observer.observe(stage);
  } else window.addEventListener('resize', resize);
  try {
    new GLTFLoader().load(modelUrl(base), (gltf) => {
      if (stopped) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      scene.add(model);
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      }
      resize();
      stage.classList.add('has-3d-dragon');
      if (!reducedMotion.matches) { clock.start(); animate(); }
    }, undefined, cleanup);
  } catch { cleanup(); }
  return cleanup;
}
