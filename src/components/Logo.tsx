import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

export const QuikTalksIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', size }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Deep Indigo/Dark Purple Circle matching uploaded asset */}
      <circle cx="100" cy="100" r="98" fill="#25184B" />

      {/* 3 Concentric Broadcast Signal Waves in Top-Right Quadrant */}
      {/* Outer Wave (Darker Teal) */}
      <path 
        d="M 136 42 A 80 80 0 0 1 162 82" 
        stroke="#206B6B" 
        strokeWidth="9.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Middle Wave (Vibrant Teal) */}
      <path 
        d="M 130 54 A 62 62 0 0 1 149 85" 
        stroke="#1AA397" 
        strokeWidth="9.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Inner Wave (Bright Cyan / Mint) */}
      <path 
        d="M 124 67 A 44 44 0 0 1 137 89" 
        stroke="#36EED6" 
        strokeWidth="9.5" 
        strokeLinecap="round" 
        fill="none"
      />

      {/* Telephone Receiver Handset (Warm Golden Amber #FFB81C) */}
      <path 
        d="M 64 70 
           C 64 63 68 59 75 59 
           L 84 59 
           C 88 59 92 62 93 66 
           L 98 82 
           C 99 86 97 90 93 92 
           L 87 96 
           C 93 107 103 117 114 123 
           L 118 117 
           C 120 113 124 111 128 112 
           L 144 117 
           C 148 118 151 122 151 126 
           L 151 135 
           C 151 142 147 146 140 146 
           C 98 146 64 112 64 70 Z" 
        fill="#FFB81C" 
      />
    </svg>
  );
};

interface LogoProps {
  className?: string;
  iconSize?: string;
  showTagline?: boolean;
  taglineClassName?: string;
  titleClassName?: string;
}

export const QuikTalksLogo: React.FC<LogoProps> = ({
  className = 'flex items-center gap-2.5',
  iconSize = 'w-8 h-8',
  showTagline = false,
  taglineClassName = 'text-xs text-slate-400 font-medium',
  titleClassName = 'font-extrabold text-white tracking-wide font-sans text-base',
}) => {
  return (
    <div className={className}>
      <QuikTalksIcon className={`${iconSize} shrink-0 drop-shadow-md`} />
      <div className="flex flex-col justify-center">
        <div className={titleClassName}>
          <span>Quik</span>
          <span className="text-cyan-400">Talks</span>
        </div>
        {showTagline && (
          <span className={taglineClassName}>
            No camera, no sign-up - just talk!
          </span>
        )}
      </div>
    </div>
  );
};

