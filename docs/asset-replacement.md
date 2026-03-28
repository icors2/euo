# Asset Replacement Pipeline

1. Put vendor/source files only in:
   - `assets/raw/imported/pics`
   - `assets/raw/imported/sound`
2. Ignore legacy files (`.map`, `.mm`, `.dat`) completely.
3. Run inventory:
   - `pnpm asset:inventory`
4. Run manifest split:
   - `pnpm asset:manifest`
5. Copy/convert approved files into `assets/processed/**` using manifest keys.
6. Game runtime loads only `assets/processed/**` paths from manifests.
7. Missing entries should resolve to placeholders from `@emberveil/shared` placeholder map and emit warning logs.

## Safe swap examples
- Replace town tiles: change files in `assets/processed/tiles`, keep manifest keys.
- Replace UI frame/title: update `assets/processed/ui` or `assets/processed/backgrounds` and keep keys.
- Replace music/SFX: update `assets/processed/audio/music` and `assets/processed/audio/sfx`.

No gameplay code changes are required for asset swaps.
