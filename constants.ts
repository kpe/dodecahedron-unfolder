
// Adjacency list for a dodecahedron graph.
// DODECAHEDRON_ADJACENCY[faceId][edgeIndex] gives the neighbor face ID.
// This mapping is constructed logically to represent a standard dodecahedron unfolding.
export const DODECAHEDRON_ADJACENCY: number[][] = [
  /* 0 */ [1, 2, 3, 4, 5],
  /* 1 */ [0, 5, 6, 7, 2],
  /* 2 */ [0, 1, 7, 8, 3],
  /* 3 */ [0, 2, 8, 9, 4],
  /* 4 */ [0, 3, 9, 10, 5],
  /* 5 */ [0, 4, 10, 6, 1],
  /* 6 */ [5, 1, 7, 11, 10],
  /* 7 */ [1, 2, 8, 11, 6],
  /* 8 */ [2, 3, 9, 11, 7],
  /* 9 */ [3, 4, 10, 11, 8],
  /* 10 */[4, 5, 6, 11, 9],
  /* 11 */[6, 7, 8, 9, 10],
];

export const PENTAGON_RADIUS = 100;
export const TOTAL_FACES = 12;

// Used to orient the pentagons so one side is flat at the 'top'.
export const PENTAGON_ROTATION_OFFSET_DEG = 72;
