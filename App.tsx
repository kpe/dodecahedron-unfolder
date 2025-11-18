import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlacedPentagon, Point } from './types';
import { DODECAHEDRON_ADJACENCY, PENTAGON_RADIUS, TOTAL_FACES } from './constants';
import { calculatePentagonVertices, calculateChildPentagon } from './services/geometry';
import PentagonDisplay from './components/PentagonDisplay';

const App = () => {
  const [placedPentagons, setPlacedPentagons] = useState<Map<number, PlacedPentagon>>(new Map());
  const [viewBox, setViewBox] = useState<string>('-250 -250 500 500');
  const [hoveredEdge, setHoveredEdge] = useState<{parentId: number, edgeIndex: number} | null>(null);
  const [previewPentagon, setPreviewPentagon] = useState<PlacedPentagon | null>(null);
  const [maxViewBoxSize, setMaxViewBoxSize] = useState<number>(500); // Track the largest viewBox dimension

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
    setMaxViewBoxSize(500); // Reset to initial size when creating initial pentagon
  }, []);

  useEffect(() => {
    createInitialPentagon();
  }, [createInitialPentagon]);

  useEffect(() => {
    if (placedPentagons.size === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Only include actually placed pentagons (NOT the preview)
    placedPentagons.forEach(p => {
      p.vertices.forEach(v => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      });
    });

    // Calculate bounds with consistent padding
    const padding = PENTAGON_RADIUS * 1.5; // Increased padding to ensure full visibility
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Ensure square aspect ratio for consistent scaling
    const maxDimension = Math.max(contentWidth, contentHeight);
    const newWidth = maxDimension + padding * 2;
    const newHeight = maxDimension + padding * 2;

    // Always use the new calculated size to ensure all pentagons are visible
    const finalSize = newWidth;

    // Update the maximum viewBox size tracking
    setMaxViewBoxSize(finalSize);

    // Center the content in the square viewBox
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newX = centerX - finalSize / 2;
    const newY = centerY - finalSize / 2;

    setViewBox(`${newX} ${newY} ${finalSize} ${finalSize}`);
  }, [placedPentagons, maxViewBoxSize]);

  const handleEdgeHover = useCallback((parentId: number, edgeIndex: number, isHovering: boolean) => {
    if (isHovering) {
      const parentPentagon = placedPentagons.get(parentId);
      if (!parentPentagon) return;

      const childId = DODECAHEDRON_ADJACENCY[parentId][edgeIndex];

      // Don't show preview for face 0 (can't be removed)
      if (childId === 0) return;

      setHoveredEdge({parentId, edgeIndex});

      // Only show preview if the pentagon doesn't exist yet
      if (!placedPentagons.has(childId)) {
        const preview = calculateChildPentagon(parentPentagon, edgeIndex, childId);
        setPreviewPentagon(preview);
      } else {
        setPreviewPentagon(null);
      }
    } else {
      setHoveredEdge(null);
      setPreviewPentagon(null);
    }
  }, [placedPentagons]);

  const handleEdgeClick = useCallback((parentId: number, edgeIndex: number) => {
    const parentPentagon = placedPentagons.get(parentId);
    if (!parentPentagon) return;

    const childId = DODECAHEDRON_ADJACENCY[parentId][edgeIndex];

    // Don't allow removing face 0 (the initial pentagon)
    if (childId === 0) return;

    setPlacedPentagons(prevMap => {
      const newMap = new Map(prevMap);

      if (newMap.has(childId)) {
        // Remove the pentagon if it already exists
        newMap.delete(childId);
      } else {
        // Add the pentagon if it doesn't exist
        if (newMap.size < TOTAL_FACES) {
          const newPentagon = calculateChildPentagon(parentPentagon, edgeIndex, childId);
          newMap.set(childId, newPentagon);
        }
      }

      return newMap;
    });

    // Clear preview after placing/removing
    setHoveredEdge(null);
    setPreviewPentagon(null);
  }, [placedPentagons]);
  
  const handleReset = () => {
    setHoveredEdge(null);
    setPreviewPentagon(null);
    setMaxViewBoxSize(500); // Reset the maximum viewBox size to initial value
    createInitialPentagon();
  };

  const openEdgesMap = useMemo(() => {
    const map = new Map<number, boolean[]>();
    placedPentagons.forEach(p => {
      const edges = DODECAHEDRON_ADJACENCY[p.id].map(neighborId => {
        // Can always click edges except when trying to remove face 0
        return neighborId !== 0;
      });
      map.set(p.id, edges);
    });
    return map;
  }, [placedPentagons]);

  const allPentagons = Array.from(placedPentagons.values());
  const facesPlaced = placedPentagons.size;
  const isComplete = facesPlaced === TOTAL_FACES;

  
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden touch-none">
      <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-md p-4 flex justify-center items-center z-10 border-b border-gray-800/50">
        <div className="flex items-center space-x-6">
            <div className={`relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/10'
            }`}>
                <div className="flex items-center space-x-3">
                    <span style={{
                        fontSize: '48px',
                        fontWeight: '900',
                        background: 'linear-gradient(to right, #67e8f9, #c084fc)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {facesPlaced}
                    </span>
                    <span style={{
                        fontSize: '36px',
                        fontWeight: '300',
                        color: 'rgba(103, 232, 249, 0.8)'
                    }}>
                        /
                    </span>
                    <span style={{
                        fontSize: '48px',
                        fontWeight: '900',
                        background: 'linear-gradient(to right, #c084fc, #f9a8d4)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {TOTAL_FACES}
                    </span>
                </div>
                {isComplete && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
            <button
                onClick={handleReset}
                className="group relative px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 active:from-rose-700 active:to-pink-700 rounded-2xl font-bold text-white shadow-xl shadow-rose-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
            >
                <span className="relative z-10 flex flex-col items-center space-y-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-base font-semibold">Reset</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-base font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">Reset</span>
                </span>
            </button>
        </div>
      </header>
      <main className="flex-grow relative touch-manipulation">
        <svg
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox={viewBox}
          style={{ touchAction: 'manipulation' }}
        >
          <g>
            {allPentagons.map((p: PlacedPentagon) => (
              <PentagonDisplay
                key={p.id}
                pentagon={p}
                onEdgeClick={handleEdgeClick}
                onEdgeHover={handleEdgeHover}
                hoveredEdge={hoveredEdge}
                openEdges={openEdgesMap.get(p.id) || [false,false,false,false,false]}
              />
            ))}
            {/* Preview pentagon for hovered edge */}
            {previewPentagon && (
              <g opacity="0.5" style={{ pointerEvents: 'none' }}>
                <polygon
                  points={previewPentagon.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                  style={{
                    fill: 'rgba(34, 211, 238, 0.5)',
                    stroke: 'rgba(103, 232, 249, 0.8)',
                    strokeWidth: 2,
                    strokeDasharray: '4,2'
                  }}
                />
                <text
                  x={previewPentagon.center.x}
                  y={previewPentagon.center.y}
                  dy=".3em"
                  textAnchor="middle"
                  style={{
                    fill: 'rgba(207, 250, 254, 1)',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                  }}
                >
                  {previewPentagon.id + 1}
                </text>
              </g>
            )}
          </g>
        </svg>
         {isComplete && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/25 font-bold text-xl mx-4 text-center border border-emerald-400/30">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <span>Perfect! All 12 faces unfolded.</span>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;