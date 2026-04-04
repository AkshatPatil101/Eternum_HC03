-- 1. Drop the existing restrictive check constraint on severity_level
ALTER TABLE triage_cases 
DROP CONSTRAINT IF EXISTS triage_cases_severity_level_check;

-- 2. Add the new flexible check constraint to allow the new ML service severity levels
ALTER TABLE triage_cases 
ADD CONSTRAINT triage_cases_severity_level_check 
CHECK (severity_level IN ('critical', 'moderate', 'stable', 'high', 'medium', 'low', 'urgent', 'non-urgent'));

-- 3. (Optional but recommended) Add the trauma vision columns back so we can track AI image analysis
ALTER TABLE triage_cases 
ADD COLUMN IF NOT EXISTS trauma_scene_severity text,
ADD COLUMN IF NOT EXISTS trauma_scene_confidence numeric;
