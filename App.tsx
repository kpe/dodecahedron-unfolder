import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlacedPentagon, Point } from './types';
import { DODECAHEDRON_ADJACENCY, PENTAGON_RADIUS, TOTAL_FACES } from './constants';
import { calculatePentagonVertices, calculateChildPentagon } from './services/geometry';
import PentagonDisplay from './components/PentagonDisplay';

const App = () => {
  const [placedPentagons, setPlacedPentagons] = useState<Map<number, PlacedPentagon>>(new Map());
  const [viewBox, setViewBox] = useState<string>('-250 -250 500 500');

  const createInitialPentagon = useCallback(() => {
    const initialCenter: Point = { x: 0, y: 0 };
    const initialRotation = 0;
    const initialPentagon: PlacedPentagon = {
      id: 0,
      center: initialCenter,
      rotation: initialRotation,
      vertices: calculatePentagonVertices(initialCenter, PENTAGON_RADIUS, initialRotation),
    };
    const newMap = new Map<number, PlacedPentagon>();
    newMap.set(0, initialPentagon);
    setPlacedPentagons(newMap);
  }, []);

  useEffect(() => {
    createInitialPentagon();
  }, [createInitialPentagon]);

  useEffect(() => {
    if (placedPentagons.size === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    placedPentagons.forEach(p => {
      p.vertices.forEach(v => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      });
    });

    const padding = PENTAGON_RADIUS * 0.8;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const newX = minX - padding;
    const newY = minY - padding;

    setViewBox(`${newX} ${newY} ${width} ${height}`);
  }, [placedPentagons]);

  const handleEdgeClick = useCallback((parentId: number, edgeIndex: number) => {
    if (placedPentagons.size >= TOTAL_FACES) return;

    const parentPentagon = placedPentagons.get(parentId);
    if (!parentPentagon) return;

    const childId = DODECAHEDRON_ADJACENCY[parentId][edgeIndex];
    if (placedPentagons.has(childId)) return;

    const newPentagon = calculateChildPentagon(parentPentagon, edgeIndex, childId);

    setPlacedPentagons(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(childId, newPentagon);
      return newMap;
    });
  }, [placedPentagons]);
  
  const handleReset = () => {
    createInitialPentagon();
  };

  const openEdgesMap = useMemo(() => {
    const map = new Map<number, boolean[]>();
    placedPentagons.forEach(p => {
      const edges = DODECAHEDRON_ADJACENCY[p.id].map(neighborId => !placedPentagons.has(neighborId));
      map.set(p.id, edges);
    });
    return map;
  }, [placedPentagons]);

  const allPentagons = Array.from(placedPentagons.values());
  const facesPlaced = placedPentagons.size;
  const isComplete = facesPlaced === TOTAL_FACES;

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm p-4 flex justify-between items-center z-10 border-b border-gray-700">
        <div className="text-left">
            <h1 className="text-xl md:text-2xl font-bold text-cyan-400">Dodecahedron Unfolder</h1>
            <p className="text-sm text-gray-400">Click highlighted edges to unfold the 12 faces.</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className={`text-lg font-mono px-4 py-2 rounded-md ${isComplete ? 'bg-green-500/80 text-white' : 'bg-gray-700 text-cyan-300'}`}>
                {facesPlaced} / {TOTAL_FACES} Faces
            </div>
            <button
                onClick={handleReset}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors"
            >
                Reset
            </button>
        </div>
      </header>
      <main className="flex-grow relative">
        <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={viewBox}
        >
          <g>
            {allPentagons.map((p: PlacedPentagon) => (
              <PentagonDisplay
                key={p.id}
                pentagon={p}
                onEdgeClick={handleEdgeClick}
                openEdges={openEdgesMap.get(p.id) || [false,false,false,false,false]}
              />
            ))}
          </g>
        </svg>
         {isComplete && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-xl">
                Congratulations! You've unfolded a complete dodecahedron net.
            </div>
        )}
      </main>
    </div>
  );
};

export default App;