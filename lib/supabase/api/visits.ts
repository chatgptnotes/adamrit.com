import { supabase } from '../client';
import { withErrorHandler, APIError } from '@/lib/utils/error-handler';

// Types
export interface Visit {
  id: string;
  visit_id: string;
  patient_unique_id: string;
  visit_date: string;
  visit_type: string;
  department: string;
  appointment_with: string;
  doctor_name: string;
  visit_reason: string;
  reason: string;
  referring_doctor: string;
  diagnosis: string[];
  surgery: string[];
  claim_id: string;
  relation_with_employee: string;
  status: string;
  created_at: string;
}

// Get a visit by ID
export async function getVisit(id: string) {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .select('*')
        .eq('id', id)
        .single()
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      if (!data) throw new APIError('Visit not found');
      return data;
    })
  );
}

// Get visits for a patient
export async function getPatientVisits(patientUniqueId: string) {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .select('*')
        .eq('patient_unique_id', patientUniqueId)
        .order('visit_date', { ascending: false })
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      return data || [];
    })
  );
}

// Create a new visit
export async function createVisit(visitData: Omit<Visit, 'id'>) {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .insert([visitData])
        .select()
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      if (!data || data.length === 0) throw new APIError('Failed to create visit');
      return data[0];
    })
  );
}

// Update a visit
export async function updateVisit(id: string, visitData: Partial<Visit>) {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .update(visitData)
        .eq('id', id)
        .select()
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      if (!data || data.length === 0) throw new APIError('Visit not found');
      return data[0];
    })
  );
}

// Delete a visit
export async function deleteVisit(id: string) {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .delete()
        .eq('id', id)
    ).then(({ error }) => {
      if (error) throw new APIError(error.message);
      return true;
    })
  );
}

// Get all visits with patient information
export async function getAllVisits() {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            unique_id,
            name,
            age,
            gender,
            phone
          )
        `)
        .order('visit_date', { ascending: false })
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      return data || [];
    })
  );
} 