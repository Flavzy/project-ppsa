export default function Badge({
  variant = 'light',
  color = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  children,
  className = '',
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors'

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-theme-xs',
    md: 'px-3 py-1 text-sm',
  }

  const variants = {
    light: {
      primary: 'bg-brand-50 text-brand-600 border border-brand-200/60 dark:bg-brand-500/15 dark:text-brand-400',
      success: 'bg-success-50 text-success-700 border border-success-200/60 dark:bg-success-500/15 dark:text-success-500',
      error: 'bg-error-50 text-error-700 border border-error-200/60 dark:bg-error-500/15 dark:text-error-500',
      warning: 'bg-warning-50 text-warning-700 border border-warning-200/60 dark:bg-warning-500/15 dark:text-warning-400',
      info: 'bg-blue-light-50 text-blue-light-700 border border-blue-light-200/60 dark:bg-blue-light-500/15 dark:text-blue-light-500',
      light: 'bg-gray-100 text-gray-700 border border-gray-200/60 dark:bg-white/5 dark:text-white/80',
      dark: 'bg-gray-800 text-white border border-gray-700',
    },
    solid: {
      primary: 'bg-brand-500 text-white shadow-xs hover:bg-brand-600',
      success: 'bg-success-600 text-white shadow-xs hover:bg-success-700',
      error: 'bg-error-600 text-white shadow-xs hover:bg-error-700',
      warning: 'bg-warning-500 text-white shadow-xs hover:bg-warning-600',
      info: 'bg-blue-light-500 text-white shadow-xs hover:bg-blue-light-600',
      light: 'bg-gray-200 text-gray-800',
      dark: 'bg-gray-900 text-white',
    },
  }

  const sizeClass = sizeStyles[size] || sizeStyles.md
  const colorStyles = variants[variant]?.[color] || variants.light.primary

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${className}`}>
      {startIcon && <span className="inline-flex shrink-0">{startIcon}</span>}
      {children}
      {endIcon && <span className="inline-flex shrink-0">{endIcon}</span>}
    </span>
  )
}
