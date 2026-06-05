import PropTypes from 'prop-types';

/**
 * Gráfica de líneas en SVG puro (sin librerías externas).
 * @param {{ data: {label: string, value: number}[], height?: number,
 *           color?: string, unidad?: string }} props
 */
export default function SvgLineChart({
  data,
  height = 200,
  color = '#2d6a4f',
  unidad = '',
}) {
  const width = 320;
  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding.top + innerH - ((d.value - min) / range) * innerH;
    return { ...d, x, y };
  });

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Gráfica de evolución"
    >
      {/* Ejes */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + innerH}
        stroke="#d1d5db"
      />
      <line
        x1={padding.left}
        y1={padding.top + innerH}
        x2={padding.left + innerW}
        y2={padding.top + innerH}
        stroke="#d1d5db"
      />
      {/* Etiquetas Y (min/max) */}
      <text x="4" y={padding.top + 4} fontSize="9" fill="#6b7280">
        {max.toFixed(0)}
      </text>
      <text x="4" y={padding.top + innerH} fontSize="9" fill="#6b7280">
        {min.toFixed(0)}
      </text>

      {/* Línea */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

      {/* Puntos + etiquetas X */}
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={color}>
            <title>{`${p.label}: ${p.value} ${unidad}`}</title>
          </circle>
          <text
            x={p.x}
            y={height - 8}
            fontSize="9"
            fill="#6b7280"
            textAnchor="middle"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

SvgLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string, value: PropTypes.number })
  ).isRequired,
  height: PropTypes.number,
  color: PropTypes.string,
  unidad: PropTypes.string,
};
