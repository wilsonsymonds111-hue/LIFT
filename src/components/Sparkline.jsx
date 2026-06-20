import { memo } from 'react';

const Sparkline = memo(function Sparkline({ data, width = 64, height = 32 }) {
  if (!data?.length) return null;
  const values = data.map(d => d.v).filter(v => v != null);
  if (values.length === 0) return null;
  const PAD = 3;
  const innerW = width - PAD * 2;
  const innerH = height - PAD * 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padX = values.length === 1 ? innerW / 2 : 0;
  const stepX = values.length === 1 ? 0 : innerW / (values.length - 1);
  const points = values.map((v, i) => {
    const x = PAD + padX + i * stepX;
    const y = PAD + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0 block" overflow="visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#3b82b6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const x = PAD + padX + i * stepX;
        const y = PAD + innerH - ((v - min) / range) * innerH;
        return <circle key={i} cx={x} cy={y} r="2.5" fill="white" stroke="#3b82b6" strokeWidth="1.5" />;
      })}
    </svg>
  );
});

export default Sparkline;