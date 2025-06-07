import { useEffect, useState } from 'react';

export interface Medication {
  id: string;
  name: string;
}

const mockMedications: Medication[] = [
  { id: '1', name: 'Amoxicillin 500mg' },
  { id: '2', name: 'Paracetamol 650mg' },
  { id: '3', name: 'Ibuprofen 400mg' },
  { id: '4', name: 'Omeprazole 20mg' },
  { id: '5', name: 'Metformin 500mg' },
  { id: '6', name: 'Amlodipine 5mg' },
  { id: '7', name: 'Aspirin 75mg' },
  { id: '8', name: 'Atorvastatin 10mg' },
  { id: '9', name: 'Losartan 50mg' },
  { id: '10', name: 'Metoprolol 25mg' }
];

export function useMedicationData() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMedications(mockMedications);
      setLoading(false);
    }, 500);
  }, []);

  return { medications, loading, error };
} 