import { useEffect, useState } from 'react';

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

const mockComplications: Complication[] = [
  {
    id: '1',
    name: 'abscess',
    risk_level: 'Low',
    description: 'Abscess commonly occurs post-surgery or as a complication of diagnosis.',
    foreign_key: 'COMP_1'
  },
  {
    id: '2',
    name: 'adhesions',
    risk_level: 'Moderate',
    description: 'Adhesions commonly occurs post-surgery or as a complication of diagnosis.',
    foreign_key: 'COMP_2'
  },
  {
    id: '3',
    name: 'bleeding',
    risk_level: 'Low',
    description: 'Bleeding commonly occurs post-surgery or as a complication of diagnosis.',
    foreign_key: 'COMP_3'
  },
  {
    id: '4',
    name: 'cramps',
    risk_level: 'High',
    description: 'Cramps commonly occurs post-surgery or as a complication of diagnosis.',
    foreign_key: 'COMP_4'
  }
];

export function useComplications() {
  const [complications, setComplications] = useState<Complication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setComplications(mockComplications);
      setLoading(false);
    }, 500);
  }, []);

  const createComplication = async (complication: Omit<Complication, 'id'>) => {
    // Simulate API call
    const newComplication = {
      ...complication,
      id: Math.random().toString(36).substr(2, 9)
    };
    setComplications(prev => [...prev, newComplication]);
    return newComplication;
  };

  const updateComplication = async (id: string, updates: Partial<Complication>) => {
    // Simulate API call
    setComplications(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
  };

  const deleteComplication = async (id: string) => {
    // Simulate API call
    setComplications(prev => prev.filter(comp => comp.id !== id));
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