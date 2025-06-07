import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LabTest {
  id: string;
  name: string;
}

export function useLabData() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLabTests() {
      try {
        // Check if Supabase is properly initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized. Please check your environment variables.');
        }

        const { data, error: fetchError } = await supabase
          .from('lab')
          .select('id, name')
          .order('name');

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw new Error(fetchError.message || 'Failed to fetch lab tests');
        }

        if (!data) {
          console.warn('No lab data received from Supabase');
          setLabTests([]);
          return;
        }

        setLabTests(data);
      } catch (err) {
        console.error('Error in useLabData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch lab tests');
        // Set empty array to prevent undefined errors in the UI
        setLabTests([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLabTests();
  }, []);

  return { labTests, loading, error };
} 