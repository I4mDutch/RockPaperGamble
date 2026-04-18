interface AvatarProps {
  url?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export const Avatar = ({ url, name, size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-10 h-10 text-xl rounded-xl',
    lg: 'w-12 h-12 text-2xl rounded-xl',
    xl: 'w-20 h-20 text-4xl rounded-2xl',
    '2xl': 'w-32 h-32 text-6xl rounded-3xl',
  }

  const isEmoji = url && !url.startsWith('http')
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Player'}`

  return (
    <div className={`shrink-0 bg-slate-700 flex items-center justify-center overflow-hidden border border-white/5 ${sizeClasses[size]} ${className}`}>
      {isEmoji ? (
        <span>{url}</span>
      ) : (
        <img
          src={url || fallbackUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
