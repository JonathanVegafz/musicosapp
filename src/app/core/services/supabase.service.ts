import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // Fall back to a syntactically valid placeholder so missing config (e.g. a
  // build/prerender without secrets) doesn't crash app bootstrap. Data requests
  // then fail gracefully and surface through each service's `error` signal.
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl || 'https://placeholder.supabase.co',
    environment.supabaseKey || 'placeholder-anon-key',
  );
}
