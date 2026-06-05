import PropTypes from 'prop-types';

/**
 * Ilustración SVG de un árbol, usada como placeholder cuando no hay foto.
 * @param {{ size?: number }} props
 */
export default function ArbolPlaceholder({ size = 80 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Ilustración de árbol"
    >
      <rect x="44" y="62" width="12" height="28" rx="3" fill="#8d6e63" />
      <circle cx="50" cy="40" r="26" fill="#52b788" />
      <circle cx="32" cy="48" r="18" fill="#2d6a4f" />
      <circle cx="68" cy="48" r="18" fill="#2d6a4f" />
      <circle cx="50" cy="30" r="20" fill="#95d5b2" />
      <ellipse cx="50" cy="92" rx="28" ry="5" fill="#d1d5db" opacity="0.5" />
    </svg>
  );
}

ArbolPlaceholder.propTypes = {
  size: PropTypes.number,
};
