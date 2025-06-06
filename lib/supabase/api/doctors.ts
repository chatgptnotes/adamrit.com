import { supabase } from '../client';
import { withErrorHandler, APIError } from '@/lib/utils/error-handler';

// Types
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  is_surgeon: boolean;
  department: string;
  phone?: string;
  email?: string;
  created_at: string;
}

// Get all surgeons
export async function getSurgeons() {
  return withErrorHandler(
    Promise.resolve(
      supabase
        .from('doctors')
        .select('*')
        .eq('is_surgeon', true)
        .order('name')
    ).then(({ data, error }) => {
      if (error) throw new APIError(error.message);
      return data || [];
    })
  );
} 