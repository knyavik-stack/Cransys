import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Cransys — Автоматизированный аудит Яндекс.Директ';
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
          background: 'linear-gradient(135deg, #002254 0%, #003882 50%, #0a4da2 100%)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#003882',
                fontSize: '36px',
                fontWeight: 800,
              }}
            >
              C
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px' }}>
                Cransys
              </span>
              <span style={{ fontSize: '16px', color: '#93c5fd', fontWeight: 600 }}>
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
