import { Avatar } from '../common/Avatar'

export interface PlayerStatsData {
  wins: number
  losses: number
  totalWon: number
  totalLost: number
}

export interface PlayerStatsProps {
  playerName: string
  avatarUrl?: string
  stats: PlayerStatsData
}

export const PlayerStats = ({ playerName, avatarUrl, stats }: PlayerStatsProps) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
      {/* Header with Avatar and Name */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar url={avatarUrl} name={playerName} size="md" />
        <h3 className="text-sm font-bold text-white truncate">{playerName}</h3>
      </div>

      {/* Stats Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wins */}
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
            Wins
          </p>
          <p className="text-xl font-black text-white">{stats.wins}</p>
        </div>

        {/* Losses */}
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
            Losses
          </p>
          <p className="text-xl font-black text-white">{stats.losses}</p>
        </div>

        {/* Total Won */}
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
            Total Won
          </p>
          <p className="text-xl font-black text-emerald-400">
            +{stats.totalWon.toLocaleString()}
          </p>
        </div>

        {/* Total Lost */}
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
            Total Lost
          </p>
          <p className="text-xl font-black text-rose-400">
            -{stats.totalLost.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
