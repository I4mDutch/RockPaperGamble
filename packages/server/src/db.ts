import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getPlayerStats(userId: string): Promise<{ coins: number; winStreak: number; avatarUrl?: string }> {
  if (!supabase) return { coins: 1000, winStreak: 0 };

  const { data, error } = await supabase
    .from('profiles')
    .select('coins, win_streak, avatar_url')
    .eq('id', userId)
    .single();

  if (error || !data) {
    try {
      const defaultStats = { id: userId, coins: 1000, win_streak: 0 };
      await supabase.from('profiles').upsert(defaultStats);
    } catch (e) {
      console.error("Failed to upsert default stats:", e);
    }
    return { coins: 1000, winStreak: 0 };
  }

  return { 
    coins: data.coins, 
    winStreak: data.win_streak || 0,
    avatarUrl: data.avatar_url 
  };
}

export async function updatePlayerProfile(userId: string, stats: { coins?: number; winStreak?: number; avatarUrl?: string }) {
  if (!supabase) return;

  const updateData: any = {};
  if (stats.coins !== undefined) updateData.coins = stats.coins;
  if (stats.winStreak !== undefined) updateData.win_streak = stats.winStreak;
  if (stats.avatarUrl !== undefined) updateData.avatar_url = stats.avatarUrl;

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);
}

export async function saveDuelResult(duelId: string, winnerId: string, payouts: any) {
  if (!supabase) return;

  await supabase
    .from('duel_history')
    .insert({
      id: duelId,
      winner_id: winnerId,
      payouts: payouts,
      created_at: new Date().toISOString()
    });
}
