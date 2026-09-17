import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 28 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Stylized C */}
      <path 
        d="M 380 95 A 210 210 0 1 0 425 355 L 365 315 A 140 140 0 1 1 335 155 Z" 
        fill="#003882"
      />
      
      {/* Shield Outline */}
      <path 
        d="M 256 130 C 290 145 320 150 330 150 L 330 250 C 330 315 295 365 256 395 C 217 365 182 315 182 250 L 182 150 C 192 150 222 145 256 130 Z" 
        stroke="#003882" 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />

      {/* Target Center Rings */}
      <circle cx="256" cy="245" r="55" stroke="#003882" strokeWidth="20" fill="none"/>
      
      {/* Red Radar Scanner / Needle */}
      <path 
        d="M 256 245 L 360 140" 
        stroke="#D32F2F" 
        strokeWidth="26" 
        strokeLinecap="round"
      />
      <circle cx="256" cy="245" r="22" fill="#D32F2F" />

      {/* Accent Radar Arc on Right */}
      <path 
        d="M 320 180 A 100 100 0 0 1 345 245" 
        stroke="#D32F2F" 
        strokeWidth="24" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
