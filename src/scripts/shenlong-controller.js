export function createShenlongController(loadScene) {
  let generation = 0;
  let dispose;
  let sceneModule, loadingModule, preloading;
  const getScene = () => {
    if (!loadingModule) loadingModule = loadScene().then((module) => (sceneModule = module), (error) => { loadingModule = undefined; throw error; });
    return loadingModule;
  };
  const preload = () => {
    if (!preloading) preloading = getScene().then((module) => module.preloadShenlong?.()).catch(() => {}).finally(() => { preloading = undefined; });
    return preloading;
  };
  return {
    preload,
    async open(stage) {
      const current = ++generation;
      dispose?.();
      dispose = undefined;
      try {
        const { mountShenlong } = sceneModule || await getScene();
        if (current !== generation) return;
        const cleanup = await mountShenlong(stage);
        if (current !== generation) cleanup?.();
        else dispose = cleanup;
      } catch {
        // The original illustration remains visible if the scene cannot load.
      }
    },
    close() {
      generation++;
      dispose?.();
      dispose = undefined;
    },
  };
}
