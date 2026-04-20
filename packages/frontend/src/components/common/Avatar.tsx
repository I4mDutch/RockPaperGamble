interface AvatarProps {
  url?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  color?: string
  initials?: string
}

export const Avatar = ({ url, name, size = 'md', className = '', color, initials }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-xl',
    xl: 'w-20 h-20 text-2xl rounded-2xl',
    '2xl': 'w-32 h-32 text-4xl rounded-3xl',
  }

  const isEmoji = url && !url.startsWith('http') && url.length <= 4
  const displayInitials = initials || (name ? name.slice(0, 2).toUpperCase() : '??')

  return (
    <div 
      className={`shrink-0 flex items-center justify-center overflow-hidden border border-white/10 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color || '#334155' }}
    >
      {isEmoji ? (
        <span>{url}</span>
      ) : url ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials on image error
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <span className="font-bold text-white/90">{displayInitials}</span>
      )}
    </div>
  )
}
