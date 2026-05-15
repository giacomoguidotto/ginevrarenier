export interface FieldRegistration {
  element: HTMLElement;
  id: string;
  visible: boolean;
}

interface FieldEntry {
  element: HTMLElement;
  visible: boolean;
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

function snapshotRect(element: HTMLElement) {
  const r = element.getBoundingClientRect();
  return {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    top: r.top,
    left: r.left,
    right: r.right,
    bottom: r.bottom,
  };
}

export function createChromeRegistry() {
  const store = new Map<string, FieldEntry>();
  const listeners = new Set<() => void>();
  let dismountGeneration = 0;

  function notify() {
    for (const fn of listeners) {
      fn();
    }
  }

  return {
    register(id: string, element: HTMLElement): void {
      store.set(id, { element, visible: false });
      notify();
    },
    deregister(id: string): void {
      store.delete(id);
      notify();
    },
    markVisible(id: string): void {
      const entry = store.get(id);
      if (entry && !entry.visible) {
        entry.visible = true;
        notify();
      }
    },
    markHidden(id: string): void {
      const entry = store.get(id);
      if (entry?.visible) {
        entry.visible = false;
        notify();
      }
    },
    dismountAll(): void {
      store.clear();
      dismountGeneration++;
      notify();
    },
    getDismountGeneration(): number {
      return dismountGeneration;
    },
    getAll(): FieldRegistration[] {
      return Array.from(store, ([id, { element, visible }]) => ({
        id,
        element,
        visible,
      }));
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getGeometry(): FieldGeometry[] {
      return Array.from(store, ([id, { element }]) => ({
        id,
        rect: snapshotRect(element),
      }));
    },
    getActiveGeometry(): FieldGeometry[] {
      const result: FieldGeometry[] = [];
      for (const [id, { element, visible }] of store) {
        if (visible) {
          result.push({ id, rect: snapshotRect(element) });
        }
      }
      return result;
    },
  };
}
