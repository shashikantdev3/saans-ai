import { ImageResponse } from 'next/og';

export const alt = 'Saans: breathe easier through winter smog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Link-preview card for LinkedIn and chat apps, drawn in code so no image files are committed. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(180deg, #cfe6f3 0%, #a9a395 100%)',
        color: '#1d2b36',
      }}
    >
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>Saans</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 52, fontWeight: 700 }}>Breathe easier through winter smog</div>
        <div style={{ fontSize: 32, marginTop: 16 }}>
          Live Indian AQI, a daily plan for your family, and the impact of every choice
        </div>
      </div>
    </div>,
    size,
  );
}
