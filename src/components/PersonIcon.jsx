export default function PersonIcon({ className, strokeWidth = 2.2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head */}
      <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
      {/* Torso */}
      <line x1="12" y1="7" x2="12" y2="13" />
      {/* Arms — out then bend down at elbows */}
      <polyline points="12,8 7.5,6 6,10" fill="none" />
      <polyline points="12,8 16.5,6 18,10" fill="none" />
      {/* Legs — wide stance */}
      <line x1="12" y1="13" x2="7" y2="19.5" />
      <line x1="12" y1="13" x2="17" y2="19.5" />
    </svg>
  );
}