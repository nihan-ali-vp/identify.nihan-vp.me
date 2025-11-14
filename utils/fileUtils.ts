interface Color {
  name: string;
  rgb: [number, number, number];
}

const COLORS: Color[] = [
  { name: 'red', rgb: [255, 0, 0] },
  { name: 'green', rgb: [0, 128, 0] },
  { name: 'blue', rgb: [0, 0, 255] },
  { name: 'yellow', rgb: [255, 255, 0] },
  { name: 'orange', rgb: [255, 165, 0] },
  { name: 'purple', rgb: [128, 0, 128] },
  { name: 'pink', rgb: [255, 192, 203] },
  { name: 'brown', rgb: [165, 42, 42] },
  { name: 'black', rgb: [0, 0, 0] },
  { name: 'white', rgb: [255, 255, 255] },
  { name: 'gray', rgb: [128, 128, 128] },
  { name: 'cyan', rgb: [0, 255, 255] },
];

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  const r = c1[0] - c2[0];
  const g = c1[1] - c2[1];
  const b = c1[2] - c2[2];
  return r * r + g * g + b * b;
}

export function mapRgbToColorName(r: number, g: number, b: number): string {
  if (r > 240 && g > 240 && b > 240) return 'white';
  if (r < 30 && g < 30 && b < 30) return 'black';

  let closestColor = COLORS[0];
  let minDistance = Infinity;

  for (const color of COLORS) {
    const distance = colorDistance([r, g, b], color.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor.name;
}
