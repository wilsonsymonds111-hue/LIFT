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
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      {/* Thin torso */}
      <line x1="12" y1="6.5" x2="12" y2="12.5" />
      {/* Arms — 45° up-and-out from top of torso */}
      <line x1="12" y1="7" x2="7.5" y2="2.5" />
      <line x1="12" y1="7" x2="16.5" y2="2.5" />
      {/* Legs — 45° down-and-out from bottom of torso */}
      <line x1="12" y1="12.5" x2="7.5" y2="17" />
      <line x1="12" y1="12.5" x2="16.5" y2="17" />
    </svg>
  );
}