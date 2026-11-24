// src/components/about/ArchitectureDiagram.jsx
import { ARCHITECTURE_LAYERS } from '../../constants/about/diagramData';

function DiagramBox({ box, x, width }) {
  const boxWidth = width - 30;
  return (
    <g>
      <rect
        x={x + 15}
        y={box.y}
        width={boxWidth}
        height={box.height}
        rx="8"
        fill={box.fill}
        className="dark:fill-slate-800"
      />
      <text
        x={x + 25}
        y={box.y + 21}
        fontSize="11"
        fontWeight="bold"
        fill={box.titleColor}
        className="dark:fill-slate-200"
      >
        {box.title}
      </text>
      {box.line1 && (
        <text x={x + 25} y={box.y + 34} fontSize="9" fill={box.titleColor}>
          {box.line1}
        </text>
      )}
      {box.line2 && (
        <text x={x + 25} y={box.y + 46} fontSize="9" fill="#64748b">
          {box.line2}
        </text>
      )}
    </g>
  );
}

function DiagramLayer({ layer }) {
  return (
    <g>
      <rect
        x={layer.x}
        y="20"
        width={layer.width}
        height="320"
        rx="16"
        fill="#f8fafc"
        stroke={layer.stroke}
        strokeWidth="2"
        className={`dark:fill-slate-900 ${layer.darkStroke}`}
      />
      <text x={layer.x + 20} y="48" fontSize="13" fontWeight="bold" fill={layer.titleColor}>
        {layer.title}
      </text>
      {layer.boxes.map((b, idx) => (
        <DiagramBox key={idx} box={b} x={layer.x} width={layer.width} />
      ))}
    </g>
  );
}

export default function ArchitectureDiagram() {
  return (
    <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
      <svg
        viewBox="0 0 860 360"
        className="w-full min-w-[700px] h-auto select-none"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
          </marker>
          <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
          </marker>
        </defs>

        {ARCHITECTURE_LAYERS.map((layer) => (
          <DiagramLayer key={layer.id} layer={layer} />
        ))}

        <path d="M 240 180 L 310 180" stroke="#0284c7" strokeWidth="2.5" fill="none" markerEnd="url(#arrow)" />
        <path d="M 550 180 L 610 180" stroke="#059669" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-green)" />
      </svg>
    </div>
  );
}
