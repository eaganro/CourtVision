/**
 * Event type configuration with distinct shapes and accessible colors.
 * Each event type has a unique shape + color combination to reduce cognitive load
 * and improve accessibility for colorblind users.
 */

export const EVENT_TYPES = {
  point: {
    label: 'Point',
    color: '#F59E0B', // Amber (darker)
    shape: 'circle',
  },
  miss: {
    label: 'Miss',
    color: '#475569', // Slate (darker)
    shape: 'cross',
  },
  rebound: {
    label: 'Rebound',
    color: '#2563EB', // Blue (darker)
    shape: 'diamond',
  },
  assist: {
    label: 'Assist',
    color: '#059669', // Emerald (darker)
    shape: 'chevron',
  },
  turnover: {
    label: 'Turnover',
    color: '#DC2626', // Red (darker)
    shape: 'triangleDown',
  },
  block: {
    label: 'Block',
    color: '#7C3AED', // Purple (darker)
    shape: 'square',
  },
  steal: {
    label: 'Steal',
    color: '#0891B2', // Cyan (darker)
    shape: 'triangleUp',
  },
  foul: {
    label: 'Foul',
    color: '#111827', // Dark gray (darker)
    shape: 'hexagon',
  },
};

/**
 * Detect event type from action description
 */
export function getEventType(description) {
  if (!description) return null;
  
  if (description.includes('MISS')) return 'miss';
  if (description.includes('PTS')) return 'point';
  if (description.includes('REBOUND')) return 'rebound';
  if (description.includes('AST')) return 'assist';
  if (description.includes('TO)')) return 'turnover';
  if (description.includes('BLK')) return 'block';
  if (description.includes('STL')) return 'steal';
  if (description.includes('PF)')) return 'foul';
  
  return null;
}

/**
 * Render SVG shape for an event type
 * @param {string} eventType - The event type key
 * @param {number} cx - Center X position
 * @param {number} cy - Center Y position
 * @param {number} size - Size of the shape (radius-like)
 * @param {string} key - React key
 * @param {boolean} is3PT - Whether this is a 3-point shot (adds inner marker)
 */
export function renderEventShape(eventType, cx, cy, size, key, is3PT = false) {
  const config = EVENT_TYPES[eventType];
  if (!config) return null;
  
  const { color, shape } = config;
  const s = size; // shorthand
  
  // Helper to create a group with optional 3PT marker
  const wrapWith3PT = (mainShape) => {
    if (!is3PT) return mainShape;
    return (
      <g key={key}>
        {mainShape}
        <circle cx={cx} cy={cy} r={s * 0.6} fill="#DC2626" />
      </g>
    );
  };
  
  switch (shape) {
    case 'circle': {
      // Simple circle
      return wrapWith3PT(
        <circle key={key} cx={cx} cy={cy} r={s} fill={color} />
      );
    }
    
    case 'cross': {
      // X shape
      const t = s * 0.35; // thickness
      const path = `
        M ${cx - s} ${cy - s + t} 
        L ${cx - t} ${cy} 
        L ${cx - s} ${cy + s - t} 
        L ${cx - s + t} ${cy + s} 
        L ${cx} ${cy + t} 
        L ${cx + s - t} ${cy + s} 
        L ${cx + s} ${cy + s - t} 
        L ${cx + t} ${cy} 
        L ${cx + s} ${cy - s + t} 
        L ${cx + s - t} ${cy - s} 
        L ${cx} ${cy - t} 
        L ${cx - s + t} ${cy - s} 
        Z
      `;
      return wrapWith3PT(
        <path key={key} d={path} fill={color} />
      );
    }
    
    case 'diamond': {
      // Rotated square (diamond)
      const points = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`;
      return wrapWith3PT(
        <polygon key={key} points={points} fill={color} />
      );
    }
    
    case 'chevron': {
      // Filled right-pointing arrow/triangle
      const points = `${cx - s * 0.6},${cy - s} ${cx + s},${cy} ${cx - s * 0.6},${cy + s}`;
      return wrapWith3PT(
        <polygon key={key} points={points} fill={color} />
      );
    }
    
    case 'triangleDown': {
      // Downward pointing triangle
      const points = `${cx},${cy + s} ${cx - s},${cy - s * 0.7} ${cx + s},${cy - s * 0.7}`;
      return wrapWith3PT(
        <polygon key={key} points={points} fill={color} />
      );
    }
    
    case 'triangleUp': {
      // Upward pointing triangle
      const points = `${cx},${cy - s} ${cx - s},${cy + s * 0.7} ${cx + s},${cy + s * 0.7}`;
      return wrapWith3PT(
        <polygon key={key} points={points} fill={color} />
      );
    }
    
    case 'square': {
      // Simple square
      return wrapWith3PT(
        <rect 
          key={key} 
          x={cx - s * 0.8} 
          y={cy - s * 0.8} 
          width={s * 1.6} 
          height={s * 1.6} 
          fill={color}
        />
      );
    }
    
    case 'hexagon': {
      // Hexagon (stop-sign-like for fouls)
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        points.push(`${cx + s * Math.cos(angle)},${cy + s * Math.sin(angle)}`);
      }
      return wrapWith3PT(
        <polygon key={key} points={points.join(' ')} fill={color} />
      );
    }
    
    default:
      return wrapWith3PT(
        <circle key={key} cx={cx} cy={cy} r={s} fill={color} />
      );
  }
}

/**
 * Render a legend shape (for StatButtons)
 * Returns an SVG element with the shape centered
 */
export function LegendShape({ eventType, size = 12 }) {
  const config = EVENT_TYPES[eventType];
  if (!config) return null;
  
  const padding = 2;
  const viewSize = size + padding * 2;
  const center = viewSize / 2;
  
  return (
    <svg 
      width={viewSize} 
      height={viewSize} 
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {renderEventShape(eventType, center, center, size / 2, 'legend-shape')}
    </svg>
  );
}

