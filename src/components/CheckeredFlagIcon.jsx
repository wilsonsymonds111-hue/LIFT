export default function CheckeredFlagIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Pole */}
      <path d="M 4 3 L 4 22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Waving checkered flag */}
      <defs>
        <path id="flagWave" d="M 4 5 Q 10 3 16 6 T 20 10 L 20 16 Q 10 18 4 16 Z" />
        <clipPath id="flagClip">
          <use href="#flagWave" />
        </clipPath>
      </defs>
      
      {/* Checkered pattern in flag */}
      <g clipPath="url(#flagClip)">
        {/* Green and white checkerboard */}
        <rect x="4" y="3" width="3" height="3" fill="#22c55e" />
        <rect x="7" y="3" width="3" height="3" fill="white" />
        <rect x="10" y="3" width="3" height="3" fill="#22c55e" />
        <rect x="13" y="3" width="3" height="3" fill="white" />
        <rect x="16" y="3" width="3" height="3" fill="#22c55e" />
        
        <rect x="4" y="6" width="3" height="3" fill="white" />
        <rect x="7" y="6" width="3" height="3" fill="#22c55e" />
        <rect x="10" y="6" width="3" height="3" fill="white" />
        <rect x="13" y="6" width="3" height="3" fill="#22c55e" />
        <rect x="16" y="6" width="3" height="3" fill="white" />
        
        <rect x="4" y="9" width="3" height="3" fill="#22c55e" />
        <rect x="7" y="9" width="3" height="3" fill="white" />
        <rect x="10" y="9" width="3" height="3" fill="#22c55e" />
        <rect x="13" y="9" width="3" height="3" fill="white" />
        <rect x="16" y="9" width="3" height="3" fill="#22c55e" />
        
        <rect x="4" y="12" width="3" height="3" fill="white" />
        <rect x="7" y="12" width="3" height="3" fill="#22c55e" />
        <rect x="10" y="12" width="3" height="3" fill="white" />
        <rect x="13" y="12" width="3" height="3" fill="#22c55e" />
        <rect x="16" y="12" width="3" height="3" fill="white" />
      </g>
      
      {/* Flag outline */}
      <use href="#flagWave" stroke="white" strokeWidth="0.8" fill="none" />
    </svg>
  );
}