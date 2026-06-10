import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'icon' | 'full';
  height?: number | string;
  width?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'icon', 
  height, 
  width 
}) => {
  if (variant === 'icon') {
    return (
      <svg
        className={className}
        viewBox="0 0 100 100"
        width={width || "100%"}
        height={height || "100%"}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background dark outer ring */}
        <circle cx="50" cy="50" r="44" fill="#011832" stroke="#ffffff" strokeWidth="1" />
        
        {/* Gear section on the right (silver color) */}
        <path
          d="M 64 26 C 68 28, 71 31, 74 34 L 81 30 L 85 37 L 78 41 C 79 44, 79 47, 79 50 C 79 53, 79 56, 78 59 L 85 63 L 81 70 L 74 66 C 71 69, 68 72, 64 74 L 66 82 L 58 84 L 55 76 C 53 76, 51 77, 50 77"
          fill="#94a3b8"
          opacity="0.8"
        />
        <circle cx="50" cy="50" r="34" fill="#011832" />

        {/* Inner glow circle segments (electric blue) */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="#00b0ff" strokeWidth="5" strokeDasharray="130 50" strokeDashoffset="12" />

        {/* Circular blue cut out / stylized C */}
        <path
          d="M 72 32 C 55 12, 23 20, 23 50 C 23 80, 55 88, 72 68"
          fill="none"
          stroke="#0082c8"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 68 35 C 55 20, 30 26, 30 50 C 30 74, 55 80, 68 65"
          fill="none"
          stroke="#00b0ff"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Electronic circuitry nodes on the left side of the "C" */}
        {/* circuit line 1: top */}
        <path d="M 33 34 L 20 34 L 14 26" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="26" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />

        {/* circuit line 2: middle */}
        <path d="M 28 50 L 12 50" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="50" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />

        {/* circuit line 3: bottom */}
        <path d="M 33 66 L 20 66 L 14 74" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="74" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />
      </svg>
    );
  }

  // Variant Full includes icon, text and the decorative bottom accent line
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Icon portion */}
      <div className="w-24 h-24 sm:w-28 sm:h-28">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#011832" stroke="#ffffff" strokeWidth="1" />
          <path
            d="M 64 26 C 68 28, 71 31, 74 34 L 81 30 L 85 37 L 78 41 C 79 44, 79 47, 79 50 C 79 53, 79 56, 78 59 L 85 63 L 81 70 L 74 66 C 71 69, 68 72, 64 74 L 66 82 L 58 84 L 55 76 L 50 77"
            fill="#94a3b8"
            opacity="0.8"
          />
          <circle cx="50" cy="50" r="34" fill="#011832" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#00b0ff" strokeWidth="5" strokeDasharray="130 50" strokeDashoffset="12" />
          <path
            d="M 72 32 C 55 12, 23 20, 23 50 C 23 80, 55 88, 72 68"
            fill="none"
            stroke="#0082c8"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M 68 35 C 55 20, 30 26, 30 50 C 30 74, 55 80, 68 65"
            fill="none"
            stroke="#00b0ff"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M 33 34 L 20 34 L 14 26" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="14" cy="26" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />
          <path d="M 28 50 L 12 50" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="50" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />
          <path d="M 33 66 L 20 66 L 14 74" fill="none" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="14" cy="74" r="3.5" fill="#ffffff" stroke="#00b0ff" strokeWidth="2" />
        </svg>
      </div>

      {/* C.E.S.T.I text with modern futuristic tech-design */}
      <div className="mt-3 text-center">
        <span className="text-3xl font-extrabold tracking-[0.2em] text-[#011832] font-sans">
          C.E.S.T.I.
        </span>
      </div>

      {/* Glowing tech divider */}
      <div className="relative w-48 h-3 mt-1 flex items-center justify-center">
        <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00b0ff] to-transparent" opacity="0.7" />
        <div className="w-2 h-2 rounded-full bg-[#00b0ff] border border-white shadow-sm shadow-[#00b0ff]" />
      </div>
    </div>
  );
};

export default Logo;
