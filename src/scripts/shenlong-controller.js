export function createShenlongController(loadScene) {
  let generation = 0;
  let dispose;
  return {
    async open(stage) {
      const current = ++generation;
      dispose?.();
      dispose = undefined;
      try {
        const { mountShenlong } = await loadScene();
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
