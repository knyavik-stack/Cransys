import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CRANSYS — Автоматизированный аудит Яндекс.Директ';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #001f4d 0%, #003882 55%, #084c9e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* SVG Logo Icon */}
            <svg width="64" height="64" viewBox="0 0 512 512" fill="none">
              <g stroke="#7EA8D3" strokeWidth="8" opacity="0.7" strokeLinecap="round">
                <line x1="100" y1="160" x2="430" y2="160" />
                <line x1="100" y1="256" x2="430" y2="256" />
                <line x1="100" y1="352" x2="430" y2="352" />
                <line x1="160" y1="100" x2="160" y2="430" />
                <line x1="256" y1="100" x2="256" y2="430" />
                <line x1="352" y1="100" x2="352" y2="430" />
              </g>
              <g stroke="#ffffff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 370 175 A 155 155 0 1 0 370 337" />
                <path d="M 305 215 A 75 75 0 1 0 305 297" />
                <line x1="305" y1="215" x2="370" y2="175" />
                <line x1="305" y1="297" x2="370" y2="337" />
                <line x1="180" y1="180" x2="180" y2="332" />
                <line x1="180" y1="256" x2="310" y2="175" />
                <line x1="180" y1="256" x2="310" y2="337" />
                <line x1="180" y1="180" x2="256" y2="256" />
                <line x1="180" y1="332" x2="256" y2="256" />
              </g>
              <polygon points="395,190 418,230 355,212" fill="#DC2626" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                CRANSYS
              </span>
              <span style={{ fontSize: '15px', color: '#93c5fd', fontWeight: 700, letterSpacing: '1px' }}>
                DIRECT AUDIT 2026
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#6ee7b7',
            }}
          >
            ✓ 152-ФЗ РФ Обезличенно
          </div>
        </div>

        {/* Main Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              color: '#ffffff',
            }}
          >
            Независимый аудит Яндекс.Директ за 2 минуты
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#cbd5e1',
              lineHeight: 1.4,
            }}
          >
            Поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '30px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', color: '#93c5fd', textTransform: 'uppercase' }}>
              Скорость проверки
            </span>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>2 минуты</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', color: '#93c5fd', textTransform: 'uppercase' }}>
              База черных списков
            </span>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>4 500+ площадок</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', color: '#93c5fd', textTransform: 'uppercase' }}>
              Формат отчета
            </span>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>XLSX / Direct API</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
