
import { FaceTopology } from '../types';

// Standard Regular Dodecahedron Topology
// 12 Faces, 20 Vertices (0-19).
// Consistent Edge Ordering: Edge i connects vertex[i] -> vertex[(i+1)%5].
// Adjacency[i] is the Face ID sharing Edge i.

export const DODECAHEDRON_FACES: FaceTopology[] = [
  // F0: Bottom (Center)
  { id: 0, vertexIds: [0, 1, 2, 3, 4], neighbors: [1, 2, 3, 4, 5] },

  // Ring 1 (F1-F5)
  // F1 shares 0-1 with F0. Edge 0 (1->0) connects to F0.
  { id: 1, vertexIds: [1, 0, 5, 6, 7], neighbors: [0, 5, 6, 7, 2] },
  // F2 shares 1-2 with F0. Edge 0 (2->1) connects to F0.
  { id: 2, vertexIds: [2, 1, 7, 8, 9], neighbors: [0, 1, 7, 8, 3] },
  // F3 shares 2-3 with F0. Edge 0 (3->2) connects to F0.
  { id: 3, vertexIds: [3, 2, 9, 10, 11], neighbors: [0, 2, 8, 9, 4] },
  // F4 shares 3-4 with F0. Edge 0 (4->3) connects to F0.
  { id: 4, vertexIds: [4, 3, 11, 12, 13], neighbors: [0, 3, 9, 10, 5] },
  // F5 shares 4-0 with F0. Edge 0 (0->4) connects to F0.
  { id: 5, vertexIds: [0, 4, 13, 14, 5], neighbors: [0, 4, 10, 6, 1] },

  // Ring 2 (F6-F10)
  // F6: Between F1 and F5.
  { id: 6, vertexIds: [6, 5, 14, 19, 15], neighbors: [1, 5, 10, 11, 7] },
  // F7: Between F1 and F2.
  { id: 7, vertexIds: [7, 6, 15, 16, 8], neighbors: [1, 6, 11, 8, 2] },
  // F8: Between F2 and F3.
  { id: 8, vertexIds: [8, 16, 17, 10, 9], neighbors: [7, 11, 9, 3, 2] },
  // F9: Between F3 and F4.
  { id: 9, vertexIds: [10, 17, 18, 12, 11], neighbors: [8, 11, 10, 4, 3] },
  // F10: Between F4 and F5.
  { id: 10, vertexIds: [12, 18, 19, 14, 13], neighbors: [9, 11, 6, 5, 4] },

  // F11: Top
  // Connects to Ring 2 faces.
  // Edge 0 (15-19) shares with F6 (19-15 is edge 3 of F6).
  { id: 11, vertexIds: [15, 19, 18, 17, 16], neighbors: [6, 10, 9, 8, 7] }
];

// Adjacency Matrix derived from neighbors above
export const ADJACENCY = DODECAHEDRON_FACES.map(f => f.neighbors);

export const START_VERTEX_ID = 1; // Vertex to the left of O in F0
export const O_VERTEX_ID = 0; // Bottom vertex in F0
