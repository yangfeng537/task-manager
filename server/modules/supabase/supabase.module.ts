import { Module, Global } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dgsmeogzmwhyqzzzzrqy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_YCq30tNoVWxTc65_z_EHug_FBoYtJly';

const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: () => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  },
};

@Global()
@Module({
  providers: [supabaseProvider],
  exports: [supabaseProvider],
})
export class SupabaseModule {}
