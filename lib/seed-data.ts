import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function seedData() {
  // Seed lab tests
  const labTests = [
    { name: 'Blood Culture' },
    { name: 'Complete Blood Count' },
    { name: 'Liver Function Test' },
    { name: 'Kidney Function Test' },
    { name: 'Urine Analysis' },
  ];

  // Seed radiology tests
  const radiologyTests = [
    { name: 'X-Ray Chest' },
    { name: 'CT Scan Brain' },
    { name: 'MRI Spine' },
    { name: 'Ultrasound Abdomen' },
    { name: 'PET Scan' },
  ];

  // Seed medications
  const medications = [
    { name: 'Amoxicillin', dosage: '500mg', route: 'Oral' },
    { name: 'Ibuprofen', dosage: '400mg', route: 'Oral' },
    { name: 'Morphine', dosage: '10mg', route: 'IV' },
    { name: 'Omeprazole', dosage: '20mg', route: 'Oral' },
    { name: 'Metformin', dosage: '1000mg', route: 'Oral' },
  ];

  // Seed complications
  const complications = [
    {
      name: 'Post-operative Infection',
      description: 'Infection occurring after surgery',
      risk_level: 'High',
      foreign_key: 'COMP_1',
      lab1_id: null,
      lab2_id: null,
      rad1_id: null,
      rad2_id: null,
      med1_id: null,
      med2_id: null,
      med3_id: null,
      med4_id: null,
    },
    {
      name: 'Bleeding',
      description: 'Excessive bleeding during or after surgery',
      risk_level: 'High',
      foreign_key: 'COMP_2',
      lab1_id: null,
      lab2_id: null,
      rad1_id: null,
      rad2_id: null,
      med1_id: null,
      med2_id: null,
      med3_id: null,
      med4_id: null,
    },
  ];

  try {
    // Insert lab tests
    const { error: labError } = await supabase.from('lab').insert(labTests);
    if (labError) throw labError;

    // Insert radiology tests
    const { error: radiologyError } = await supabase.from('radiology').insert(radiologyTests);
    if (radiologyError) throw radiologyError;

    // Insert medications
    const { error: medicationError } = await supabase.from('medications').insert(medications);
    if (medicationError) throw medicationError;

    // Insert complications
    const { error: complicationError } = await supabase.from('complications').insert(complications);
    if (complicationError) throw complicationError;

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
} 