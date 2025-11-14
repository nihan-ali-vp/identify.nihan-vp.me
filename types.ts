export interface DetectedShape {
  id: string;
  name: string;
  corners: number;
  area: number;
  center: { x: number; y: number };
  confidence: number;
}

// Fix: Add and export the 'Shape' interface, which is required by other components.
export interface Shape {
  shape: string;
  color: string;
}
