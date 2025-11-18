
import React, { useState } from 'react';
import { PlacedPentagon } from '../types';

interface PentagonDisplayProps {
  pentagon: PlacedPentagon;
  onEdgeClick: (parentId: number, edgeIndex: number) => void;
  onEdgeHover: (parentId: number, edgeIndex: number, isHovering: boolean) => void;
  hoveredEdge: {parentId: number, edgeIndex: number} | null;
  openEdges: boolean[];
}

const PentagonDisplay: React.FC<PentagonDisplayProps> = ({ pentagon, onEdgeClick, onEdgeHover, hoveredEdge, openEdges }) => {
  const [isHovered, setIsHovered] = useState(false);
  const verticesString = pentagon.vertices.map(p => `${p.x},${p.y}`).join(' ');

  const colors = [
    'rgba(239, 68, 68, 0.8)',   // red-500/80
    'rgba(59, 130, 246, 0.8)',  // blue-500/80
    'rgba(34, 197, 94, 0.8)',   // green-500/80
    'rgba(234, 179, 8, 0.8)',   // yellow-500/80
    'rgba(168, 85, 247, 0.8)',  // purple-500/80
    'rgba(236, 72, 153, 0.8)',  // pink-500/80
    'rgba(99, 102, 241, 0.8)',  // indigo-500/80
    'rgba(20, 184, 166, 0.8)',  // teal-500/80
    'rgba(249, 115, 22, 0.8)',  // orange-500/80
    'rgba(6, 182, 212, 0.8)',   // cyan-500/80
    'rgba(16, 185, 129, 0.8)',  // emerald-500/80
    'rgba(244, 63, 94, 0.8)'    // rose-500/80
  ];
  const baseColor = colors[pentagon.id % colors.length];
  const hoverColor = isHovered ? baseColor.replace('0.8', '1') : baseColor;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleTouchStart = () => setIsHovered(true);
  const handleTouchEnd = () => setIsHovered(false);

  return (
    <g>
      <polygon
        points={verticesString}
        style={{
          fill: hoverColor,
          stroke: isHovered ? '#ffffff' : '#d1d5db',
          strokeWidth: isHovered ? 4 : 2,
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          // Optional: Add click interaction on the face itself
          // This could select or highlight the face in the future
        }}
      />
      <text
        x={pentagon.center.x}
        y={pentagon.center.y}
        dy=".3em"
        textAnchor="middle"
        style={{
          fill: '#ffffff',
          fontSize: isHovered ? '40px' : '32px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {pentagon.id + 1}
      </text>
      {pentagon.vertices.map((v1, index) => {
        const v2 = pentagon.vertices[(index + 1) % 5];
        const isOpen = openEdges[index];
        const isCurrentlyHovered = hoveredEdge?.parentId === pentagon.id && hoveredEdge?.edgeIndex === index;

        return (
          <g key={index}>
            {/* Strong glow effect for active edges */}
            {isOpen && (
              <>
                {/* Outer glow layer */}
                <line
                  x1={v1.x}
                  y1={v1.y}
                  x2={v2.x}
                  y2={v2.y}
                  style={{
                    stroke: isCurrentlyHovered ? 'rgba(34, 211, 238, 0.4)' : 'rgba(6, 182, 212, 0.3)',
                    strokeWidth: isCurrentlyHovered ? 28 : 24,
                    transition: 'all 0.3s ease',
                    filter: isCurrentlyHovered ? 'blur(4px)' : 'blur(2px)'
                  }}
                />
                {/* Middle glow layer */}
                <line
                  x1={v1.x}
                  y1={v1.y}
                  x2={v2.x}
                  y2={v2.y}
                  style={{
                    stroke: isCurrentlyHovered ? 'rgba(103, 232, 249, 0.6)' : 'rgba(34, 211, 238, 0.4)',
                    strokeWidth: isCurrentlyHovered ? 20 : 16,
                    transition: 'all 0.3s ease',
                    filter: 'blur(1px)'
                  }}
                />
              </>
            )}
            {/* Main visible edge line */}
            <line
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              style={{
                stroke: isOpen
                  ? (isCurrentlyHovered ? '#ffffff' : '#22d3ee')
                  : '#9ca3af',
                strokeWidth: isOpen
                  ? (isCurrentlyHovered ? 6 : 5)
                  : 2,
                strokeDasharray: isOpen ? '8,4' : 'none',
                transition: 'all 0.3s ease',
                cursor: isOpen ? 'pointer' : 'default'
              }}
              onClick={() => isOpen && onEdgeClick(pentagon.id, index)}
              onMouseEnter={() => isOpen && onEdgeHover(pentagon.id, index, true)}
              onMouseLeave={() => isOpen && onEdgeHover(pentagon.id, index, false)}
              onTouchStart={() => {
                if (isOpen) {
                  onEdgeClick(pentagon.id, index);
                }
              }}
              onTouchEnd={() => {
                if (isOpen) {
                  onEdgeHover(pentagon.id, index, false);
                }
              }}
            />
            {/* Bright highlight for active edges */}
            {isOpen && (
              <line
                x1={v1.x}
                y1={v1.y}
                x2={v2.x}
                y2={v2.y}
                style={{
                  stroke: isCurrentlyHovered ? '#ffffff' : '#67e8f9',
                  strokeWidth: 2,
                  opacity: isCurrentlyHovered ? 0.8 : 0.6,
                  transition: 'all 0.3s ease',
                  pointerEvents: 'none'
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export default PentagonDisplay;
