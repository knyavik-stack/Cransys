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
        <path d="M 370 175 A 155 155 0 1 0 370 337" />
        
        {/* Внутренний контур C */}
        <path d="M 305 215 A 75 75 0 1 0 305 297" />
        
        {/* Торцы дуги */}
        <line x1="305" y1="215" x2="370" y2="175" />
        <line x1="305" y1="297" x2="370" y2="337" />

        {/* Вертикальная конструктивная стойка */}
        <line x1="180" y1="180" x2="180" y2="332" />

        {/* Диагональные балки фермы чертежа */}
        <line x1="180" y1="256" x2="310" y2="175" />
        <line x1="180" y1="256" x2="310" y2="337" />
        <line x1="180" y1="180" x2="256" y2="256" />
        <line x1="180" y1="332" x2="256" y2="256" />
      </g>

      {/* Красный геодезический вектор-указатель */}
      <polygon 
        points="395,190 418,230 355,212" 
        fill="#DC2626" 
      />
    </svg>
  );
}
