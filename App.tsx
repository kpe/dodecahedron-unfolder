
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { calculateUnrolling, vecSub, vecLen } from './utils/geometry';
import { START_VERTEX_ID, O_VERTEX_ID } from './utils/dodecahedron';
import { Point } from './types';

// Color palette for 12 faces
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
];

// Distinct colors for the first 5 vertices (Face 0)
// 0: O, 1: A, 2, 3, 4
const VERTEX_PALETTE = [
  '#facc15', // 0: O (Yellow)
  '#22d3ee', // 1: A (Cyan) - Start
  '#4ade80', // 2: Green
  '#c084fc', // 3: Purple
  '#fb7185', // 4: Red
];

export default function App() {
  const [angle, setAngle] = useState<number>(0.1); // Start slightly angled right
  const [snapped, setSnapped] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // 1. Calculate Unrolling based on current angle (First Pass)
  const baseCalculation = useMemo(() => {
    return calculateUnrolling(angle, 12); // Reduced to 12 steps
  }, [angle]);

  // 2. Check Snapping & Recalculate if needed
  const finalState = useMemo(() => {
    // Check candidates from base calculation
    let bestSnapAngle = angle;
    let isSnapped = false;
    let minDiff = 0.015; // ~0.8 degrees threshold
    let targetCandidatePt: Point | null = null;

    // Use the base start point
    const start = baseCalculation.startPt;

    for (const c of baseCalculation.candidates) {
        if (vecLen(vecSub(c.pt, start)) < 10) continue; // Ignore A itself
        
        const dx = c.pt.x - start.x;
        const dy = c.pt.y - start.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let diff = Math.abs(targetAngle - angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        
        if (diff < minDiff) {
            minDiff = diff;
            bestSnapAngle = targetAngle;
            isSnapped = true;
            targetCandidatePt = c.pt;
        }
    }

    if (isSnapped && targetCandidatePt) {
        // Recalculate exact strip for the snapped angle to ensure visual perfection
        const snappedCalc = calculateUnrolling(bestSnapAngle, 12);
        const dist = vecLen(vecSub(targetCandidatePt, start));
        return { ...snappedCalc, angle: bestSnapAngle, isSnapped: true, snapDistance: dist };
    }
    
    return { ...baseCalculation, angle, isSnapped: false, snapDistance: 0 };
  }, [angle, baseCalculation, snapped]); // Add snapped to deps to force refresh if needed

  // Update local state if we snapped effectively (for UI feedback)
  useEffect(() => {
    setSnapped(finalState.isSnapped);
  }, [finalState.isSnapped]);

  const updateAngle = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    
    // Transform mouse coordinate to SVG space
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const mouseX = (clientX - CTM.e) / CTM.a;
    const mouseY = (clientY - CTM.f) / CTM.d;
    
    const start = finalState.startPt;
    const newAngle = Math.atan2(mouseY - start.y, mouseX - start.x);
    
    setAngle(newAngle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateAngle(e.clientX, e.clientY);
  };

  const handleTouch = (e: React.TouchEvent) => {
    // Prevent scrolling or other default behaviors
    // Note: 'touch-none' CSS class handles most of this, but preventDefault ensures it
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length > 0) {
      updateAngle(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Fixed Large Viewport for Stability
  const viewBox = "-500 -1000 3500 3000";

  // Metrics Calculation for Display
  // We use the first polygon (Face 0) to determine unit sizes
  const poly0 = finalState.polygons[0];
  // Radius is distance from center to any vertex
  const radiusPixels = vecLen(vecSub(poly0.vertices[0].pt, poly0.center));
  // Side length is distance between vertex 0 and 1
  const sidePixels = vecLen(vecSub(poly0.vertices[0].pt, poly0.vertices[1].pt));

  const formatSig = (n: number) => n.toPrecision(6);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Dodecahedron Unfolder
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
             Ray starts from Vertex <span style={{color: VERTEX_PALETTE[1], fontWeight: 'bold'}}>1 (A)</span>.
             Target is another <span style={{color: VERTEX_PALETTE[1], fontWeight: 'bold'}}>1</span>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
             <div className={`px-2 py-1 rounded border ${finalState.isSnapped ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
               {finalState.isSnapped ? 'SNAPPED TO VERTEX 1' : 'FREE ROAM'}
             </div>
             <div className="px-2 py-1 rounded border border-slate-700 bg-slate-800">
               {finalState.polygons.length} Faces
             </div>
          </div>
          
          {/* Geodesic Info */}
          {finalState.isSnapped && (
              <div className="mt-3 border-t border-slate-700/50 pt-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Geodesic Length</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono">
                   <div className="flex flex-col">
                     <span className="text-xs text-slate-400">Units of R</span>
                     <span className="text-cyan-300 font-bold">{formatSig(finalState.snapDistance / radiusPixels)}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs text-slate-400">Units of Side</span>
                     <span className="text-cyan-300 font-bold">{formatSig(finalState.snapDistance / sidePixels)}</span>
                   </div>
                </div>
              </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex gap-3 text-[10px] uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{background: VERTEX_PALETTE[0]}}>0</div>O</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{background: VERTEX_PALETTE[1]}}>1</div>A</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{background: VERTEX_PALETTE[2]}}>2</div></div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{background: VERTEX_PALETTE[3]}}>3</div></div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{background: VERTEX_PALETTE[4]}}>4</div></div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 relative cursor-crosshair">
        <svg 
           ref={svgRef}
           viewBox={viewBox} 
           className="w-full h-full touch-none select-none"
           onMouseMove={handleMouseMove}
           onTouchStart={handleTouch}
           onTouchMove={handleTouch}
        >
           {/* Background Grid */}
           <defs>
             <pattern id="grid" width="500" height="500" patternUnits="userSpaceOnUse">
               <path d="M 500 0 L 0 0 0 500" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2"/>
             </pattern>
           </defs>
           <rect x="-2000" y="-2000" width="8000" height="6000" fill="url(#grid)" />

           {/* Polygons */}
           <g>
             {finalState.polygons.map((poly, i) => (
               <g key={i}>
                 <polygon
                   points={poly.vertices.map(v => `${v.pt.x.toFixed(1)},${v.pt.y.toFixed(1)}`).join(' ')}
                   fill={COLORS[poly.faceId]}
                   fillOpacity={0.2 + (i === 0 ? 0.4 : 0)} // Highlight start face
                   stroke={COLORS[poly.faceId]}
                   strokeWidth={finalState.isSnapped ? 4 : 2}
                   strokeLinejoin="round"
                 />
                 {/* Face Number */}
                 <text
                   x={poly.center.x}
                   y={poly.center.y}
                   textAnchor="middle"
                   dominantBaseline="middle"
                   fontSize="40"
                   fill="rgba(255,255,255,0.3)"
                   className="pointer-events-none"
                 >
                   {poly.faceId}
                 </text>
                 
                 {/* Vertices */}
                 {poly.vertices.map((v, idx) => {
                    const isStartVertex = v.id === START_VERTEX_ID;
                    const isInitialVert = v.id <= 4; // Only label 0, 1, 2, 3, 4
                    const isSnappedTarget = isStartVertex && i > 0 && finalState.isSnapped;

                    // If not an initial vertex (and not the special snapped target which is implicitly ID 1), show subtle dot
                    if (!isInitialVert) {
                        return (
                            <circle 
                                key={idx} 
                                cx={v.pt.x} 
                                cy={v.pt.y} 
                                r={3} 
                                fill="#475569" // Slate-600
                                className="pointer-events-none opacity-50"
                            />
                        );
                    }

                    // Main rendering for Initial Vertices (0-4)
                    const baseColor = VERTEX_PALETTE[v.id];

                    return (
                       <g key={idx}>
                         <circle 
                           cx={v.pt.x} cy={v.pt.y} 
                           r={isSnappedTarget ? 16 : 10} 
                           fill={baseColor} 
                           stroke={isSnappedTarget ? "#fff" : "rgba(0,0,0,0.3)"} 
                           strokeWidth={isSnappedTarget ? 3 : 1} 
                         />
                         <text 
                           x={v.pt.x} 
                           y={v.pt.y} 
                           dy=".35em" // Vertical center
                           textAnchor="middle" 
                           fill="#1e293b" // Dark text for contrast
                           fontSize="12" 
                           fontWeight="bold"
                           className="pointer-events-none"
                         >
                           {v.id}
                         </text>
                       </g>
                    );
                 })}
               </g>
             ))}
           </g>

           {/* Ray */}
           <line 
             x1={finalState.startPt.x}
             y1={finalState.startPt.y}
             x2={finalState.startPt.x + Math.cos(finalState.angle) * 4000}
             y2={finalState.startPt.y + Math.sin(finalState.angle) * 4000}
             stroke={finalState.isSnapped ? VERTEX_PALETTE[1] : "#fbbf24"}
             strokeWidth={finalState.isSnapped ? 6 : 2}
             strokeDasharray={finalState.isSnapped ? "" : "10, 10"}
             opacity={0.8}
           />
        </svg>
      </main>
    </div>
  );
}
