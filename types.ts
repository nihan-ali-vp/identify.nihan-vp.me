export interface DetectedShape {
  id: string;
  name: string;
  corners: number;
  area: number;
  center: { x: number; y: number };
  confidence: number;
}