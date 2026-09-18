import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Каркас и контуры буквы C */}
      <g stroke="#003882" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Внешний контур C */}
        <path d="M 395 152 A 195 195 0 1 0 395 360" />
        
        {/* Внутренний контур C */}
        <path d="M 315 204 A 95 95 0 1 0 315 308" />
        
        {/* Торцы дуги */}
        <line x1="315" y1="204" x2="395" y2="152" />
        <line x1="315" y1="308" x2="395" y2="360" />
      </g>

      {/* Красный геодезический вектор-указатель */}
      <polygon points="420,170 450,220 325,235" fill="#DC2626" /> 
    </svg>
  );
}
