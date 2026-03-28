export interface RuntimeMap {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  triggers: Array<{
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    triggerType: string;
  }>;
}
