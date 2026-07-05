export default function TargetArrowIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Bullseye rings */}
      <circle cx="10" cy="14" r="7" fill="#E60000" />
      <circle cx="10" cy="14" r="4.5" fill="#fff" />
      <circle cx="10" cy="14" r="2.5" fill="#E60000" />
      {/* Arrow shaft */}
      <path
        d="M14.5 9.5 L21 3"
        stroke="#1c1c1e"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M13.5 7.5 L15.5 9.5 L17 8 L15 6 Z"
        fill="#1c1c1e"
      />
      {/* Fletching */}
      <path
        d="M21 3 L18.5 3.5 L20.5 5.5 Z"
        fill="#1c1c1e"
      />
    </svg>
  );
}