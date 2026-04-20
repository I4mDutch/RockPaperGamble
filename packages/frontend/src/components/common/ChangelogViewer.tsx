import { useState, useEffect } from 'react'
import { X, FileText, Clock, Tag } from 'lucide-react'

interface ChangelogViewerProps {
  isOpen: boolean
  onClose: () => void
}

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const ChangelogViewer = ({ isOpen, onClose }: ChangelogViewerProps) => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadChangelog()
    }
  }, [isOpen])

  const loadChangelog = async () => {
    setLoading(true)
    try {
      // In development, fetch from the public folder
      const response = await fetch('/changelog.md')
      const text = response.ok ? await response.text() : getDefaultChangelog()
      const parsed = parseChangelog(text)
      setEntries(parsed)
    } catch {
      setEntries(parseChangelog(getDefaultChangelog()))
    } finally {
      setLoading(false)
    }
  }

  const parseChangelog = (text: string): ChangelogEntry[] => {
    const entries: ChangelogEntry[] = []
    const lines = text.split('\n')
    let currentEntry: ChangelogEntry | null = null

    for (const line of lines) {
      const versionMatch = line.match(/^##?\s*(\d+\.\d+\.\d+)\s*-?\s*(.+)?$/i)
      if (versionMatch) {
        if (currentEntry) {
          entries.push(currentEntry)
        }
        currentEntry = {
          version: versionMatch[1],
          date: versionMatch[2] || 'Unknown',
          changes: []
        }
      } else if (line.trim().startsWith('-') && currentEntry) {
        currentEntry.changes.push(line.trim().substring(1).trim())
      } else if (line.trim().startsWith('•') && currentEntry) {
        currentEntry.changes.push(line.trim().substring(1).trim())
      } else if (line.trim() && currentEntry && !line.startsWith('#')) {
        currentEntry.changes.push(line.trim())
      }
    }

    if (currentEntry) {
      entries.push(currentEntry)
    }

    return entries
  }

  const getDefaultChangelog = (): string => {
    return `# Changelog

## 2.2.0 - April 2026

### Animations & UX
- New launch animation with background fade and logo scaling
- Modern UI refresh with improved spacing and rounded cards
- Softer shadows and cleaner color palette
- Separate sign-in and lobby pages
- Enhanced lobby with player avatars and ready indicators

### Game Settings System
- Configurable starting money ($100 - $1,000,000)
- Balance modifiers for extreme values
- High-stakes mode visual indicators

### Mobile Optimization
- Responsive breakpoints for all devices
- Fixed UI overflow issues
- Touch-friendly buttons (48px minimum)
- Gift button tap toggle (replaces hover)

### Player Order System
- Visual turn queue display
- Next player indicator
- Host drag-to-reorder controls

### Changelog System
- Quick changelog in info menu
- Full changelog viewer modal

### Additional Features
- Player statistics tracking
- Round history panel (last 10 rounds)
- Game event feed
- Player ready system
- Improved error handling with toast notifications
- Game countdown before start
- Button press animations
- Coin win animations
- Performance improvements

## 2.1.1 - March 2026

- Changed "BET ON MYSELF" to "WAGER"
- Best-of-5 series matches
- Prize pool betting for all players
- Gift coins to other players
- $0 players are eliminated
- Discord sign-in & profile customization

## 2.1.0 - February 2026

- Initial release with basic RPS gameplay
- Lobby system with host controls
- Discord authentication
- Guest play support`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-800 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <FileText className="text-brand-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Changelog</h2>
              <p className="text-xs text-slate-500">Version history & updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No changelog entries found.</p>
          ) : (
            entries.map((entry, index) => (
              <div 
                key={entry.version}
                className={`${index !== 0 ? 'border-t border-white/5 pt-6' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-brand-primary" />
                    <span className="text-lg font-black text-white">v{entry.version}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={12} />
                    <span className="text-xs">{entry.date}</span>
                  </div>
                  
                  {index === 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                
                <ul className="space-y-2">
                  {entry.changes.map((change, changeIndex) => (
                    <li 
                      key={changeIndex}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="text-brand-primary mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}