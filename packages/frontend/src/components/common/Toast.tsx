import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

export const Toast = ({ message, type = 'error', onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    error: <AlertCircle size={20} className="text-red-400" />,
    success: <CheckCircle size={20} className="text-emerald-400" />,
    info: <Info size={20} className="text-brand-primary" />
  }

  const styles = {
    error: 'bg-red-500/10 border-red-500/30 text-red-100',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
    info: 'bg-brand-primary/10 border-brand-primary/30 text-white'
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${styles[type]}`}>
        {icons[type]}
        <p className="text-sm font-medium">{message}</p>
        
        <button 
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}