import { supabase } from '@/lib/supabase';

export async function getUserFollowState(followerId: string, targetUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('target_id', targetUserId)
    .eq('target_type', 'user')
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function setUserFollowState(followerId: string, targetUserId: string, shouldFollow: boolean): Promise<void> {
  if (shouldFollow) {
    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      target_id: targetUserId,
      target_type: 'user',
    });

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('target_id', targetUserId)
    .eq('target_type', 'user');

  if (error) throw error;
}

export async function getUserFollowedIds(followerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('target_id')
    .eq('follower_id', followerId)
    .eq('target_type', 'user');

  if (error) return [];

  return Array.from(new Set((data ?? []).map(row => row.target_id).filter((value): value is string => typeof value === 'string' && value.length > 0)));
}

export async function getUserFollowerCount(targetUserId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('target_id', targetUserId)
    .eq('target_type', 'user');

  if (error) return 0;
  return count ?? 0;
}