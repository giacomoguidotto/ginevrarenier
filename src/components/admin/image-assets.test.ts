import { describe, expect, it, vi } from "vitest";
import { createImageAssets } from "./image-assets";

function stubConfig() {
  return {
    upload: vi.fn(),
    deleteAsset: vi.fn(),
  };
}

describe("Image Assets", () => {
  it("tracks an asset and returns it", () => {
    const assets = createImageAssets(stubConfig());
    assets.trackAsset("img_abc123");
    expect(assets.trackedAssets()).toEqual(["img_abc123"]);
  });

  it("cleanup deletes all tracked assets", async () => {
    const config = stubConfig();
    config.deleteAsset.mockResolvedValue(undefined);
    const assets = createImageAssets(config);
    assets.trackAsset("img_1");
    assets.trackAsset("img_2");
    await assets.cleanup();
    expect(config.deleteAsset).toHaveBeenCalledWith("img_1");
    expect(config.deleteAsset).toHaveBeenCalledWith("img_2");
    expect(config.deleteAsset).toHaveBeenCalledTimes(2);
  });

  it("cleanup is idempotent — second call is a no-op", async () => {
    const config = stubConfig();
    config.deleteAsset.mockResolvedValue(undefined);
    const assets = createImageAssets(config);
    assets.trackAsset("img_1");
    await assets.cleanup();
    await assets.cleanup();
    expect(config.deleteAsset).toHaveBeenCalledTimes(1);
  });

  it("clearTracked clears assets without deleting from Cloudinary", () => {
    const config = stubConfig();
    const assets = createImageAssets(config);
    assets.trackAsset("img_1");
    assets.trackAsset("img_2");
    assets.clearTracked();
    expect(assets.trackedAssets()).toEqual([]);
    expect(config.deleteAsset).not.toHaveBeenCalled();
  });

  it("upload calls the injected uploader and auto-tracks the result", async () => {
    const config = stubConfig();
    config.upload.mockResolvedValue({
      url: "https://cdn/img.jpg",
      publicId: "img_new",
    });
    const assets = createImageAssets(config);
    const result = await assets.upload(new File([""], "photo.jpg"), "gallery");
    expect(result).toEqual({ url: "https://cdn/img.jpg", publicId: "img_new" });
    expect(config.upload).toHaveBeenCalledWith(expect.any(File), "gallery");
    expect(assets.trackedAssets()).toEqual(["img_new"]);
  });

  it("changeSummary includes tracked assets as imageSwaps", async () => {
    const config = stubConfig();
    config.upload.mockResolvedValue({
      url: "https://cdn/img.jpg",
      publicId: "img_1",
    });
    const assets = createImageAssets(config);
    await assets.upload(new File([""], "photo.jpg"), "gallery");
    assets.trackAsset("img_2");
    expect(assets.changeSummary()).toEqual({
      imageSwaps: [{ publicId: "img_1" }, { publicId: "img_2" }],
    });
  });

  it("changeSummary returns empty imageSwaps when nothing tracked", () => {
    const assets = createImageAssets(stubConfig());
    expect(assets.changeSummary()).toEqual({ imageSwaps: [] });
  });
});
