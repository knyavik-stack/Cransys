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
      {/* Инженерная чертёжная сетка Blueprint */}
      <g stroke="#7EA8D3" strokeWidth="6" opacity="0.65" strokeLinecap="round">
        <line x1="100" y1="160" x2="430" y2="160" />
        <line x1="100" y1="256" x2="430" y2="256" />
        <line x1="100" y1="352" x2="430" y2="352" />
        
        <line x1="160" y1="100" x2="160" y2="430" />
        <line x1="256" y1="100" x2="256" y2="430" />
        <line x1="352" y1="100" x2="352" y2="430" />
      </g>

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
