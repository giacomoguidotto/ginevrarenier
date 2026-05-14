import { describe, expect, it, vi } from "vitest";
import { createChromeRegistry } from "./chrome-registry";

describe("Chrome Registry", () => {
  function makeElement(id = "el"): HTMLElement {
    return {
      id,
      getBoundingClientRect: () => DOMRect.fromRect(),
    } as unknown as HTMLElement;
  }

  it("registers a field and lists it", () => {
    const registry = createChromeRegistry();
    const el = makeElement();
    registry.register("hero\0title", el);
    expect(registry.getAll()).toEqual([
      { id: "hero\0title", element: el, visible: false },
    ]);
  });

  it("deregisters a field", () => {
    const registry = createChromeRegistry();
    const el = makeElement();
    registry.register("hero\0title", el);
    registry.deregister("hero\0title");
    expect(registry.getAll()).toEqual([]);
  });

  it("returns empty list initially", () => {
    const registry = createChromeRegistry();
    expect(registry.getAll()).toEqual([]);
  });

  it("replaces element on duplicate register", () => {
    const registry = createChromeRegistry();
    const el1 = makeElement("a");
    const el2 = makeElement("b");
    registry.register("hero\0title", el1);
    registry.register("hero\0title", el2);
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].element).toBe(el2);
  });

  it("notifies subscribers on register", () => {
    const registry = createChromeRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.register("hero\0title", makeElement());
    expect(listener).toHaveBeenCalledOnce();
  });

  it("notifies subscribers on deregister", () => {
    const registry = createChromeRegistry();
    const el = makeElement();
    registry.register("hero\0title", el);
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.deregister("hero\0title");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("unsubscribes when dispose is called", () => {
    const registry = createChromeRegistry();
    const listener = vi.fn();
    const dispose = registry.subscribe(listener);
    dispose();
    registry.register("hero\0title", makeElement());
    expect(listener).not.toHaveBeenCalled();
  });

  it("snapshots geometry for all registered fields", () => {
    const registry = createChromeRegistry();
    const el = {
      getBoundingClientRect: () => ({
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        top: 20,
        left: 10,
        right: 110,
        bottom: 50,
      }),
    } as unknown as HTMLElement;
    registry.register("hero\0title", el);

    const geo = registry.getGeometry();
    expect(geo).toEqual([
      {
        id: "hero\0title",
        rect: {
          x: 10,
          y: 20,
          width: 100,
          height: 30,
          top: 20,
          left: 10,
          right: 110,
          bottom: 50,
        },
      },
    ]);
  });

  it("returns empty geometry when no fields registered", () => {
    const registry = createChromeRegistry();
    expect(registry.getGeometry()).toEqual([]);
  });

  describe("visibility tracking", () => {
    it("registers fields as not visible by default", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      expect(registry.getAll()[0].visible).toBe(false);
    });

    it("markVisible makes a field visible", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      registry.markVisible("hero\0title");
      expect(registry.getAll()[0].visible).toBe(true);
    });

    it("markHidden makes a field not visible", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      registry.markVisible("hero\0title");
      registry.markHidden("hero\0title");
      expect(registry.getAll()[0].visible).toBe(false);
    });

    it("getActiveGeometry returns only visible fields", () => {
      const registry = createChromeRegistry();
      const el1 = {
        getBoundingClientRect: () => ({
          x: 10,
          y: 20,
          width: 100,
          height: 30,
          top: 20,
          left: 10,
          right: 110,
          bottom: 50,
        }),
      } as unknown as HTMLElement;
      const el2 = {
        getBoundingClientRect: () => ({
          x: 50,
          y: 60,
          width: 200,
          height: 40,
          top: 60,
          left: 50,
          right: 250,
          bottom: 100,
        }),
      } as unknown as HTMLElement;

      registry.register("hero\0title", el1);
      registry.register("hero\0subtitle", el2);
      registry.markVisible("hero\0title");

      const active = registry.getActiveGeometry();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("hero\0title");
    });

    it("getActiveGeometry returns empty when no fields visible", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      expect(registry.getActiveGeometry()).toEqual([]);
    });

    it("markVisible notifies subscribers", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      const listener = vi.fn();
      registry.subscribe(listener);
      registry.markVisible("hero\0title");
      expect(listener).toHaveBeenCalledOnce();
    });

    it("markHidden notifies subscribers", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      registry.markVisible("hero\0title");
      const listener = vi.fn();
      registry.subscribe(listener);
      registry.markHidden("hero\0title");
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe("dismountAll", () => {
    it("clears all registered fields", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      registry.register("hero\0subtitle", makeElement());
      registry.dismountAll();
      expect(registry.getAll()).toEqual([]);
    });

    it("notifies subscribers", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      const listener = vi.fn();
      registry.subscribe(listener);
      registry.dismountAll();
      expect(listener).toHaveBeenCalledOnce();
    });

    it("results in empty geometry", () => {
      const registry = createChromeRegistry();
      registry.register("hero\0title", makeElement());
      registry.markVisible("hero\0title");
      registry.dismountAll();
      expect(registry.getActiveGeometry()).toEqual([]);
      expect(registry.getGeometry()).toEqual([]);
    });
  });
});
