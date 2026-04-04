import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxrwwrwumqkkpduugzcl.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  console.log('Attempting dummy insert into triage_cases...');
  const { data, error } = await supabase.from('triage_cases').insert([{
    age: 30,
    gender: 'Male',
    heart_rate: 80,
    systolic_bp: 120,
    diastolic_bp: 80,
    oxygen_saturation: 98,
    respiratory_rate: 16,
    temperature: 36.5,
    symptoms: { "test": 1 },
    severity_level: "STABLE",
    requires_icu: false,
    requires_ventilator: false,
    required_specialist: null,
    assigned_hospital_id: 'H01',
    triage_status: 'active'
  }]);

  if(error) {
    console.error('\n[❌ ERROR] Insert failed:', error);
  } else {
    console.log('\n[✅ SUCCESS] Insert succeeded:', data);
  }
})();
