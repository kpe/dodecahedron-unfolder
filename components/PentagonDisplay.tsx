
import React from 'react';
import { PlacedPentagon } from '../types';

interface PentagonDisplayProps {
  pentagon: PlacedPentagon;
  onEdgeClick: (parentId: number, edgeIndex: number) => void;
  openEdges: boolean[];
}

const PentagonDisplay: React.FC<PentagonDisplayProps> = ({ pentagon, onEdgeClick, openEdges }) => {
  const verticesString = pentagon.vertices.map(p => `${p.x},${p.y}`).join(' ');

  const colors = [
    'fill-red-500/80', 'fill-blue-500/80', 'fill-green-500/80', 'fill-yellow-500/80',
    'fill-purple-500/80', 'fill-pink-500/80', 'fill-indigo-500/80', 'fill-teal-500/80',
    'fill-orange-500/80', 'fill-cyan-500/80', 'fill-emerald-500/80', 'fill-rose-500/80'
  ];
  const color = colors[pentagon.id % colors.length];

  return (
    <g>
      <polygon
        points={verticesString}
        className={`${color} stroke-gray-300 stroke-2 transition-opacity duration-500`}
      />
      <text
        x={pentagon.center.x}
        y={pentagon.center.y}
        dy=".3em"
        textAnchor="middle"
        className="fill-white font-bold text-4xl pointer-events-none"
      >
        {pentagon.id + 1}
      </text>
      {pentagon.vertices.map((v1, index) => {
        const v2 = pentagon.vertices[(index + 1) % 5];
        const isOpen = openEdges[index];

        return (
          <line
            key={index}
            x1={v1.x}
            y1={v1.y}
            x2={v2.x}
            y2={v2.y}
            className={`
              stroke-transparent stroke-[16] transition-all duration-200
              ${isOpen ? 'cursor-pointer hover:stroke-cyan-400/70' : ''}
            `}
            onClick={() => isOpen && onEdgeClick(pentagon.id, index)}
          />
        );
      })}
    </g>
  );
};

export default PentagonDisplay;
