export default function CheckeredFlagIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Pole */}
      <line x1="3" y1="3" x2="3" y2="20" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Checkered flag - green and white */}
      <g>
        {/* Row 1 */}
        <rect x="3" y="3" width="4" height="4" fill="#22c55e" />
        <rect x="7" y="3" width="4" height="4" fill="white" stroke="#22c55e" strokeWidth="0.5" />
        <rect x="11" y="3" width="4" height="4" fill="#22c55e" />
        
        {/* Row 2 */}
        <rect x="3" y="7" width="4" height="4" fill="white" stroke="#22c55e" strokeWidth="0.5" />
        <rect x="7" y="7" width="4" height="4" fill="#22c55e" />
        <rect x="11" y="7" width="4" height="4" fill="white" stroke="#22c55e" strokeWidth="0.5" />
        
        {/* Row 3 */}
        <rect x="3" y="11" width="4" height="4" fill="#22c55e" />
        <rect x="7" y="11" width="4" height="4" fill="white" stroke="#22c55e" strokeWidth="0.5" />
        <rect x="11" y="11" width="4" height="4" fill="#22c55e" />
      </g>
    </svg>
  );
}