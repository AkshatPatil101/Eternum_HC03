import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://jxrwwrwumqkkpduugzcl.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  console.log('Testing insert with patient ID and Name...');
  
  const payload = {
    patient_id: crypto.randomUUID(),
    patient_name: "Test Patient Name",
    age: 45,
    gender: 'male',
    heart_rate: 85,
    systolic_bp: 120,
    diastolic_bp: 80,
    oxygen_saturation: 98,
    respiratory_rate: 16,
    temperature: 36.5,
    symptoms: { test: 1 },
    severity_level: "STABLE",
    requires_icu: false,
    requires_ventilator: false,
    required_specialist: null,
    assigned_hospital_id: 'H01',
    triage_status: 'active'
  };

  const { data, error } = await supabase.from('triage_cases').insert([payload]);

  if(error) {
    console.error('\n[❌ ERROR] Insert failed:');
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log('\n[✅ SUCCESS] Insert succeeded:', data);
  }
})();
