import { Point, PlacedPentagon } from '../types';
import { PENTAGON_RADIUS, PENTAGON_ROTATION_OFFSET_DEG, DODECAHEDRON_ADJACENCY } from '../constants';

// Converts degrees to radians
const degToRad = (degrees: number): number => degrees * (Math.PI / 180);

/**
 * Calculates the vertices of a regular pentagon.
 * @param center - The center point {x, y} of the pentagon.
 * @param radius - The distance from the center to any vertex.
 * @param rotation - The rotation of the pentagon in degrees.
 * @returns An array of 5 points representing the vertices.
 */
export const calculatePentagonVertices = (center: Point, radius: number, rotation: number): Point[] => {
  const vertices: Point[] = [];
  const rotationInRadians = degToRad(rotation + PENTAGON_ROTATION_OFFSET_DEG);
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI / 5) * i - Math.PI / 2 + rotationInRadians;
    vertices.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return vertices;
};

/**
 * Calculates the placement (center, rotation, vertices) for a new child pentagon
 * based on its parent and the edge they share.
 * @param parentPentagon - The PlacedPentagon object of the parent.
 * @param edgeIndex - The index (0-4) of the edge on the parent to attach to.
 * @returns A new PlacedPentagon object for the child.
 */
export const calculateChildPentagon = (parentPentagon: PlacedPentagon, edgeIndex: number, childId: number): PlacedPentagon => {
  // 1. Get the shared edge vertices from the parent
  const v1 = parentPentagon.vertices[edgeIndex];
  const v2 = parentPentagon.vertices[(edgeIndex + 1) % 5];

  // 2. Reflect the parent's center across the shared edge to find the child's center
  const edgeMidpoint = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
  const newCenter: Point = {
    x: 2 * edgeMidpoint.x - parentPentagon.center.x,
    y: 2 * edgeMidpoint.y - parentPentagon.center.y,
  };

  // 3. Calculate the new rotation
  
  // Angle of the parent's edge vector in world space (from v2 to v1)
  const parentEdgeAngleRad = Math.atan2(v1.y - v2.y, v1.x - v2.x);
  
  // Find which edge of the child connects back to the parent.
  const childEdgeIndex = DODECAHEDRON_ADJACENCY[childId].indexOf(parentPentagon.id);
  if (childEdgeIndex === -1) {
    // This should not happen with a valid adjacency graph
    throw new Error(`Dodecahedron adjacency error: Parent ${parentPentagon.id} not found for child ${childId}`);
  }
  
  // The vertex mapping for a shared edge is:
  // parent vertex `edgeIndex` (v1) aligns with child vertex `(childEdgeIndex + 1) % 5`
  // parent vertex `(edgeIndex + 1) % 5` (v2) aligns with child vertex `childEdgeIndex`

  // Calculate the local angle of the child's corresponding edge vector.
  const basePentagon = calculatePentagonVertices({x: 0, y: 0}, PENTAGON_RADIUS, 0);
  const attachVertex1 = basePentagon[childEdgeIndex];
  const attachVertex2 = basePentagon[(childEdgeIndex + 1) % 5];
  
  // Child's local edge angle (vector from attachVertex2 to attachVertex1)
  const childEdgeAngleRad = Math.atan2(attachVertex1.y - attachVertex2.y, attachVertex1.x - attachVertex2.x);

  // The required rotation is the difference between the parent's world angle and the child's local angle,
  // plus 180 degrees (PI radians) to account for the unfolding (mirroring) effect.
  const newRotationRad = parentEdgeAngleRad - childEdgeAngleRad + Math.PI;
  const newRotationDeg = newRotationRad * (180 / Math.PI);

  // 4. Calculate vertices for the new pentagon
  const newVertices = calculatePentagonVertices(newCenter, PENTAGON_RADIUS, newRotationDeg);

  return {
    id: childId,
    center: newCenter,
    rotation: newRotationDeg,
    vertices: newVertices,
  };
};
