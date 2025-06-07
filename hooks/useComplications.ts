import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Complication {
  id: string;
  name: string;
  risk_level: 'Low' | 'Moderate' | 'High';
  description: string;
  foreign_key: string;
  lab1_id?: string;
  lab2_id?: string;
  rad1_id?: string;
  rad2_id?: string;
  med1_id?: string;
  med2_id?: string;
  med3_id?: string;
  med4_id?: string;
}

export function useComplications() {
  const [complications, setComplications] = useState<Complication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComplications() {
      try {
        const { data, error } = await supabase
          .from('complication')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        setComplications(data || []);
      } catch (err) {
        console.error('Error fetching complications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch complications');
      } finally {
        setLoading(false);
      }
    }

    fetchComplications();
  }, []);

  const createComplication = async (complication: Omit<Complication, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('complication')
        .insert([complication])
        .select()
        .single();

      if (error) throw error;

      setComplications(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating complication:', err);
      throw err;
    }
  };

  const updateComplication = async (id: string, updates: Partial<Complication>) => {
    try {
      const { data, error } = await supabase
        .from('complication')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setComplications(prev =>
        prev.map(comp => (comp.id === id ? { ...comp, ...data } : comp))
      );
      return data;
    } catch (err) {
      console.error('Error updating complication:', err);
      throw err;
    }
  };

  const deleteComplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('complication')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComplications(prev => prev.filter(comp => comp.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting complication:', err);
      throw err;
    }
  };

  return {
    complications,
    loading,
    error,
    createComplication,
    updateComplication,
    deleteComplication,
    setComplications
  };
} 