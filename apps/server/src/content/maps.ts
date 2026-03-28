import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface ServerMap {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  blocked: Set<string>;
  triggers: Array<{
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    triggerType: string;
    targetMap?: string;
    targetX?: number;
    targetY?: number;
  }>;
}

const repoRoot = process.cwd();

function loadMapFile(relPath: string) {
  return JSON.parse(readFileSync(path.join(repoRoot, relPath), 'utf8')) as any;
}

function parseBlocked(mapJson: any): Set<string> {
  const blocked = new Set<string>();
  const collision = mapJson.layers.find((l: any) => l.name === 'blocked');
  if (!collision || !Array.isArray(collision.data)) return blocked;

  collision.data.forEach((tile: number, idx: number) => {
    if (tile > 0) {
      const x = idx % mapJson.width;
      const y = Math.floor(idx / mapJson.width);
      blocked.add(`${x},${y}`);
    }
  });

  return blocked;
}

function parseTriggers(mapJson: any): ServerMap['triggers'] {
  const layer = mapJson.layers.find((l: any) => l.name === 'triggers');
  if (!layer?.objects) return [];

  return layer.objects.map((obj: any) => {
    const prop = (name: string) => obj.properties?.find((p: any) => p.name === name)?.value;
    return {
      id: obj.id,
      name: obj.name,
      x: Math.floor(obj.x / mapJson.tilewidth),
      y: Math.floor(obj.y / mapJson.tileheight),
      width: Math.floor(obj.width / mapJson.tilewidth),
      height: Math.floor(obj.height / mapJson.tileheight),
      triggerType: String(prop('triggerType') ?? ''),
      targetMap: prop('targetMap'),
      targetX: prop('targetX'),
      targetY: prop('targetY')
    };
  });
}

export const maps: Record<string, ServerMap> = {
  hearthmere: (() => {
    const mapJson = loadMapFile('packages/content/maps/hearthmere-town.json');
    return {
      id: 'hearthmere',
      width: mapJson.width,
      height: mapJson.height,
      tileWidth: mapJson.tilewidth,
      tileHeight: mapJson.tileheight,
      blocked: parseBlocked(mapJson),
      triggers: parseTriggers(mapJson)
    };
  })()
};

export function canOccupy(mapId: string, x: number, y: number): boolean {
  const map = maps[mapId];
  if (!map) return false;
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return !map.blocked.has(`${x},${y}`);
}

export function getMapSnapshot(mapId: string) {
  const map = maps[mapId];
  if (!map) return null;
  return {
    id: map.id,
    width: map.width,
    height: map.height,
    tileWidth: map.tileWidth,
    tileHeight: map.tileHeight,
    triggers: map.triggers
  };
}

export function resolveTrigger(mapId: string, x: number, y: number) {
  const map = maps[mapId];
  if (!map) return null;
  return map.triggers.find((t) => x >= t.x && y >= t.y && x < t.x + t.width && y < t.y + t.height) ?? null;
}
