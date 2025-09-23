import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubTest {
  id: string;
  lab_id: string;
  test_name: string;
  sub_test_name: string;
  unit: string;
  min_age: number;
  max_age: number;
  age_unit: string;
}

export interface TestResult {
  subTestId: string;
  subTestName: string;
  observedValue: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | '';
  comments: string;
  abnormal: boolean;
  file?: File;
}

export const useLabTestConfig = () => {
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingSubTests, setLoadingSubTests] = useState(false);

  const fetchAvailableTests = async () => {
    setLoadingTests(true);
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('test_name')
        .order('test_name');

      if (error) throw error;

      const uniqueTests = [...new Set(data?.map(item => item.test_name) || [])];
      setAvailableTests(uniqueTests);
    } catch (error) {
      console.error('Error fetching available tests:', error);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchSubTestsForTest = async (testName: string) => {
    console.log('Fetching sub-tests for:', testName);
    setLoadingSubTests(true);
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', testName)
        .order('sub_test_name');

      console.log('Fetched sub-tests data:', data);
      if (error) {
        console.error('Sub-tests fetch error:', error);
        throw error;
      }

      setSubTests(data || []);
      console.log('Sub-tests set to:', data || []);
    } catch (error) {
      console.error('Error fetching sub tests:', error);
    } finally {
      setLoadingSubTests(false);
    }
  };

  const getNormalRange = (subTest: SubTest, patientAge: number, patientGender: string): string => {
    // For now, return a placeholder. You can add min/max values to your table later
    return `Consult reference values ${subTest.unit}`;
  };

  const isAbnormalValue = (value: string, subTest: SubTest, patientAge: number, patientGender: string): 'normal' | 'high' | 'low' | '' => {
    // For now, return empty. You can add min/max value logic later
    return '';
  };

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  // Debug function to log data
  const debugTestData = async (testName: string) => {
    try {
      const { data, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', testName);

      console.log(`Debug data for test "${testName}":`, data);
      if (error) console.error('Debug error:', error);
    } catch (err) {
      console.error('Debug fetch error:', err);
    }
  };

  return {
    availableTests,
    subTests,
    loadingTests,
    loadingSubTests,
    fetchAvailableTests,
    fetchSubTestsForTest,
    getNormalRange,
    isAbnormalValue,
    debugTestData
  };
};

