import PropTypes from 'prop-types';

/**
 * Gráfica de barras en SVG puro (sin librerías externas).
 * @param {{ data: {label: string, value: number}[], height?: number,
 *           color?: string }} props
 */
export default function SvgBarChart({ data, height = 180, color = '#52b788' }) {
  const width = 320;
  const padding = { top: 12, right: 8, bottom: 26, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const barW = (innerW - gap * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Gráfica de barras"
    >
      <line
        x1={padding.left}
        y1={padding.top + innerH}
        x2={padding.left + innerW}
        y2={padding.top + innerH}
        stroke="#d1d5db"
      />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padding.left + i * (barW + gap);
        const y = padding.top + innerH - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={color}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={height - 8}
              fontSize="9"
              fill="#6b7280"
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

SvgBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string, value: PropTypes.number })
  ).isRequired,
  height: PropTypes.number,
  color: PropTypes.string,
};
