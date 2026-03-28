export type AssetCategory =
  | 'tileset'
  | 'background'
  | 'ui'
  | 'icon'
  | 'portrait'
  | 'audio_music'
  | 'audio_sfx'
  | 'unknown';

export interface AssetManifestEntry {
  key: string;
  category: AssetCategory;
  sourcePath: string;
  processedPath: string;
  extension: string;
  tags?: string[];
  placeholder?: boolean;
}

export interface AssetManifest {
  generatedAt: string;
  entries: AssetManifestEntry[];
}
