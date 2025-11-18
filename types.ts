
export interface Point {
  x: number;
  y: number;
}

export interface PlacedPentagon {
  id: number;
  center: Point;
  rotation: number; // in degrees
  vertices: Point[];
}
