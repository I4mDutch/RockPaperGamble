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
    md: 'w-10 h-10 text-base rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-xl',
    xl: 'w-20 h-20 text-3xl rounded-2xl',
    '2xl': 'w-32 h-32 text-5xl rounded-3xl',
  }

  const isEmoji = url && !url.startsWith('http')
  const hasImage = url && url.startsWith('http')

  return (
    <div 
      className={`shrink-0 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color || '#334155' }}
    >
      {hasImage ? (
        <img
          src={url}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : isEmoji ? (
        <span>{url}</span>
      ) : (
        <span className="text-white font-black uppercase tracking-tighter">
          {initials || name?.slice(0, 2).toUpperCase() || '??'}
        </span>
      )}
    </div>
  )
}
