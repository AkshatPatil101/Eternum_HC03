import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jxrwwrwumqkkpduugzcl.supabase.co', 'YOUR_SUPABASE_ANON_KEY');
(async () => {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase.from('hospitals_static').select('id').limit(1);
  if(error) {
    console.error('\n[❌ ERROR] Could not fetch data: ', error.message);
  } else {
    console.log('\n[✅ SUCCESS] Connection valid! Fetched data: ', data);
  }
})();
