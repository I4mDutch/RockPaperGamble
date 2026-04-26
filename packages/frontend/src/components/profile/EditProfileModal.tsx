import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Check, ShieldCheck, LogOut, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const AVATAR_LIBRARY = ['🥷', '🐲', '🦾', '🔥', '🎲', '🎭', '🍀', '💎', '🚀', '🃏']

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, guestUser, updateProfile, guestLogout } = useAuthStore()
  const currentDisplayName = user?.user_metadata.full_name || guestUser?.displayName || ''
  const currentAvatar = user?.user_metadata.avatar_url || (guestUser as any)?.avatarUrl || '🎲'
  
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)
  const [isSaving, setIsSaving] = useState(false)

  const discordUsername = user?.user_metadata?.custom_claims?.global_name || user?.user_metadata?.name

  const handleSave = async () => {
    setIsSaving(true)
    await updateProfile({ displayName, avatarUrl: selectedAvatar })
    const { socket } = useGameStore.getState()
    socket?.send(JSON.stringify({ type: 'UPDATE_PROFILE', displayName, avatarUrl: selectedAvatar }))
    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.2)]"
            style={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start border-b border-gray-100">
              <div>
                <h2 className="heading-display text-3xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Player Profile</h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 text-gray-400">Customize your lobby identity</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Account Status */}
              {user ? (
                <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(88,101,242,0.1) 0%, rgba(88,101,242,0.05) 100%)', border: '1px solid rgba(88,101,242,0.2)' }}>
                  <div className="absolute -right-4 -top-4 opacity-5">
                    <ShieldCheck size={100} />
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#5865F2' }}>
                        <ShieldCheck className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Authenticated</div>
                        <div className="font-bold text-base text-gray-900 truncate max-w-[150px]">
                          Discord: <span className="text-indigo-600">{discordUsername || 'Verified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => { const { disconnect } = useGameStore.getState(); disconnect(); await useAuthStore.getState().signOut(); onClose(); }}
                    className="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : guestUser ? (
                <div className="rounded-2xl p-5 flex flex-col gap-4 bg-gray-50 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-200 text-gray-500 shadow-sm">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Temporary Session</div>
                        <div className="font-bold text-base text-gray-900">Guest Account</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { const { disconnect } = useGameStore.getState(); disconnect(); guestLogout(); onClose(); }}
                    className="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    style={{ background: '#5865F2', boxShadow: '0 8px 16px rgba(88,101,242,0.2)' }}
                  >
                    <ShieldCheck size={14} /> Upgrade to Discord
                  </button>
                </div>
              ) : null}

              {/* Display Name Input */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-1 text-gray-500">
                  <User size={14} /> Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full rounded-2xl py-4 px-5 font-bold text-base text-gray-900 placeholder-gray-400 transition-all focus:outline-none"
                  style={{ 
                    background: 'white', 
                    border: '2px solid rgba(0,0,0,0.05)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                />
              </div>

              {/* Avatar Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-1 text-gray-500">
                  <ImageIcon size={14} /> Choose Avatar
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {user?.user_metadata?.avatar_url && (
                    <button
                      onClick={() => setSelectedAvatar(user.user_metadata.avatar_url)}
                      className="relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 group"
                      style={{ 
                        border: selectedAvatar === user.user_metadata.avatar_url ? '3px solid #7C3AED' : '2px solid transparent',
                        boxShadow: selectedAvatar === user.user_metadata.avatar_url ? '0 0 20px rgba(124,58,237,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                        transform: selectedAvatar === user.user_metadata.avatar_url ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <img src={user.user_metadata.avatar_url} alt="Discord Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      {selectedAvatar === user.user_metadata.avatar_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-violet-600/20 backdrop-blur-[2px]">
                          <Check className="text-white drop-shadow-md" size={24} />
                        </div>
                      )}
                    </button>
                  )}
                  {AVATAR_LIBRARY.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                      style={{
                        background: selectedAvatar === emoji ? 'rgba(124,58,237,0.1)' : 'white',
                        border: selectedAvatar === emoji ? '3px solid #7C3AED' : '2px solid transparent',
                        boxShadow: selectedAvatar === emoji ? '0 0 20px rgba(124,58,237,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
                        transform: selectedAvatar === emoji ? 'scale(1.05)' : 'none',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSave} 
                disabled={isSaving || !displayName.trim()} 
                className="w-full py-4 text-base font-bold text-white rounded-2xl shadow-[0_10px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_30px_rgba(124,58,237,0.4)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
              >
                {isSaving ? 'Updating Identity...' : 'Save Profile Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
