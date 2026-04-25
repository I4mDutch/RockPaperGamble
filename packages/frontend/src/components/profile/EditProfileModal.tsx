import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Check, ShieldCheck, LogOut } from 'lucide-react'
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
    await updateProfile({
      displayName,
      avatarUrl: selectedAvatar
    })
    
    // Notify server of the change
    const { socket } = useGameStore.getState()
    socket?.send(JSON.stringify({
      type: 'UPDATE_PROFILE',
      displayName,
      avatarUrl: selectedAvatar
    }))

    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter text-white">EDIT PROFILE</h2>
                <p className="text-slate-400 text-sm mt-1">Customize your appearance in the lobby.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Account Status */}
              {user ? (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                      <ShieldCheck className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Connected Account</div>
                      <div className="text-white font-bold text-sm truncate max-w-[150px]">DISCORD: <span className="text-indigo-300">{discordUsername || 'Verified'}</span></div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const { disconnect } = useGameStore.getState();
                      disconnect();
                      await useAuthStore.getState().signOut();
                      onClose();
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              ) : guestUser ? (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                      <User className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporary Session</div>
                      <div className="text-white font-bold uppercase tracking-tight text-sm">Guest Account</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const { disconnect } = useGameStore.getState();
                      disconnect();
                      guestLogout();
                      onClose();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <LogOut size={12} />
                    Switch to Discord
                  </button>
                </div>
              ) : null}

              {/* Avatar Selection */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Choose Avatar</label>
                <div className="grid grid-cols-5 gap-3">
                  {/* Discord Avatar Option */}
                  {user?.user_metadata?.avatar_url && (
                    <button
                      onClick={() => setSelectedAvatar(user.user_metadata.avatar_url)}
                      className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedAvatar === user.user_metadata.avatar_url ? 'border-brand-primary scale-95 shadow-lg shadow-brand-primary/20' : 'border-transparent hover:border-white/10'
                      }`}
                    >
                      <img src={user.user_metadata.avatar_url} alt="Discord" className="w-full h-full object-cover" />
                      {selectedAvatar === user.user_metadata.avatar_url && (
                        <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                          <Check className="text-white" size={20} />
                        </div>
                      )}
                    </button>
                  )}
                  
                  {AVATAR_LIBRARY.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`w-full aspect-square rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border-2 transition-all ${
                        selectedAvatar === emoji ? 'border-brand-primary scale-95 bg-slate-700 shadow-lg shadow-brand-primary/20' : 'border-transparent hover:border-white/5 hover:bg-slate-750'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-slate-800 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleSave}
                disabled={isSaving || !displayName.trim()}
                className="w-full py-4 bg-brand-primary hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2 group"
              >
                {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
