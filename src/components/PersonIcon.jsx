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
      <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
      {/* Shoulders & tapered torso */}
      <path
        d="M8 9.5 C8 8.8, 8.6 8.3, 9.3 8.5 L12 9.2 L14.7 8.5 C15.4 8.3, 16 8.8, 16 9.5 L15.5 14.5 C15.5 15, 15 15.3, 14.6 15.1 L12 14.2 L9.4 15.1 C9 15.3, 8.5 15, 8.5 14.5 Z"
        fill="currentColor"
        stroke="none"
      />
      {/* Arms */}
      <line x1="7" y1="9.8" x2="5" y2="13" />
      <line x1="17" y1="9.8" x2="19" y2="13" />
      {/* Legs */}
      <line x1="12" y1="14.5" x2="9" y2="21" />
      <line x1="12" y1="14.5" x2="15" y2="21" />
    </svg>
  );
}