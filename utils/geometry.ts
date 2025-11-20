
import { Point, Polygon, Vertex, Ray } from '../types';
import { ADJACENCY, START_VERTEX_ID, O_VERTEX_ID, DODECAHEDRON_FACES } from './dodecahedron';

const TWO_PI = 2 * Math.PI;

// --- Vector Math Helper ---
export const vecAdd = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const vecSub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const vecScale = (v: Point, s: number): Point => ({ x: v.x * s, y: v.y * s });
export const vecLen = (v: Point): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const vecDot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y;

// Intersection of Ray (origin, dir) with Segment (p1, p2)
// Returns distance t from origin.
export const intersectRaySegment = (rayOrigin: Point, rayDir: Point, p1: Point, p2: Point): number => {
  const v1 = rayOrigin;
  const v2 = vecAdd(rayOrigin, rayDir);
  const v3 = p1;
  const v4 = p2;

  const den = (v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x);
  if (Math.abs(den) < 1e-9) return Infinity;

  const t = ((v1.x - v3.x) * (v3.y - v4.y) - (v1.y - v3.y) * (v3.x - v4.x)) / den;
  const u = -((v1.x - v2.x) * (v1.y - v3.y) - (v1.y - v2.y) * (v1.x - v3.x)) / den;

  if (t > 1e-5 && u >= 0 && u <= 1) {
    return t;
  }
  return Infinity;
};

// Reflect a point across the line p1-p2
const reflectPt = (p: Point, p1: Point, p2: Point): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
  const b = (2 * dx * dy) / (dx * dx + dy * dy);
  const x2 = a * (p.x - p1.x) + b * (p.y - p1.y) + p1.x;
  const y2 = b * (p.x - p1.x) - a * (p.y - p1.y) + p1.y;
  return { x: x2, y: y2 };
};

// --- Topology ---
// Directly use the hardcoded, verified topology.
const FACE_VERTS = DODECAHEDRON_FACES.map(f => f.vertexIds);

// --- Unrolling Logic ---

export const calculateUnrolling = (angle: number, maxSteps = 12) => {
  const R = 100; // Radius
  // Initial Face F0 Setup
  // O (ID 0) is vertically down: (0, R)
  // Vertices 0,1,2,3,4 are generated clockwise starting from bottom.
  const f0Verts: Vertex[] = [];
  for (let i = 0; i < 5; i++) {
    const theta = Math.PI / 2 + i * (TWO_PI / 5);
    const vid = FACE_VERTS[0][i];
    f0Verts.push({
      id: vid,
      pt: { x: R * Math.cos(theta), y: R * Math.sin(theta) },
      isStartVertex: vid === START_VERTEX_ID,
      isOVertex: vid === O_VERTEX_ID
    });
  }

  // Start Vertex A
  const startVertex = f0Verts.find(v => v.id === START_VERTEX_ID);
  if (!startVertex) throw new Error("Start vertex not found in F0");
  
  const startPt = startVertex.pt; 

  const polygons: Polygon[] = [{
    faceId: 0,
    vertices: f0Verts,
    center: { x: 0, y: 0 }
  }];

  // Ray Definition
  const rayDir = { x: Math.cos(angle), y: Math.sin(angle) };
  
  // Candidates for snapping (Unrolled instances of A)
  const candidates: { pt: Point, distance: number }[] = [];

  let currentT = 0.01; // Start small epsilon along ray
  
  // Loop
  for (let step = 0; step < maxSteps; step++) {
    const poly = polygons[step];
    
    // Find exit edge
    let bestT = Infinity;
    let exitEdgeIdx = -1;

    for (let i = 0; i < 5; i++) {
      const p1 = poly.vertices[i].pt;
      const p2 = poly.vertices[(i + 1) % 5].pt;
      const t = intersectRaySegment(startPt, rayDir, p1, p2);
      
      // Must be greater than currentT (progressing forward)
      if (t < Infinity && t > currentT + 0.1 && t < bestT) {
        bestT = t;
        exitEdgeIdx = i;
      }
    }

    if (exitEdgeIdx === -1) break; 
    currentT = bestT;

    // Prepare next polygon using Reflection
    const p1 = poly.vertices[exitEdgeIdx].pt; // Start of shared edge (in old poly)
    const p2 = poly.vertices[(exitEdgeIdx + 1) % 5].pt; // End of shared edge
    
    // Identify Next Face
    const nextFaceId = ADJACENCY[poly.faceId][exitEdgeIdx];
    const nextFaceVertIds = FACE_VERTS[nextFaceId]; // [v0..v4] global IDs

    // Entry Edge in Next Face
    // The shared edge in Next Face corresponds to (p2 -> p1).
    const entryEdgeIdx = ADJACENCY[nextFaceId].indexOf(poly.faceId);
    
    // Reflect center
    const newCenter = reflectPt(poly.center, p1, p2);
    
    const newVerts: Vertex[] = new Array(5);

    // Map vertices from Old Polygon to New Polygon by reflection
    // Relation: NewVertex[entry + m] is reflection of OldVertex[exit + 1 - m]
    // m=0: New[entry] (v_entry) overlaps Old[exit+1] (p2). 
    //      Reflect(p2) across p1-p2 is p2. Correct.
    // m=1: New[entry+1] overlaps Old[exit] (p1).
    //      Reflect(p1) across p1-p2 is p1. Correct.
    for (let m = 0; m < 5; m++) {
        // Calculate indices with wrap-around
        const targetIdx = (entryEdgeIdx + m) % 5;
        const sourceIdx = (exitEdgeIdx + 1 - m + 5) % 5;
        
        const sourcePt = poly.vertices[sourceIdx].pt;
        const newPt = reflectPt(sourcePt, p1, p2);
        
        const globalId = nextFaceVertIds[targetIdx];

        newVerts[targetIdx] = {
            id: globalId,
            pt: newPt,
            isStartVertex: globalId === START_VERTEX_ID,
            isOVertex: globalId === O_VERTEX_ID
        };

        // Track candidates
        if (globalId === START_VERTEX_ID) {
             candidates.push({ pt: newPt, distance: currentT });
        }
    }

    polygons.push({
        faceId: nextFaceId,
        vertices: newVerts,
        center: newCenter
    });
  }

  return { polygons, startPt, candidates };
};
