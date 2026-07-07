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
      <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
      {/* Thin torso */}
      <line x1="12" y1="7" x2="12" y2="14" />
      {/* Arms — diagonal up-and-out */}
      <line x1="12" y1="8.5" x2="5.5" y2="5.5" />
      <line x1="12" y1="8.5" x2="18.5" y2="5.5" />
      {/* Legs — diagonal down-and-out */}
      <line x1="12" y1="14" x2="7" y2="20.5" />
      <line x1="12" y1="14" x2="17" y2="20.5" />
    </svg>
  );
}