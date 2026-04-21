import { AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/store/toastStore'
import { Toast } from './Toast'

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed z-50 flex flex-col gap-3 p-4 pointer-events-none"
      style={{
        // Desktop: top-right
        top: '1rem',
        right: '1rem',
        // Mobile: bottom-center (handled via media query below)
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onRemove={removeToast}
            />
          </div>
        ))}
      </AnimatePresence>
      
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .fixed[data-testid="toast-container"] {
            top: auto !important;
            bottom: 1rem !important;
            right: 1rem !important;
            left: 1rem !important;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}
