import { supabase } from '@/lib/supabase';

type UserFollowColumn = 'following_id' | 'target_id';

const USER_FOLLOW_COLUMNS: UserFollowColumn[] = ['following_id', 'target_id'];

async function queryUserFollowColumn(followerId: string, targetUserId: string, column: UserFollowColumn) {
  return supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq(column, targetUserId)
    .eq('target_type', 'user')
    .maybeSingle();
}

async function findUserFollowColumn(followerId: string, targetUserId: string): Promise<UserFollowColumn | null> {
  for (const column of USER_FOLLOW_COLUMNS) {
    const { data, error } = await queryUserFollowColumn(followerId, targetUserId, column);
    if (error) continue;
    if (data) return column;
  }

  return null;
}

export async function getUserFollowState(followerId: string, targetUserId: string): Promise<boolean> {
  return (await findUserFollowColumn(followerId, targetUserId)) !== null;
}

export async function setUserFollowState(followerId: string, targetUserId: string, shouldFollow: boolean): Promise<void> {
  if (shouldFollow) {
    let lastError: unknown = null;

    for (const column of USER_FOLLOW_COLUMNS) {
      try {
        const { error } = await supabase.from('follows').insert({
          follower_id: followerId,
          [column]: targetUserId,
          target_type: 'user',
        } as Record<string, string>);

        if (error) throw error;
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to follow user');
  }

  const existingColumn = await findUserFollowColumn(followerId, targetUserId);
  if (!existingColumn) return;

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq(existingColumn, targetUserId)
    .eq('target_type', 'user');

  if (error) throw error;
}

export async function getUserFollowedIds(followerId: string): Promise<string[]> {
  const followingIds = new Set<string>();

  for (const column of USER_FOLLOW_COLUMNS) {
    const { data, error } = await supabase
      .from('follows')
      .select(column)
      .eq('follower_id', followerId)
      .eq('target_type', 'user');

    if (error) continue;

    for (const row of data ?? []) {
      const value = (row as Record<string, unknown>)[column];
      if (typeof value === 'string' && value) {
        followingIds.add(value);
      }
    }
  }

  return Array.from(followingIds);
}

export async function getUserFollowerCount(targetUserId: string): Promise<number> {
  let total = 0;

  for (const column of USER_FOLLOW_COLUMNS) {
    const { count, error } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq(column, targetUserId)
      .eq('target_type', 'user');

    if (error) continue;
    total += count ?? 0;
  }

  return total;
}