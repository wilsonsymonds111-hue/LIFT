import { memo } from 'react';

const Sparkline = memo(function Sparkline({ data, width = 64, height = 32 }) {
  if (!data?.length) return null;
  const values = data.map(d => d.v).filter(v => v != null);
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padX = values.length === 1 ? width / 2 : 0;
  const stepX = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = padX + i * stepX;
    const y = height - 2 - ((v - min) / range) * (height - 6);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0 block">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#3b82b6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const x = padX + i * stepX;
        const y = height - 2 - ((v - min) / range) * (height - 6);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="white" stroke="#3b82b6" strokeWidth="1.5" />;
      })}
    </svg>
  );
});

export default Sparkline;