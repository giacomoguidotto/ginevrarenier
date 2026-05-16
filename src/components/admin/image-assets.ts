import type { ImageSwap } from "./draft-buffer";

export interface ImageAssetsConfig {
  deleteAsset: (publicId: string) => Promise<void>;
  upload: (
    file: File,
    folder: string
  ) => Promise<{ url: string; publicId: string }>;
}

export function createImageAssets(
  config: ImageAssetsConfig,
  initialTracked?: string[]
) {
  const tracked = new Set<string>(initialTracked);

  return {
    trackAsset(publicId: string): void {
      tracked.add(publicId);
    },
    trackedAssets(): string[] {
      return [...tracked];
    },
    async upload(
      file: File,
      folder: string
    ): Promise<{ url: string; publicId: string }> {
      const result = await config.upload(file, folder);
      tracked.add(result.publicId);
      return result;
    },
    clearTracked(): void {
      tracked.clear();
    },
    changeSummary(): { imageSwaps: ImageSwap[] } {
      return {
        imageSwaps: [...tracked].map((publicId) => ({ publicId })),
      };
    },
    async cleanup(): Promise<void> {
      for (const publicId of tracked) {
        await config.deleteAsset(publicId);
      }
      tracked.clear();
    },
  };
}
