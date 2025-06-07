import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RadiologyTest {
  id: string;
  name: string;
}

export function useRadiologyData() {
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRadiologyTests() {
      try {
        console.log('Fetching radiology tests...');
        
        if (!supabase) {
          throw new Error('Supabase client is not initialized. Please check your environment variables.');
        }

        const { data, error: fetchError } = await supabase
          .from('radiology')
          .select('id, name')
          .order('name');

        console.log('Radiology data received:', data);
        console.log('Fetch error if any:', fetchError);

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw new Error(fetchError.message || 'Failed to fetch radiology tests');
        }

        if (!data) {
          console.warn('No radiology data received from Supabase');
          setRadiologyTests([]);
          return;
        }

        setRadiologyTests(data);
      } catch (err) {
        console.error('Error in useRadiologyData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch radiology tests');
        setRadiologyTests([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRadiologyTests();
  }, []);

  return { radiologyTests, loading, error };
} 