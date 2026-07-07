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
      <circle cx="12" cy="4.5" r="2.2" fill="currentColor" stroke="none" />
      {/* Thick torso */}
      <rect x="9" y="8" width="6" height="6" rx="1.5" fill="currentColor" stroke="none" />
      {/* Arms — horizontal */}
      <line x1="4.5" y1="10.5" x2="19.5" y2="10.5" />
      {/* Legs — V shape */}
      <line x1="12" y1="14" x2="7.5" y2="21" />
      <line x1="12" y1="14" x2="16.5" y2="21" />
    </svg>
  );
}