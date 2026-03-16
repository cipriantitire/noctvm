import { supabase } from './supabase';

export type ActivityType = 
  | 'event_add' 
  | 'event_edit' 
  | 'event_delete'
  | 'scrape_run' 
  | 'user_signup' 
  | 'user_edit'
  | 'user_delete'
  | 'venue_claim' 
  | 'owner_claim'
  | 'user_verify'
  | 'user_unverify'
  | 'venue_add'
  | 'venue_edit'
  | 'venue_delete';

interface LogData {
  type: ActivityType;
  message: string;
  entity_id?: string;
  entity_name?: string;
  user_id?: string;
  user_name?: string;
}

export async function logActivity(data: LogData) {
  try {
    await supabase.from('dashboard_activity').insert({
      type: data.type,
      message: data.message,
      entity_id: data.entity_id,
      entity_name: data.entity_name,
      user_id: data.user_id,
      user_name: data.user_name,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
