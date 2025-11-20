
export interface Point {
  x: number;
  y: number;
}

export interface Vertex {
  id: number; // Global Vertex ID (0-19)
  pt: Point;  // 2D Plane coordinates
  isStartVertex: boolean; // Helper flag
  isOVertex: boolean; // Helper flag
}

export interface Polygon {
  faceId: number; // Dodecahedron Face ID (0-11)
  vertices: Vertex[];
  center: Point;
}

// Static Dodecahedron Graph Data
export interface FaceTopology {
  id: number;
  vertexIds: number[]; // Indices of vertices [v0, v1, v2, v3, v4]
  neighbors: number[]; // Neighbors [n0, n1, n2, n3, n4] corresponding to edges
}

export interface Ray {
  origin: Point;
  direction: Point; // Normalized vector
  angle: number;
}
