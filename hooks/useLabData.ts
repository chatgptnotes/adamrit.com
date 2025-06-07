import { useEffect, useState } from 'react';

export interface LabTest {
  id: string;
  name: string;
}

const mockLabTests: LabTest[] = [
  { id: '1', name: 'Blood Culture' },
  { id: '2', name: 'CBC' },
  { id: '3', name: 'CRP' },
  { id: '4', name: 'ESR' },
  { id: '5', name: 'Procalcitonin' },
  { id: '6', name: 'PT/INR' },
  { id: '7', name: 'APTT' },
  { id: '8', name: 'Blood Glucose' },
  { id: '9', name: 'HbA1c' },
  { id: '10', name: 'Lipid Profile' }
];

export function useLabData() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLabTests(mockLabTests);
      setLoading(false);
    }, 500);
  }, []);

  return { labTests, loading, error };
} 