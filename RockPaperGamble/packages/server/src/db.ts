import { createClient } from '@supabase/supabase-js';

export function getSupabase(env: any) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function getPlayerStats(userId: string, env: any, initialData?: { displayName?: string, avatarUrl?: string }): Promise<{ coins: number; winStreak: number; avatarUrl?: string }> {
  const supabase = getSupabase(env);
  if (!supabase) return { coins: 1000, winStreak: 0 };

  const { data, error } = await supabase
    .from('profiles')
    .select('coins, win_streak, avatar_url, display_name')
    .eq('id', userId)
    .single();

  if (error || !data) {
    try {
      const defaultStats = { 
        id: userId, 
        coins: 1000, 
        win_streak: 0,
        display_name: initialData?.displayName,
        avatar_url: initialData?.avatarUrl
      };
      await supabase.from('profiles').upsert(defaultStats);
    } catch (e) {
      console.error("Failed to upsert default stats:", e);
    }
    return { coins: 1000, winStreak: 0, avatarUrl: initialData?.avatarUrl };
  }

  return { 
    coins: data.coins, 
    winStreak: data.win_streak || 0,
    avatarUrl: data.avatar_url || initialData?.avatarUrl 
  };
}

export async function updatePlayerProfile(userId: string, env: any, stats: { coins?: number; winStreak?: number; avatarUrl?: string; displayName?: string }) {
  const supabase = getSupabase(env);
  if (!supabase) return;

  const updateData: any = {};
  if (stats.coins !== undefined) updateData.coins = stats.coins;
  if (stats.winStreak !== undefined) updateData.win_streak = stats.winStreak;
  if (stats.avatarUrl !== undefined) updateData.avatar_url = stats.avatarUrl;
  if (stats.displayName !== undefined) updateData.display_name = stats.displayName;

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);
}
