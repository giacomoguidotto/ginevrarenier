export interface FieldRegistration {
  element: HTMLElement;
  id: string;
}

export interface FieldGeometry {
  id: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export function createChromeRegistry() {
  const store = new Map<string, HTMLElement>();
  const listeners = new Set<() => void>();

  function notify() {
    for (const fn of listeners) {
      fn();
    }
  }

  return {
    register(id: string, element: HTMLElement): void {
      store.set(id, element);
      notify();
    },
    deregister(id: string): void {
      store.delete(id);
      notify();
    },
    getAll(): FieldRegistration[] {
      return Array.from(store, ([id, element]) => ({ id, element }));
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getGeometry(): FieldGeometry[] {
      return Array.from(store, ([id, element]) => {
        const r = element.getBoundingClientRect();
        return {
          id,
          rect: {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            top: r.top,
            left: r.left,
            right: r.right,
            bottom: r.bottom,
          },
        };
      });
    },
  };
}
