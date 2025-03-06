import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from '../config';

export const SupabaseClientSingleton = (function () {
    let supabaseClient: ReturnType<typeof createClient> | undefined;

    return {
        getInstance() {
            if (!supabaseClient) {
                const supabaseUrl = SUPABASE_URL!;
                const supabaseServiceKey = SUPABASE_SERVICE_KEY!;
                supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
            }
            return supabaseClient;
        },
    };
})();
