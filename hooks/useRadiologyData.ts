import { useEffect, useState } from 'react';

export interface RadiologyTest {
  id: string;
  name: string;
}

const mockRadiologyTests: RadiologyTest[] = [
  { id: '1', name: 'X-Ray Chest' },
  { id: '2', name: 'CT Scan' },
  { id: '3', name: 'MRI Brain' },
  { id: '4', name: 'Ultrasound' },
  { id: '5', name: 'PET Scan' },
  { id: '6', name: 'Mammogram' },
  { id: '7', name: 'Bone Scan' },
  { id: '8', name: 'Angiogram' },
  { id: '9', name: 'DEXA Scan' },
  { id: '10', name: 'Nuclear Medicine Scan' }
];

export function useRadiologyData() {
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRadiologyTests(mockRadiologyTests);
      setLoading(false);
    }, 500);
  }, []);

  return { radiologyTests, loading, error };
} 