-- 1. Schema Conflict Resolution
-- The objective is to standardize triage_cases to use the hospitals_static table.

-- First, add the text column for the assigned_hospital_id if migrating from UUID
ALTER TABLE public.triage_cases
  ADD COLUMN IF NOT EXISTS new_assigned_hospital_id text;

-- If we have existing data linking to the old `hospitals` table, we would try to map them. 
-- Assuming for this implementation we just drop the old reference and setup the new one correctly.
-- (Uncomment the update if you have a mapping strategy)
-- UPDATE public.triage_cases tc
-- SET new_assigned_hospital_id = hs.id
-- FROM public.hospitals h
-- JOIN public.hospitals_static hs ON hs.name = h.hospital_name
-- WHERE tc.assigned_hospital_id = h.id;

ALTER TABLE public.triage_cases
  DROP COLUMN IF EXISTS assigned_hospital_id;

ALTER TABLE public.triage_cases
  RENAME COLUMN new_assigned_hospital_id TO assigned_hospital_id;

-- Add the foreign key constraint pointing to hospitals_static
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_triage_cases_hospital'
    ) THEN
        ALTER TABLE public.triage_cases
          ADD CONSTRAINT fk_triage_cases_hospital 
          FOREIGN KEY (assigned_hospital_id) 
          REFERENCES public.hospitals_static(id)
          ON DELETE SET NULL;
    END IF;
END $$;

-- Optional: Drop the old hospitals table if absolutely certain it's unused elsewhere
-- DROP TABLE IF EXISTS public.hospitals;

-------------------------------------------------------------------------
-- 2. Find Best Hospital RPC Function
-------------------------------------------------------------------------

-- Drop if exists to ensure we can recreate it
DROP FUNCTION IF EXISTS public.find_best_hospital;

CREATE OR REPLACE FUNCTION public.find_best_hospital(
    patient_lat float8,
    patient_lng float8,
    required_specialty text DEFAULT NULL,
    required_equipment text[] DEFAULT '{}',
    need_icu boolean DEFAULT false,
    max_results int DEFAULT 5
)
RETURNS TABLE (
    hospital_id text,
    name text,
    area text,
    level smallint,
    distance_km float8,
    icu_beds_free smallint,
    general_beds_free smallint,
    load_level text,
    avg_wait_min smallint,
    score float8
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH potential_hospitals AS (
        SELECT 
            hs.id as hospital_id,
            hs.name,
            hs.area,
            hs.level,
            hs.lat,
            hs.lng,
            hd.icu_beds_free,
            hd.general_beds_free,
            hd.load_level,
            hd.avg_wait_min,
            -- Calculate distance using Haversine formula (returns km)
            -- 6371 is the radius of the Earth in km
            ( 6371 * acos(
                least(1.0, greatest(-1.0,
                    cos(radians(patient_lat)) * cos(radians(hs.lat)) *
                    cos(radians(hs.lng) - radians(patient_lng)) +
                    sin(radians(patient_lat)) * sin(radians(hs.lat))
                ))
            )) AS distance_km
        FROM public.hospitals_static hs
        LEFT JOIN public.hospitals_dynamic hd ON hd.hospital_id = hs.id
        WHERE 
            -- Load level shouldn't be divert unless it's the only option
            hd.load_level != 'divert'
            
            -- Filter by required specialty
            AND (required_specialty IS NULL OR EXISTS (
                SELECT 1 FROM public.hospital_specialties sp 
                WHERE sp.hospital_id = hs.id AND sp.specialty ILIKE required_specialty
            ))
            
            -- Filter by ICU requirement
            AND (need_icu = false OR hd.icu_beds_free > 0)
            
            -- Filter by required equipment (must have available equipment, not just inventory)
            AND (array_length(required_equipment, 1) IS NULL OR (
                SELECT count(*) 
                FROM public.equipment_availability ea
                WHERE ea.hospital_id = hs.id 
                  AND ea.equipment = ANY(required_equipment)
                  AND ea.available > 0
            ) = array_length(required_equipment, 1))
    )
    SELECT 
        ph.hospital_id,
        ph.name,
        ph.area,
        ph.level,
        ph.distance_km,
        ph.icu_beds_free,
        ph.general_beds_free,
        ph.load_level,
        ph.avg_wait_min,
        -- Calculate Composite Score (Higher is better)
        (
            -- Base priority based on hospital level (Super specialty gets minimal bump if it matches needs)
            (4 - ph.level) * 5.0 +
            
            -- Distance factor: closer gets drastically higher score (e.g. 50 points max for 0km)
            GREATEST(0, 50 - (ph.distance_km * 2)) +
            
            -- Bed availability score
            LEAST(20, ph.general_beds_free) +
            LEAST(20, ph.icu_beds_free * 2) - 
            
            -- Penalize based on average wait time (wait time > score penalty)
            (ph.avg_wait_min * 0.5) -
            
            -- Penalize based on load level
            CASE 
                WHEN ph.load_level = 'critical' THEN 30
                WHEN ph.load_level = 'busy' THEN 10
                ELSE 0
            END
        ) AS score
    FROM potential_hospitals ph
    ORDER BY score DESC
    LIMIT max_results;
END;
$$;
