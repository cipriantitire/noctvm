'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, UserSettings } from '@/lib/supabase';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSettings(null);
        return;
      }

      // Fetch user settings
      let { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Create default settings if they don't exist
        const defaultSettings = {
          user_id: user.id,
          is_profile_private: false,
          likes_visibility: 'public',
          comment_restrictions: 'everyone',
          tag_restrictions: 'everyone',
          show_moonray_level: true,
          camera_access: false,
          contacts_access: false,
          location_access: false,
          notif_access: false,
          files_access: false,
          notify_likes: true,
          notify_comments: true,
          notify_followers: true,
          notify_events: true,
          theme: 'dark'
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      }

      setSettings(data as UserSettings);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setSettings(data as UserSettings);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating settings:', err);
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: fetchSettings
  };
}
