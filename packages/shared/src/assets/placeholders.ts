import type { AssetCategory } from '../content/assetManifest';

export const placeholderByCategory: Record<AssetCategory, string> = {
  tileset: 'assets/placeholders/tileset_placeholder.png',
  background: 'assets/placeholders/background_placeholder.png',
  ui: 'assets/placeholders/ui_placeholder.png',
  icon: 'assets/placeholders/icon_placeholder.png',
  portrait: 'assets/placeholders/portrait_placeholder.png',
  audio_music: 'assets/placeholders/music_placeholder.mp3',
  audio_sfx: 'assets/placeholders/sfx_placeholder.wav',
  unknown: 'assets/placeholders/unknown_placeholder.png'
};
