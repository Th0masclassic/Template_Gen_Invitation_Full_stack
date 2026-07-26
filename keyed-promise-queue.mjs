export function createKeyedPromiseQueue() {
  const tails = new Map();

  return {
    run(key, task) {
      if (typeof task !== "function") throw new TypeError("task must be a function");
      const queueKey = String(key);
      const previous = tails.get(queueKey) || Promise.resolve();
      const current = previous
        .catch(() => {})
        .then(() => task());
      tails.set(queueKey, current);
      return current.finally(() => {
        if (tails.get(queueKey) === current) tails.delete(queueKey);
      });
    },
    get size() {
      return tails.size;
    },
  };
}
