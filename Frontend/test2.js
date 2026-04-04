import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://jxrwwrwumqkkpduugzcl.supabase.co', 'YOUR_SUPABASE_ANON_KEY'); 

async function test() { 
  const result = { severity: { tier: 'URGENT' }, care_plan: { equipment_needed: ['ICU'] } }; 
  const payload = { 
    patient_id: '550e8400-e29b-41d4-a716-446655440000', 
    patient_name: 'Test', 
    age: 30, 
    gender: 'male', 
    heart_rate: 80, 
    systolic_bp: 120, 
    diastolic_bp: 80, 
    oxygen_saturation: 98, 
    respiratory_rate: 16, 
    temperature: 36.5, 
    symptoms: { 'test': 1 }, 
    severity_level: (Object.prototype.toString.call(result.severity) === '[object Object]' ? result.severity.tier : (result.severity || 'critical')).toLowerCase().replace('urgent', 'moderate'), 
    requires_icu: result.care_plan?.equipment_needed?.includes('ICU') || false, 
    requires_ventilator: result.care_plan?.equipment_needed?.includes('ventilator') || false, 
    required_specialist: result.care_plan?.specialists_needed?.[0] || null, 
    assigned_hospital_id: 'H01', 
    triage_status: 'active' 
  }; 
  const { data, error } = await supabase.from('triage_cases').insert([payload]); 
  
  if (error) {
    console.log(JSON.stringify(error, null, 2)); 
  } else {
    console.log('SUCCESS'); 
  }
} 
test();
