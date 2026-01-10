import * as Handler from '../../../../../server/handlers.js'

const colors = {
  background: '#161616',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
}

export default Handler.og(({ title, description, logo }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: 80,
      backgroundColor: colors.background,
      color: colors.text,
    }}
  >
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
      }}
    >
      <div
        style={{
          fontSize: title.length < 15 ? 80 : 64,
          fontWeight: 700,
          lineHeight: 1.1,
          color: colors.text,
        }}
      >
        {title}
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
))
