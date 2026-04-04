import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';

/**
 * Hook to subscribe to hospital_dynamic updates (beds, load level, wait time)
 */
export function useHospitalsDynamic(initialHospitals = []) {
  const [hospitals, setHospitals] = useState(initialHospitals);

  useEffect(() => {
    if (initialHospitals && initialHospitals.length > 0) {
      setHospitals(initialHospitals);
    } else if (supabase) {
      supabase.from('hospitals_dynamic').select('*').then(({ data }) => {
        if (data) setHospitals(data);
      });
    }
  }, [initialHospitals]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('hospitals-dynamic')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hospitals_dynamic' },
        (payload) => {
          setHospitals((currentHospitals) => 
            currentHospitals.map((hospital) => {
              // Note: Make sure your state includes hospital.id and matches hospital_id
              if (hospital.id === payload.new.hospital_id || hospital.hospital_id === payload.new.hospital_id) {
                return { ...hospital, ...payload.new };
              }
              return hospital;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return hospitals;
}

/**
 * Hook to subscribe to equipment availability changes
 */
export function useEquipmentAvailability(initialEquipment = []) {
  const [equipmentList, setEquipmentList] = useState(initialEquipment);

  useEffect(() => {
    if (initialEquipment && initialEquipment.length > 0) {
      setEquipmentList(initialEquipment);
    } else if (supabase) {
      supabase.from('equipment_availability').select('*').then(({ data }) => {
        if (data) setEquipmentList(data);
      });
    }
  }, [initialEquipment]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('equipment-availability')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'equipment_availability' },
        (payload) => {
          setEquipmentList((currentList) =>
            currentList.map((item) => {
              if (item.hospital_id === payload.new.hospital_id && item.equipment === payload.new.equipment) {
                return { ...item, ...payload.new };
              }
              return item;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return equipmentList;
}

/**
 * Hook to subscribe to specialist availability updates
 */
export function useSpecialistAvailability(initialSpecialists = []) {
  const [specialists, setSpecialists] = useState(initialSpecialists);

  useEffect(() => {
    if (initialSpecialists && initialSpecialists.length > 0) {
      setSpecialists(initialSpecialists);
    } else if (supabase) {
      supabase.from('specialist_availability').select('*').then(({ data }) => {
        if (data) setSpecialists(data);
      });
    }
  }, [initialSpecialists]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('specialist-availability')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'specialist_availability' },
        (payload) => {
          setSpecialists((currentSpecialists) =>
            currentSpecialists.map((specialist) => {
              // Matching by specialist_id since you noted it's the PK
              if (specialist.id === payload.new.specialist_id || specialist.specialist_id === payload.new.specialist_id) {
                return { ...specialist, ...payload.new };
              }
              return specialist;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return specialists;
}
