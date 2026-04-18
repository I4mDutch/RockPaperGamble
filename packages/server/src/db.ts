import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getPlayerCoins(userId: string): Promise<number> {
  if (!supabase) return 1000; // Default starting coins

  const { data, error } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // If player doesn't exist, create them
    await supabase.from('profiles').insert({ id: userId, coins: 1000 });
    return 1000;
  }

  return data.coins;
}

export async function updatePlayerCoins(userId: string, coins: number) {
  if (!supabase) return;

  await supabase
    .from('profiles')
    .update({ coins })
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
