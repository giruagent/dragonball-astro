import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function modelUrl(base) {
  return `${base.replace(/\/?$/, '/')}models/shenlong.glb`;
}

// Keep only one bounded copy of the compressed asset, not a live GPU scene.
const MAX_MODEL_BYTES = 16 * 1024 * 1024;
let cachedUrl, cachedModel;
export function preloadShenlong(base = import.meta.env?.BASE_URL || '/') {
  const url = modelUrl(base);
  if (cachedModel && cachedUrl === url) return cachedModel;
  cachedUrl = url;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 30000);
  const request = (async () => {
    const response = await fetch(url, { signal: abort.signal });
    if (!response.ok || Number(response.headers.get('content-length')) > MAX_MODEL_BYTES) {
      abort.abort();
      throw new Error('Model download failed');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Model stream unavailable');
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_MODEL_BYTES) { abort.abort(); throw new Error('Model too large'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes.buffer;
  })().catch((error) => {
    if (cachedModel === request) { cachedModel = undefined; cachedUrl = undefined; }
    throw error;
  }).finally(() => clearTimeout(timeout));
  cachedModel = request;
  return request;
}

export function entrancePose(elapsed) {
  const t = Math.max(0, Math.min(elapsed / 4800, 1));
  if (t === 1) return { scale: 1, y: 0, rotation: 0, done: true };
  const eased = 1 - (1 - t) ** 3;
  return { scale: 0.35 + 0.65 * eased, y: -1.2 * (1 - eased), rotation: -1.1 * (1 - eased), done: t === 1 };
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
  let model, mixer, frame, observer, entranceStart, baseY, stopped = false;
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
    if (entranceStart !== undefined) {
      const pose = entrancePose(performance.now() - entranceStart);
      model.scale.setScalar(pose.scale);
      model.position.y = baseY + pose.y;
      model.rotation.y = pose.rotation;
      if (pose.done) entranceStart = undefined;
    } else model.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.08;
    renderer.render(scene, camera);
  };
  const motionChanged = () => {
    cancelAnimationFrame(frame);
    if (model) {
      entranceStart = undefined;
      model.scale.setScalar(1);
      model.position.y = baseY;
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
    preloadShenlong(base).then((buffer) => {
      if (stopped) return;
      new GLTFLoader().parse(buffer, modelUrl(base).replace(/[^/]*$/, ''), (gltf) => {
      if (stopped) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      baseY = model.position.y;
      scene.add(model);
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      }
      resize();
      if (!reducedMotion.matches) {
        entranceStart = performance.now();
        const pose = entrancePose(0);
        model.scale.setScalar(pose.scale);
        model.position.y = baseY + pose.y;
        model.rotation.y = pose.rotation;
      }
      renderer.render(scene, camera);
      stage.classList.add('has-3d-dragon');
      stage.dispatchEvent(new Event('shenlong-ready'));
      if (!reducedMotion.matches) { clock.start(); animate(); }
      }, cleanup);
    }).catch(cleanup);
  } catch { cleanup(); }
  return cleanup;
}
