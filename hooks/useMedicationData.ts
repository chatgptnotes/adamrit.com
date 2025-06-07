'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Medication {
  id: string;
  name: string;
  code?: string;
  dosage?: string;
  route?: string;
}

export function useMedicationData(searchQuery: string = '') {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMedications() {
      try {
        console.log('Fetching medications...', { searchQuery });
        
        if (!supabase) {
          throw new Error('Supabase client is not initialized. Please check your environment variables.');
        }

        let query = supabase
          .from('medications')
          .select('*')  // First, let's see what columns we actually have
          .order('name');

        // Apply search filter if searchQuery exists
        if (searchQuery.trim()) {
          query = query.ilike('name', `%${searchQuery}%`);  // For now, just search by name
        }

        const { data, error: fetchError } = await query;

        console.log('Raw medications data:', data); // Let's see what the data looks like

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw new Error(fetchError.message || 'Failed to fetch medications');
        }

        if (!data) {
          console.warn('No medications data received from Supabase');
          setMedications([]);
          return;
        }

        // Transform the data to match our interface
        const transformedData = data.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code || undefined,
          dosage: item.dosage || undefined,
          route: item.route || undefined
        }));

        setMedications(transformedData);
      } catch (err) {
        console.error('Error in useMedicationData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch medications');
        setMedications([]);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchMedications();
  }, [searchQuery]);

  return { medications, loading, error };
} 