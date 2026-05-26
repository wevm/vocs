import * as Handler from '../../../../../server/handlers.js'

const colors = {
  background: '#161616',
  pattern: '#202020',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
}

const dimensions = {
  height: 630,
  width: 1200,
}

const patternStep = 56
const diagonalOffsets = Array.from(
  { length: Math.ceil((dimensions.width + dimensions.height * 2) / patternStep) },
  (_, index) => index * patternStep - dimensions.height,
)
const reverseDiagonalOffsets = Array.from(
  { length: Math.ceil((dimensions.width + dimensions.height * 2) / patternStep) },
  (_, index) => index * patternStep,
)

export default function handler(request: Request) {
  return Handler.og(({ title, description, logo }) => {
    const titleLines = title.split('\n')

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: colors.background,
          color: colors.text,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <svg
            aria-hidden
            width={dimensions.width}
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            fill="none"
          >
            <title>Background pattern</title>
            {diagonalOffsets.map((offset) => (
              <line
                key={`diagonal-${offset}`}
                x1={offset}
                y1={0}
                x2={offset + dimensions.height}
                y2={dimensions.height}
                stroke={colors.pattern}
                strokeWidth={1.5}
              />
            ))}
            {reverseDiagonalOffsets.map((offset) => (
              <line
                key={`reverse-diagonal-${offset}`}
                x1={offset}
                y1={0}
                x2={offset - dimensions.height}
                y2={dimensions.height}
                stroke={colors.pattern}
                strokeWidth={1.5}
              />
            ))}
          </svg>
        </div>

        {logo && (
          <img
            alt=""
            src={logo}
            style={{
              height: 48,
              position: 'absolute',
              right: 40,
              bottom: 40,
            }}
          />
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: 80,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: title.length < 15 ? 80 : 64,
              fontWeight: 700,
              lineHeight: 1.1,
              color: colors.text,
            }}
          >
            {titleLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>

          {description && (
            <div
              style={{
                fontSize: 28,
                color: colors.textMuted,
                maxWidth: 800,
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>
    )
  }).fetch(request)
}
