export default function LoadingSpinner({
  size = 'md', // 'xs', 'sm', 'md', 'lg', 'screen'
  text = '',
  subtitle,
  className = '',
  ringColor,
}) {
  // If micro/button spinner
  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center justify-center relative size-4 select-none shrink-0 ${className}`}>
        <span
          className={`absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-orange-300 animate-spin ${
            ringColor || ''
          }`}
          style={{ animationDuration: '0.9s' }}
        />
        <img
          src="/images/logo/loading-logo.png"
          alt=""
          className="size-2.5 object-contain select-none pointer-events-none"
        />
      </span>
    )
  }

  const sizeMap = {
    sm: {
      ring: 'size-10',
      logo: 'size-6',
      text: 'text-xs',
      wrap: 'p-3 gap-2',
    },
    md: {
      ring: 'size-16',
      logo: 'size-10',
      text: 'text-sm',
      wrap: 'p-6 gap-3',
    },
    lg: {
      ring: 'size-24',
      logo: 'size-14',
      text: 'text-base',
      wrap: 'p-8 gap-4',
    },
    screen: {
      ring: 'size-28',
      logo: 'size-16',
      text: 'text-sm font-semibold',
      wrap: 'flex-col justify-center items-center gap-4',
    },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`flex flex-col items-center justify-center ${currentSize.wrap} ${className}`}>
      {/* Animated Glowing Ring & Breathing Logo Container */}
      <div className="relative flex items-center justify-center select-none">
        {/* Soft Ambient Glow in the Background */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-brand-500/20 via-orange-400/20 to-brand-500/20 blur-xl animate-pulse" />

        {/* Orbiting Gradient Spinner Ring */}
        <div
          className={`${currentSize.ring} rounded-full border-2 border-transparent border-t-brand-500 border-r-orange-400 border-b-brand-300/40 animate-spin`}
          style={{ animationDuration: '1.2s' }}
        />

        {/* Concentric Subtle Inner Pulse Ring */}
        <div
          className={`absolute ${currentSize.ring} rounded-full border border-brand-100/60 dark:border-gray-800 scale-90`}
        />

        {/* Center Logo with Breathing Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/images/logo/loading-logo.png"
            alt="Loading..."
            className={`${currentSize.logo} object-contain transition-transform duration-700 drop-shadow-sm select-none pointer-events-none`}
            style={{
              animation: 'logo-breathe 2.2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Loading Text & Status Subtitle (only displayed if text is explicitly provided) */}
      {text && (
        <div className="text-center mt-2">
          <p className={`${currentSize.text} text-gray-700 dark:text-gray-300 font-semibold tracking-wide flex items-center justify-center gap-1.5`}>
            <span>{text}</span>
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-normal font-normal">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )

  // Full-screen pure white background variant (no cards, no borders, only the centered logo)
  if (size === 'screen') {
    return (
      <div className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4 transition-colors animate-fade-in select-none">
        {content}
      </div>
    )
  }

  return content
}
