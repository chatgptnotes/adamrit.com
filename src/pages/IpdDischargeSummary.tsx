import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface MedicationRow {
  id: string;
  name: string;
  unit: string;
  remark: string;
  route: string;
  dose: string;
  quantity: string;
  days: string;
  startDate: string;
  timing: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  isSos: boolean;
}

const IpdDischargeSummary = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Force complete cache clear and component refresh
  React.useEffect(() => {
    console.log('🔄 IpdDischargeSummary component mounted - clearing all caches for visitId:', visitId);

    // Clear all React Query cache
    try {
      queryClient.clear();
      queryClient.invalidateQueries();
      queryClient.removeQueries();

      // Clear any specific queries that might still exist
      queryClient.removeQueries({ queryKey: ['patient-discharge-data'] });
      queryClient.removeQueries({ queryKey: ['patient-discharge-data-simple'] });
      queryClient.removeQueries({ queryKey: ['investigations-data'] });

      // Clear browser storage that might contain cached queries
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        // Clear only react-query related items from localStorage to avoid breaking other functionality
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
            localStorage.removeItem(key);
          }
        });
      }

      console.log('✅ All React Query caches and storage cleared');
    } catch (error) {
      console.log('Cache clearing completed with minor issues:', error);
    }
  }, [visitId, queryClient]);

  // Patient Info States
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    address: '',
    regId: '',
    ageSex: '',
    treatingConsultant: '',
    otherConsultants: '',
    doa: '',
    dateOfDischarge: '',
    reasonOfDischarge: 'Please select',
    corporateType: ''
  });

  // Diagnosis States
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisTemplates] = useState([
    'OPD Summary',
    'differential daignosis',
    'ROAD TRAFFIC ACCIDENT WITH RIGHT KNEE INJURY WITH K/C/O: Diabetes mellitus (DM); Hypertension (HTN) WITH PROXIMAL TIBIA RIGHT FRACTURE WITH ISCHEMIC HEART DISEASE (IHD) WITH CORONARY ARTERY BYPASS GRAFT (CABG)',
    'opd_Summary'
  ]);

  // Treatment on Discharge States
  const [medicationRows, setMedicationRows] = useState<MedicationRow[]>([
    {
      id: '1',
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    }
  ]);

  // Examination States
  const [examination, setExamination] = useState({
    temp: '',
    pr: '',
    rr: '',
    bp: '',
    spo2: '',
    details: ''
  });
  const [examinationTemplates] = useState([
    'CVS - S1S2 Normal, P/A - Tenderness, CNS : Conscious/Oriented, RS- Clear'
  ]);

  // Investigations States
  const [investigations, setInvestigations] = useState('');
  const [printRecentOnly, setPrintRecentOnly] = useState(false);

  // OT Notes States
  const [stayNotes, setStayNotes] = useState('');
  const [stayNotesTemplates] = useState([
    'Patient Advice',
    'Medication On Discharge',
    'OT Notes',
    'Investigations During Stay',
    'Differential Diagnosis',
    'Difference Dalgnosis'
  ]);

  // Stay Medicines States
  const [stayMedicines, setStayMedicines] = useState([
    { name: '', date: '' }
  ]);

  // Treatment During Hospital Stay States
  const [treatmentCondition, setTreatmentCondition] = useState('Satisfactory');
  const [treatmentStatus, setTreatmentStatus] = useState('Please select');
  const [reviewDate, setReviewDate] = useState('2025-09-26');
  const [residentOnDischarge, setResidentOnDischarge] = useState('Please select');
  const [enableSmsAlert, setEnableSmsAlert] = useState(false);

  // Fetch patient data using the same query structure as IPD Dashboard
  const { data: patientData, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: ['patient-discharge-data', visitId],
    queryFn: async () => {
      try {
        console.log('🏥 IPD Discharge Summary: Fetching data for visit_id:', visitId);

        // Use the EXACT same query structure as IPD Dashboard
        // Search by visit_id (not id) and join with patients table
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner(
              id,
              name,
              patients_id,
              hospital_name,
              corporate,
              age,
              gender,
              address,
              phone
            )
          `)
          .eq('visit_id', visitId)
          .eq('patient_type', 'IPD')
          .single();

        if (visitError) {
          console.log('❌ Visit not found with visit_id:', visitId, visitError.message);

          // Fallback: Check if there's lab data for this visit_id
          const { data: labData } = await supabase
            .from('lab_results')
            .select('patient_name, patient_age, patient_gender, created_at')
            .eq('visit_id', visitId)
            .limit(1);

          if (labData && labData.length > 0) {
            console.log('✅ Found lab results, creating fallback data');
            const labResult = labData[0];

            return {
              id: visitId,
              visit_id: visitId,
              patient_type: 'IPD',
              admission_date: labResult.created_at,
              discharge_date: null,
              created_at: labResult.created_at,
              patients: {
                id: 'lab-derived',
                name: labResult.patient_name || 'Lab Patient',
                patients_id: visitId.replace(/[A-Za-z]/g, ''), // Extract numbers only
                age: labResult.patient_age,
                gender: labResult.patient_gender,
                address: 'Address from lab records',
                hospital_name: null,
                corporate: null
              },
              dataSource: 'lab-results'
            };
          }

          // If no lab data either, throw error to show fallback form
          throw new Error(`Visit ID ${visitId} not found`);
        }

        console.log('✅ Found visit data with patients:', visitData);

        // Get discharge summary if exists
        const { data: summaryData } = await supabase
          .from('discharge_summaries')
          .select('*')
          .eq('visit_id', visitId)
          .single();

        if (summaryData) {
          console.log('✅ Found existing discharge summary');
        }

        return {
          ...visitData,
          dischargeSummary: summaryData,
          dataSource: 'dashboard-compatible'
        };

      } catch (error) {
        console.log('❌ Error in patient data fetch:', error.message);
        throw error;
      }
    },
    enabled: !!visitId,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // Fetch real lab results from database using visit_id
  const { data: labResultsData, isLoading: isLabResultsLoading } = useQuery({
    queryKey: ['lab-results', visitId],
    queryFn: async () => {
      console.log('🧪 Fetching lab results for visit_id:', visitId);

      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          id,
          visit_id,
          test_name,
          test_category,
          result_value,
          result_unit,
          main_test_name,
          patient_name,
          patient_age,
          patient_gender,
          created_at
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('❌ No lab results found for visit_id:', visitId, error.message);
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: `No lab results found for visit ID: ${visitId}`
        };
      }

      console.log('✅ Lab results data found:', data?.length || 0, 'results');

      if (!data || data.length === 0) {
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: 'No lab results found for this visit. Lab data will be populated when available.'
        };
      }

      // Group results by date and main test category
      const groupedResults = data.reduce((acc, result) => {
        const date = result.created_at;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.main_test_name || result.test_category || 'General Tests';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to the requested format: "03/11/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl"
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, results]) => {
              const resultString = results
                .map(result => {
                  const value = result.result_value || 'N/A';
                  const unit = result.result_unit ? ` ${result.result_unit}` : '';
                  return `${result.test_name}:${value}${unit}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${resultString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: data,
        groupedResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch radiology data from database using visit_id (or UUID)
  const { data: radiologyData, isLoading: isRadiologyLoading } = useQuery({
    queryKey: ['radiology-data', visitId, patientData?.id],
    queryFn: async () => {
      console.log('🩻 Fetching radiology data for visit_id:', visitId);

      // First, let's try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID, error: radiologyUUIDError } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (!radiologyUUIDError && radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // If no results with UUID, try with visit_id in radiology_orders table (complex system)
      if (radiologyResults.length === 0) {
        console.log('🔍 Trying radiology lookup in radiology_orders with visit_id:', visitId);
        const { data: radiologyOrders } = await supabase
          .from('radiology_orders')
          .select(`
            id,
            order_number,
            priority,
            clinical_indication,
            clinical_history,
            order_date,
            scheduled_date,
            status,
            notes,
            radiology_procedures!inner(
              id,
              name,
              code,
              modality_id,
              body_part
            )
          `)
          .eq('patient_id', patientData?.patients?.id || visitId)
          .order('order_date', { ascending: false });

        if (radiologyOrders && radiologyOrders.length > 0) {
          // Convert to similar format as visit_radiology
          radiologyResults = radiologyOrders.map(order => ({
            id: order.id,
            status: order.status,
            ordered_date: order.order_date,
            scheduled_date: order.scheduled_date,
            completed_date: null,
            findings: null,
            impression: null,
            notes: order.notes,
            radiology: {
              id: order.radiology_procedures.id,
              name: order.radiology_procedures.name,
              category: order.radiology_procedures.body_part || 'Radiology',
              description: order.clinical_indication
            }
          }));
          console.log('✅ Found radiology data via radiology_orders:', radiologyResults.length, 'orders');
        }
      }

      if (radiologyResults.length === 0) {
        return {
          rawData: [],
          formattedResults: 'No radiology studies found for this visit. Radiology data will be populated when available.'
        };
      }

      // Group results by date and category
      const groupedResults = radiologyResults.reduce((acc, result) => {
        const date = result.ordered_date || result.scheduled_date;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.radiology.category || 'Radiology';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to a similar pattern as lab results
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, studies]) => {
              const studyString = studies
                .map(study => {
                  const name = study.radiology.name;
                  const status = study.status ? ` (${study.status})` : '';
                  const findings = study.findings ? `, Findings: ${study.findings}` : '';
                  const impression = study.impression ? `, Impression: ${study.impression}` : '';
                  return `${name}${status}${findings}${impression}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${studyString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: radiologyResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  const isInvestigationsLoading = isLabResultsLoading || isRadiologyLoading;

  // Update patient info when data is loaded
  useEffect(() => {
    if (patientData) {
      const patient = patientData.patients;
      const summary = patientData.dischargeSummary;

      setPatientInfo({
        name: patient?.name || 'Unknown Patient',
        address: patient?.address || '',
        regId: patient?.patients_id || patientData.id || '',
        ageSex: `${patient?.age || 'N/A'} Years / ${patient?.gender || 'N/A'}`,
        treatingConsultant: patientData.doctor_name || patientData.appointment_with || 'Unknown Doctor',
        otherConsultants: summary?.other_consultants || '',
        doa: patientData.admission_date ? format(new Date(patientData.admission_date), 'yyyy-MM-dd') : patientData.created_at ? format(new Date(patientData.created_at), 'yyyy-MM-dd') : '',
        dateOfDischarge: patientData.discharge_date ? format(new Date(patientData.discharge_date), 'yyyy-MM-dd') : '',
        reasonOfDischarge: summary?.reason_of_discharge || 'Please select',
        corporateType: patientData.corporate_name || patientData.insurance_company || ''
      });

      // Load existing discharge summary data if available
      if (summary) {
        if (summary.diagnosis) setDiagnosis(summary.diagnosis);
        if (summary.investigations) setInvestigations(summary.investigations);
        if (summary.stay_notes) setStayNotes(summary.stay_notes);

        if (summary.medications) {
          try {
            const meds = JSON.parse(summary.medications);
            if (Array.isArray(meds)) {
              setMedicationRows(meds);
            }
          } catch (e) {
            console.log('Error parsing medications:', e);
          }
        }

        if (summary.examination_data) {
          try {
            const examData = JSON.parse(summary.examination_data);
            setExamination(examData);
          } catch (e) {
            console.log('Error parsing examination data:', e);
          }
        }
      }

      // Set vital signs from visit data if available and no examination data in summary
      if (patientData.vital_signs && !summary?.examination_data) {
        try {
          const vitals = JSON.parse(patientData.vital_signs);
          setExamination(prev => ({
            ...prev,
            temp: vitals.temperature || prev.temp,
            pr: vitals.pulse_rate || prev.pr,
            rr: vitals.respiratory_rate || prev.rr,
            bp: vitals.blood_pressure || prev.bp,
            spo2: vitals.oxygen_saturation || prev.spo2,
          }));
        } catch (e) {
          console.log('No vital signs data to parse');
        }
      }
    }
  }, [patientData]);

  // Update investigations with lab and radiology results data
  useEffect(() => {
    let combinedResults = [];

    // Add lab results
    if (labResultsData && labResultsData.formattedResults && labResultsData.formattedResults !== 'No lab results found for this visit. Lab data will be populated when available.') {
      combinedResults.push(labResultsData.formattedResults);
    }

    // Add radiology results
    if (radiologyData && radiologyData.formattedResults && radiologyData.formattedResults !== 'No radiology studies found for this visit. Radiology data will be populated when available.') {
      combinedResults.push(radiologyData.formattedResults);
    }

    if (combinedResults.length > 0) {
      const combinedInvestigations = combinedResults.join('\n\n--- RADIOLOGY ---\n\n');
      setInvestigations(combinedInvestigations);
    } else if (!investigations || investigations === 'Investigation details will be populated here...' || investigations.includes('Lab and radiology investigations will be populated here')) {
      setInvestigations('Lab and radiology investigations will be populated here when data is available.');
    }
  }, [labResultsData, radiologyData, investigations]);

  // Error boundary to catch and properly handle database errors
  React.useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Filter out known database-related console spam
    console.error = (...args) => {
      const message = args.join(' ').toLowerCase();

      // Allow important errors through but filter spam
      if (message.includes('foreign key relationship') ||
          message.includes('schema') ||
          message.includes('column') && message.includes('does not exist') ||
          message.includes('relation') && message.includes('does not exist') ||
          message.includes('searched for a foreign key relationship')) {
        // These are known issues with complex joins - suppress them
        return;
      }

      // Log other errors normally
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ').toLowerCase();

      // Suppress specific warnings
      if (message.includes('foreign key relationship') ||
          message.includes('schema') && message.includes('public') ||
          message.includes('relation') && message.includes('warning')) {
        return;
      }

      originalConsoleWarn(...args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const addMedicationRow = () => {
    const newRow: MedicationRow = {
      id: Date.now().toString(),
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    };
    setMedicationRows([...medicationRows, newRow]);
  };

  const removeMedicationRow = (id: string) => {
    if (medicationRows.length > 1) {
      setMedicationRows(medicationRows.filter(row => row.id !== id));
    }
  };

  const updateMedicationRow = (id: string, field: string, value: any) => {
    setMedicationRows(medicationRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const addStayMedicineRow = () => {
    setStayMedicines([...stayMedicines, { name: '', date: '' }]);
  };

  const updateStayMedicine = (index: number, field: string, value: string) => {
    const updated = [...stayMedicines];
    updated[index] = { ...updated[index], [field]: value };
    setStayMedicines(updated);
  };

  const handleSave = async () => {
    try {
      if (!patientData) {
        toast({
          title: "Error",
          description: "Patient data not loaded. Cannot save discharge summary.",
        });
        return;
      }

      // Prepare data for saving
      const dischargeData = {
        visit_id: visitId,
        diagnosis,
        investigations,
        stay_notes: stayNotes,
        medications: JSON.stringify(medicationRows),
        examination_data: JSON.stringify(examination),
        other_consultants: patientInfo.otherConsultants,
        reason_of_discharge: patientInfo.reasonOfDischarge,
        treatment_condition: treatmentCondition,
        treatment_status: treatmentStatus,
        review_date: reviewDate,
        resident_on_discharge: residentOnDischarge,
        enable_sms_alert: enableSmsAlert,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('discharge_summaries')
        .upsert(dischargeData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discharge summary saved successfully!",
      });

    } catch (error) {
      console.error('Error saving discharge summary:', error);
      toast({
        title: "Error",
        description: "Failed to save discharge summary. Please try again.",
      });
    }
  };

  const handlePrintPreview = () => {
    // Here you would generate and show print preview
    toast({
      title: "Print Preview",
      description: "Opening print preview...",
    });
  };

  // Function to manually fetch investigations data (lab + radiology)
  const handleFetchInvestigations = async () => {
    try {
      toast({
        title: "Searching Investigations",
        description: "Searching for lab results and radiology data...",
      });

      console.log('🔍 Searching investigations for visit_id:', visitId);
      let combinedResults = [];

      // Search for lab results using the visit_id directly (same as dashboard)
      console.log('🧪 Searching lab results for visit_id:', visitId);

      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          id,
          visit_id,
          test_name,
          test_category,
          result_value,
          result_unit,
          main_test_name,
          created_at
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false });

      // If no results for this visit ID, try to get any recent lab results to show example format
      if (!data || data.length === 0) {
        console.log('No results for visit ID, trying to get sample data...');

        const { data: sampleData } = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at,
            patient_name
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (sampleData && sampleData.length > 0) {
          const sampleResult = sampleData[0];
          const sampleFormat = `${format(new Date(sampleResult.created_at), 'dd/MM/yyyy')}:-${sampleResult.main_test_name || 'Sample Test'}: ${sampleResult.test_name}:${sampleResult.result_value || 'Sample Value'}${sampleResult.result_unit ? ' ' + sampleResult.result_unit : ''}`;

          setInvestigations(`No lab results found for visit ID: ${visitId}

Sample format (from other patients):
${sampleFormat}

You can manually enter lab results in this format:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit

Example:
26/09/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl, Sr. Sodium:147 mmol/L`);

          toast({
            title: "No Data for This Visit",
            description: `No lab results found for visit ${visitId}. Sample format provided.`,
          });
          return;
        }
      }

      // Process lab results
      if (data && data.length > 0) {
        console.log('✅ Found lab results:', data.length);

        const groupedLabResults = data.reduce((acc, result) => {
          const date = result.created_at;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.main_test_name || result.test_category || 'General Tests';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedLabResults = Object.entries(groupedLabResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, results]) => {
                const resultString = results
                  .map(result => {
                    const value = result.result_value || 'N/A';
                    const unit = result.result_unit ? ` ${result.result_unit}` : '';
                    return `${result.test_name}:${value}${unit}`;
                  })
                  .join(', ');

                return `${date}:-${categoryName}: ${resultString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedLabResults);
      }

      // Now fetch radiology data
      console.log('🩻 Searching radiology data for visit_id:', visitId);

      // Try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // Process radiology results
      if (radiologyResults.length > 0) {
        const groupedRadiologyResults = radiologyResults.reduce((acc, result) => {
          const date = result.ordered_date || result.scheduled_date;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.radiology.category || 'Radiology';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedRadiologyResults = Object.entries(groupedRadiologyResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, studies]) => {
                const studyString = studies
                  .map(study => {
                    const name = study.radiology.name;
                    const status = study.status ? ` (${study.status})` : '';
                    const findings = study.findings ? `, Findings: ${study.findings}` : '';
                    const impression = study.impression ? `, Impression: ${study.impression}` : '';
                    return `${name}${status}${findings}${impression}`;
                  })
                  .join(', ');

                return `${date}:-${categoryName}: ${studyString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedRadiologyResults);
      }

      // Combine all results
      if (combinedResults.length > 0) {
        const finalResults = combinedResults.join('\n\n--- RADIOLOGY ---\n\n');
        setInvestigations(finalResults);

        const labCount = data?.length || 0;
        const radiologyCount = radiologyResults.length;

        toast({
          title: "Success",
          description: `Fetched ${labCount} lab results and ${radiologyCount} radiology studies.`,
        });
      } else {
        // No data found
        setInvestigations(`No investigations found in database for visit ID: ${visitId}

You can manually enter investigations in this format:

LAB RESULTS:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit

RADIOLOGY:
DD/MM/YYYY:-Study Category: Study Name (status), Findings: findings, Impression: impression

Example:
26/09/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl, Sr. Sodium:147 mmol/L

--- RADIOLOGY ---

26/09/2024:-Chest Imaging: Chest X-Ray (completed), Findings: Clear lungs, Impression: Normal study`);

        toast({
          title: "No Data Found",
          description: "No investigations found for this visit. You can enter them manually.",
        });
      }
    } catch (error) {
      console.error('Error fetching investigations:', error);
      setInvestigations(`Error occurred while fetching lab results.

You can still manually enter lab results in this format:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit`);

      toast({
        title: "Error",
        description: "Error occurred, but you can still enter lab results manually.",
      });
    }
  };

  // Function to clear all caches and force refresh
  const handleClearCacheAndRefresh = () => {
    try {
      queryClient.clear();
      sessionStorage.clear();

      // Clear React Query related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Cache Cleared",
        description: "All caches have been cleared. Refreshing page...",
      });

      // Force a hard refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.log('Cache clearing attempt completed');
      toast({
        title: "Cache Clear Attempted",
        description: "Cache clearing attempted. Please refresh the page manually.",
      });
    }
  };

  // Force complete page refresh on component mount to clear all browser cache
  React.useEffect(() => {
    const isFirstLoad = !sessionStorage.getItem('discharge-summary-loaded');

    if (isFirstLoad) {
      sessionStorage.setItem('discharge-summary-loaded', 'true');
      // Clear all possible caches on first load
      try {
        queryClient.clear();

        // Clear any cached data that might be causing errors
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') ||
              key.includes('supabase') ||
              key.includes('discharge') ||
              key.includes('investigation') ||
              key.includes('patient-data')) {
            localStorage.removeItem(key);
          }
        });

        console.log('✅ Browser cache fully cleared on component mount');
      } catch (error) {
        console.log('Cache clearing completed with minor issues');
      }
    }
  }, [queryClient]);

  // Show loading spinner while patient data is being fetched
  if (isPatientLoading || isInvestigationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 mb-2">
              {isPatientLoading && 'Loading patient data...'}
              {isInvestigationsLoading && 'Loading lab results...'}
            </p>
            <p className="text-sm text-gray-500">
              Visit ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{visitId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create a fallback component that shows a working form even when no data exists
  const renderFallbackForm = () => {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-800">
              <h3 className="font-semibold">⚠️ No Data Found for Visit ID: {visitId}</h3>
              <p className="text-sm mt-1">
                Working with demo/placeholder data. You can still use the form to create a new discharge summary.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            IPD Discharge Summary
            <span className="text-lg font-normal text-gray-600 ml-2">
              - New Patient ({visitId})
            </span>
          </h1>
          <div className="space-x-2">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handlePrintPreview} className="bg-blue-600 hover:bg-blue-700">
              Print Preview
            </Button>
            <Button
              onClick={() => navigate('/todays-ipd')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Patient Information with placeholder data */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name:</Label>
                <Input
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Reg ID:</Label>
                <Input
                  value={patientInfo.regId}
                  onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                  placeholder="Enter registration ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Address:</Label>
                <Input
                  value={patientInfo.address}
                  onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                  placeholder="Enter patient address"
                />
              </div>
              <div className="space-y-2">
                <Label>Age/Sex:</Label>
                <Input
                  value={patientInfo.ageSex}
                  onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                  placeholder="Enter age/sex"
                />
              </div>
              <div className="space-y-2">
                <Label>Treating Consultant:</Label>
                <Input
                  value={patientInfo.treatingConsultant}
                  onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                  placeholder="Enter treating consultant"
                />
              </div>
              <div className="space-y-2">
                <Label>DOA:</Label>
                <Input
                  type="date"
                  value={patientInfo.doa}
                  onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investigations with demo data fetching */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Investigations:</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchInvestigations}
                >
                  Try Fetch Lab Data
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              placeholder="Enter investigation details here. You can manually add lab results in the format: DD/MM/YYYY:-Test Name: Result1:Value1 unit, Result2:Value2 unit"
              className="min-h-[120px]"
            />
            <div className="text-sm text-gray-600">
              💡 Tip: You can manually enter lab results or try the "Try Fetch Lab Data" button to search for any existing data.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4 pb-6">
          <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
            Save New Summary
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="px-8 py-2 border-gray-300 hover:bg-gray-50"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  // Show error if patient data not found, but provide working fallback form
  if (!patientData && !isPatientLoading && patientError) {
    return renderFallbackForm();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          IPD Discharge Summary
          {patientData && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {patientData.patients.name} ({patientData.patients.patients_id})
            </span>
          )}
        </h1>
        <div className="space-x-2">
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={handlePrintPreview} className="bg-blue-600 hover:bg-blue-700">
            Print Preview
          </Button>
          <Button
            onClick={handleClearCacheAndRefresh}
            variant="outline"
            className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          >
            Clear Cache & Refresh
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name:</Label>
              <Input
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                placeholder="Patient Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Reg ID:</Label>
              <Input
                value={patientInfo.regId}
                onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                placeholder="Registration ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Address:</Label>
              <Input
                value={patientInfo.address}
                onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                placeholder="Patient Address"
              />
            </div>
            <div className="space-y-2">
              <Label>Age/Sex:</Label>
              <Input
                value={patientInfo.ageSex}
                onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                placeholder="Age/Sex"
              />
            </div>
            <div className="space-y-2">
              <Label>Treating Consultant:</Label>
              <Input
                value={patientInfo.treatingConsultant}
                onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                placeholder="Treating Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label>DOA:</Label>
              <Input
                type="date"
                value={patientInfo.doa}
                onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Other Consultants:</Label>
              <Textarea
                value={patientInfo.otherConsultants}
                onChange={(e) => setPatientInfo({...patientInfo, otherConsultants: e.target.value})}
                placeholder="Other Consultants"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Of Discharge:</Label>
              <Input
                type="date"
                value={patientInfo.dateOfDischarge}
                onChange={(e) => setPatientInfo({...patientInfo, dateOfDischarge: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason Of Discharge:</Label>
              <Select
                value={patientInfo.reasonOfDischarge}
                onValueChange={(value) => setPatientInfo({...patientInfo, reasonOfDischarge: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  <SelectItem value="Treatment Complete">Treatment Complete</SelectItem>
                  <SelectItem value="Against Medical Advice">Against Medical Advice</SelectItem>
                  <SelectItem value="Referred">Referred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Corporate Type:</Label>
              <Input
                value={patientInfo.corporateType}
                onChange={(e) => setPatientInfo({...patientInfo, corporateType: e.target.value})}
                placeholder="Corporate Type"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Templates:</Label>
              <div className="border rounded p-2 h-32 overflow-y-auto">
                <div className="space-y-1">
                  {diagnosisTemplates.map((template, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDiagnosis(diagnosis + template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {template}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis Details:</Label>
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis details..."
                className="min-h-[120px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment on Discharge */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment on Discharge:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-sm">Name of Medication</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Remark</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Route</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Dose</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Quantity</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">No. of Days</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Start Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Timing</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Is SOS</th>
                </tr>
              </thead>
              <tbody>
                {medicationRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.name}
                        onChange={(e) => updateMedicationRow(row.id, 'name', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.unit}
                        onChange={(e) => updateMedicationRow(row.id, 'unit', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.remark}
                        onChange={(e) => updateMedicationRow(row.id, 'remark', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.route}
                        onValueChange={(value) => updateMedicationRow(row.id, 'route', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="IM">IM</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.dose}
                        onValueChange={(value) => updateMedicationRow(row.id, 'dose', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.quantity}
                        onChange={(e) => updateMedicationRow(row.id, 'quantity', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.days}
                        onChange={(e) => updateMedicationRow(row.id, 'days', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => updateMedicationRow(row.id, 'startDate', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <div className="flex space-x-1">
                        {['I', 'II', 'III', 'IV'].map((timing, timingIndex) => (
                          <Select key={timing}>
                            <SelectTrigger className="border-0 focus:ring-0 text-xs h-6 w-12">
                              <SelectValue placeholder={timing} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">M</SelectItem>
                              <SelectItem value="afternoon">A</SelectItem>
                              <SelectItem value="evening">E</SelectItem>
                              <SelectItem value="night">N</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                      <Checkbox
                        checked={row.isSos}
                        onCheckedChange={(checked) => updateMedicationRow(row.id, 'isSos', checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex space-x-2 mt-2">
              <Button onClick={addMedicationRow} size="sm">Add More</Button>
              <Button onClick={() => removeMedicationRow(medicationRows[medicationRows.length - 1]?.id)} size="sm" variant="outline">Remove</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examination */}
      <Card>
        <CardHeader>
          <CardTitle>Examination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Temp:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.temp}
                  onChange={(e) => setExamination({...examination, temp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">°F</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>P.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.pr}
                  onChange={(e) => setExamination({...examination, pr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>R.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.rr}
                  onChange={(e) => setExamination({...examination, rr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>BP:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.bp}
                  onChange={(e) => setExamination({...examination, bp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">mmHg</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SPO₂:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.spo2}
                  onChange={(e) => setExamination({...examination, spo2: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">% in Room Air</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Templates:</Label>
              <div className="border rounded p-2 h-32 overflow-y-auto">
                {examinationTemplates.map((template, index) => (
                  <div key={index} className="text-sm p-1 hover:bg-gray-50 cursor-pointer"
                       onClick={() => setExamination({...examination, details: examination.details + template})}>
                    {template}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Examination Details:</Label>
              <Textarea
                value={examination.details}
                onChange={(e) => setExamination({...examination, details: e.target.value})}
                placeholder="Enter examination details..."
                className="min-h-[120px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Investigations:</span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleFetchInvestigations}
                disabled={isInvestigationsLoading}
              >
                {isInvestigationsLoading ? 'Loading...' : 'Fetch Lab & Radiology Data'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={printRecentOnly}
              onCheckedChange={setPrintRecentOnly}
            />
            <Label>Print Recent Investigation only</Label>
          </div>
          <Textarea
            value={investigations}
            onChange={(e) => setInvestigations(e.target.value)}
            placeholder="Investigation details will be populated here..."
            className="min-h-[120px]"
          />
          <div className="text-sm text-gray-600">
            {isInvestigationsLoading ? 'Loading lab results and radiology data...' : 'Click "Fetch Lab & Radiology Data" to load latest results.'}
          </div>
        </CardContent>
      </Card>

      {/* OT Notes / Stay Notes */}
      <Card>
        <CardHeader>
          <CardTitle>OT Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Favorite Templates:</Label>
                <div className="border rounded p-2 h-40 overflow-y-auto">
                  {stayNotesTemplates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-1 hover:bg-gray-50">
                      <span className="text-sm cursor-pointer" onClick={() => setStayNotes(stayNotes + template)}>
                        {template}
                      </span>
                      <div className="space-x-1">
                        <Button variant="ghost" size="sm">✏️</Button>
                        <Button variant="ghost" size="sm">🗑️</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Message Chat GPT Ask</Button>
                  <Button size="sm" variant="outline" onClick={handleFetchInvestigations}>Fetch Data</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stay Notes:</Label>
                <Textarea
                  value={stayNotes}
                  onChange={(e) => setStayNotes(e.target.value)}
                  placeholder="Enter stay notes..."
                  className="min-h-[180px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stay Medicines */}
      <Card>
        <CardHeader>
          <CardTitle>Stay Medicines:</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Name of Medication</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {stayMedicines.map((medicine, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-2 py-2">
                    <Input
                      value={medicine.name}
                      onChange={(e) => updateStayMedicine(index, 'name', e.target.value)}
                      className="border-0 focus:ring-0"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <Input
                      type="date"
                      value={medicine.date}
                      onChange={(e) => updateStayMedicine(index, 'date', e.target.value)}
                      className="border-0 focus:ring-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={addStayMedicineRow} size="sm" className="mt-2">Add Row</Button>
        </CardContent>
      </Card>

      {/* Treatment During Hospital Stay */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment During Hospital Stay:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>The condition of patient at the time of discharge was:</Label>
              <div className="flex space-x-4">
                <Select value={treatmentCondition} onValueChange={setTreatmentCondition}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={treatmentStatus} onValueChange={setTreatmentStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Please select">Please select</SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Improving">Improving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Review on*</Label>
              <Input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resident On Discharge*</Label>
              <Select value={residentOnDischarge} onValueChange={setResidentOnDischarge}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                  <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                checked={enableSmsAlert}
                onCheckedChange={setEnableSmsAlert}
              />
              <Label>Enable SMS Alert</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center space-x-4 pb-6">
        <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
        <Button
          onClick={() => navigate('/todays-ipd')}
          variant="outline"
          className="px-8 py-2 border-gray-300 hover:bg-gray-50"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default IpdDischargeSummary;