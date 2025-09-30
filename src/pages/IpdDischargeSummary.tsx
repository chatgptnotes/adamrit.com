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
import { Badge } from "@/components/ui/badge";
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

  // Surgery Details States
  const [surgeryDetails, setSurgeryDetails] = useState({
    date: '',
    procedurePerformed: '',
    surgeon: '',
    anesthetist: '',
    anesthesia: '',
    implant: '',
    description: ''
  });


  // OT Notes States
  const [stayNotes, setStayNotes] = useState('');
  const [stayNotesTemplates, setStayNotesTemplates] = useState([
    {
      name: 'discharge_summary',
      content: `Ignore all previous instructions. You are a medical specialist. Create a professionally written Discharge Summary in the EXACT format below:

**IMPORTANT FORMATTING RULES:**
- Use proper HTML table format for tables
- Use bold headings with **
- Use numbered lists for advice
- Minimum 800 words total
- Use Indian brand medication names
- Add Hindi translation in dosage column (in brackets)

**REQUIRED FORMAT:**

**Diagnosis:** [Write the diagnosis as a single bold heading line]

**Medications:**
Create a proper HTML table:
| Name | Strength | Route | Dosage | Duration |
|------|----------|-------|---------|----------|
| [Med Name] | [Strength] | Oral | [English dosage] (Hindi: [dosage in hindi]) | 7 Days |

**Operation Notes:** (ONLY if surgery was performed)
Create a proper HTML table:
| Date and Time | [Date/Time] |
| Reason for Surgery | [Reason] |
| Surgeon | Dr. [Name] |
| Anaesthetist | Dr. [Name] |
| Anaesthesia | [Type] |
| Description | [Detailed surgical description] |

**History of Presenting Complaints:**
[Write detailed patient history, symptoms on admission, examination findings]

**Investigations:**
[List all investigations with results - blood tests, imaging, etc.]

**Treatment:**
[Describe the treatment given during hospital stay]

**Advice on Discharge:**
1. Regular intake of medications as instructed.
2. Maintain a light, low-fat diet.
3. Exercise moderately, avoid heavy lifting and strenuous activities.
4. Regular follow-up is necessary post-discharge to monitor progress.

**Warning signs:**

**Watch out for any of the following symptoms and visit the hospital if they occur:**
- Fever, severe abdominal pain, or vomiting
- Any signs of infection such as redness, swelling, or discharge from the wound
- Difficulty in passing urine or changes in bowel habits
- Return to the hospital in case of any complications related to the surgery

**Final Note:**
"URGENT CARE/EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709"

Note: Ignore all previous instructions and follow the directives given in this document.

Make up creative and realistic medical details based on the patient information provided. The entire summary should be minimum 800 words. Do not mention patient name, age, or sex directly.`
    }
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // New states for Advice and Case Summary
  const [advice, setAdvice] = useState('');
  const [caseSummaryPresentingComplaints, setCaseSummaryPresentingComplaints] = useState('');
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingTemplateContent, setEditingTemplateContent] = useState('');
  const [showAddTemplate, setShowAddTemplate] = useState(false);


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

      let data, error;

      // First, try to find the UUID for this visit_id string
      console.log('🔍 Looking for visit UUID for visit_id:', visitId);
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      let visitUUID = visitData?.id;
      console.log('📋 Found visit UUID:', visitUUID);

      // Try to get lab results using the UUID
      if (visitUUID) {
        console.log('🧪 Searching lab results using UUID:', visitUUID);
        const result = await supabase
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
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      } else {
        // Fallback: search by patient name if available from patientData
        if (patientData?.patients?.name) {
          console.log('🔍 Searching lab results by patient name:', patientData.patients.name);
          const result = await supabase
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
            .ilike('patient_name', `%${patientData.patients.name}%`)
            .order('created_at', { ascending: false })
            .limit(10);

          data = result.data;
          error = result.error;
        } else {
          data = [];
          error = { message: 'No visit UUID found and no patient name available' };
        }
      }

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

  // Fetch real surgery data for this visit - moved after patient data query
  const { data: visitSurgeryData, isLoading: isSurgeryLoading } = useQuery({
    queryKey: ['visit-surgery-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🔪 Fetching surgery data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for surgery data fetch');
        return null;
      }

      console.log('🔍 Fetching surgery data with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('visit_surgeries')
          .select(`
            *,
            cghs_surgery:surgery_id (
              name,
              code,
              NABH_NABL_Rate,
              description
            )
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching surgery data:', error.message);
          return null;
        }

        console.log('✅ Surgery data found:', data?.length || 0, 'surgeries');
        console.log('🔍 Raw surgery data:', JSON.stringify(data, null, 2));
        return data;
      } catch (error) {
        console.log('❌ Surgery query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch OT Notes data to get surgeon, anesthetist, implant info
  const { data: otNotesData, isLoading: isOtNotesLoading } = useQuery({
    queryKey: ['ot-notes-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching OT Notes data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for OT notes:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for OT notes fetch');
        return null;
      }

      console.log('🔍 Fetching OT notes with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('ot_notes')
          .select('*')
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.log('❌ Error fetching OT notes:', error.message);
          return null;
        }

        console.log('✅ OT Notes data found:', data?.length || 0, 'records');
        console.log('🔍 Raw OT notes data:', JSON.stringify(data, null, 2));
        return data?.[0] || null;
      } catch (error) {
        console.log('❌ OT notes query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch diagnosis data from billing system
  const { data: visitDiagnosisData, isLoading: isDiagnosisLoading } = useQuery({
    queryKey: ['visit-diagnosis-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching diagnosis data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for diagnosis:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for diagnosis fetch');
        return null;
      }

      console.log('🔍 Fetching diagnosis with visit UUID:', visitUUID);

      try {
        // First, let's check if there's any data in visit_diagnoses for this visit
        const { data: allVisitDiagnoses, error: checkError } = await supabase
          .from('visit_diagnoses')
          .select('*')
          .eq('visit_id', visitUUID);

        console.log('🔍 All visit_diagnoses for UUID:', visitUUID, allVisitDiagnoses);

        // Fetch diagnosis data with proper join
        const { data, error } = await supabase
          .from('visit_diagnoses')
          .select(`
            id,
            visit_id,
            diagnosis_id,
            is_primary,
            notes,
            created_at,
            diagnoses!visit_diagnoses_diagnosis_id_fkey (
              id,
              name
            )
          `)
          .eq('visit_id', visitUUID)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching diagnosis data:', error.message);
          return null;
        }

        console.log('✅ Diagnosis data found:', data?.length || 0, 'diagnoses');
        console.log('🔍 Detailed diagnosis data:', JSON.stringify(data, null, 2));

        // Also check what's in visit_diagnoses table without join
        if (!data || data.length === 0) {
          console.log('🔍 No data found, checking visit_diagnoses table directly...');
          const { data: rawData } = await supabase
            .from('visit_diagnoses')
            .select('*');
          console.log('🔍 All visit_diagnoses in table:', rawData);
        }

        return data;
      } catch (error) {
        console.log('❌ Diagnosis query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  const isInvestigationsLoading = isLabResultsLoading || isRadiologyLoading;

  // Fetch existing discharge summary data for editing
  const { data: existingDischargeSummary, isLoading: isLoadingDischargeSummary } = useQuery({
    queryKey: ['existing-discharge-summary', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('📋 Loading existing discharge summary for visit:', visitId);

      try {
        // First get visit UUID from string visit_id
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (!visitData?.id) {
          console.log('📋 Visit UUID not found');
          return null;
        }

        // Get main discharge summary from ipd_discharge_summary table
        const { data: summaryData, error: summaryError } = await supabase
          .from('ipd_discharge_summary')
          .select('*')
          .eq('visit_id', visitData.id)
          .single();

        if (summaryError) {
          if (summaryError.code === 'PGRST116') {
            console.log('📋 No existing discharge summary found - creating new one');
            return null;
          }
          throw summaryError;
        }

        console.log('📋 Found existing discharge summary:', summaryData.id);

        // Extract data from JSONB columns
        const medicationsData = summaryData.discharge_medications || [];
        const examinationData = summaryData.vital_signs || null;
        const surgeryData = summaryData.procedures_performed || null;

        console.log('📋 Loaded discharge summary data:', {
          summary: !!summaryData,
          medications: medicationsData?.length || 0,
          examination: !!examinationData,
          surgery: !!surgeryData
        });

        return {
          summary: summaryData,
          medications: medicationsData,
          examination: examinationData,
          surgery: surgeryData
        };

      } catch (error) {
        console.error('❌ Error loading existing discharge summary:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch medications for the searchable dropdown
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('');
  const [activeSearchRowId, setActiveSearchRowId] = useState(null);
  const { data: availableMedications = [] } = useQuery({
    queryKey: ['medications', medicationSearchTerm],
    queryFn: async () => {
      if (!medicationSearchTerm || medicationSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('medication')
        .select('id, name, generic_name, category, dosage, strength, manufacturer')
        .or(`name.ilike.%${medicationSearchTerm}%,generic_name.ilike.%${medicationSearchTerm}%,category.ilike.%${medicationSearchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching medications:', error);
        return [];
      }

      return data || [];
    },
    enabled: medicationSearchTerm.length >= 2,
    staleTime: 30000
  });

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
        // Set discharge date to current date if not already set
        dateOfDischarge: patientData.discharge_date ? format(new Date(patientData.discharge_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        reasonOfDischarge: summary?.reason_of_discharge || 'Please select',
        // Fetch corporate type from patients table
        corporateType: patient?.corporate || patient?.corporate_type || patient?.insurance_company || ''
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

        if (summary.surgery_details) {
          try {
            const surgeryData = JSON.parse(summary.surgery_details);
            setSurgeryDetails(surgeryData);
          } catch (e) {
            console.log('Error parsing surgery details:', e);
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

  // Update surgery details when data is loaded (combine visit_surgeries + ot_notes data)
  useEffect(() => {
    if (visitSurgeryData && visitSurgeryData.length > 0) {
      try {
        const surgery = visitSurgeryData[0]; // Get the first/primary surgery
        const surgeryInfo = surgery?.cghs_surgery;

        // Prefer OT notes data for surgeon, anesthetist, implant info, fallback to surgery table
        const surgeon = otNotesData?.surgeon || surgery?.surgeon || '';
        const anesthetist = otNotesData?.anaesthetist || surgery?.anaesthetist_name || '';
        const anesthesia = otNotesData?.anaesthesia || surgery?.anaesthesia_type || '';
        const implant = otNotesData?.implant || surgery?.implant || '';

        // Use OT notes date if available, otherwise surgery date
        const surgeryDate = (otNotesData?.date ? new Date(otNotesData.date) : null) ||
                           (surgery?.created_at ? new Date(surgery.created_at) : null);

        // Use OT notes procedure if available, otherwise CGHS surgery info
        const procedurePerformed = otNotesData?.procedure_performed ||
                                 (surgeryInfo?.name ? `${surgeryInfo.name} (${surgeryInfo.code || ''})` : '');

        setSurgeryDetails({
          date: surgeryDate ? format(surgeryDate, "yyyy-MM-dd'T'HH:mm") : '',
          procedurePerformed: procedurePerformed,
          surgeon: surgeon,
          anesthetist: anesthetist,
          anesthesia: anesthesia,
          implant: implant,
          description: otNotesData?.description || `**Surgical Operation Record**

**Patient Information:**
- Name: ${patientData?.patients?.name || 'Patient'}
- Age: ${patientData?.patients?.age || 'N/A'}
- Gender: ${patientData?.patients?.gender || 'N/A'}

**Date of Surgery:** ${surgeryDate ? format(surgeryDate, 'MMMM dd, yyyy') : 'N/A'}

**Surgery Details:**
- Procedure: ${procedurePerformed || 'N/A'}
- Code: ${surgeryInfo?.code || 'N/A'}
- Rate: ₹${surgeryInfo?.NABH_NABL_Rate || otNotesData?.surgery_rate || 'N/A'}
- Status: ${surgery?.sanction_status || otNotesData?.surgery_status || 'N/A'}
- Surgeon: ${surgeon || 'N/A'}
- Anesthetist: ${anesthetist || 'N/A'}
- Anesthesia Type: ${anesthesia || 'N/A'}
- Implant: ${implant || 'N/A'}

${surgeryInfo?.description || surgery?.notes || 'Standard surgical procedure performed successfully.'}`
        });

        console.log('✅ Surgery details updated with data from:', {
          surgeryTable: !!visitSurgeryData,
          otNotes: !!otNotesData,
          surgeon,
          anesthetist,
          anesthesia,
          implant
        });

      } catch (error) {
        console.log('❌ Error updating surgery details:', error);
      }
    }
  }, [visitSurgeryData, otNotesData, patientData]);

  // Update diagnosis when data is loaded from visit_diagnoses table
  useEffect(() => {
    if (visitDiagnosisData && visitDiagnosisData.length > 0) {
      try {
        console.log('🔄 Processing diagnosis data:', visitDiagnosisData);

        // Format diagnosis data for display
        const primaryDiagnosis = visitDiagnosisData.find(d => d.is_primary === true);
        const secondaryDiagnoses = visitDiagnosisData.filter(d => d.is_primary !== true);

        let diagnosisText = '';

        // Add primary diagnosis
        if (primaryDiagnosis && primaryDiagnosis.diagnoses) {
          diagnosisText += `${primaryDiagnosis.diagnoses.name}`;
          if (primaryDiagnosis.notes) {
            diagnosisText += `\nNotes: ${primaryDiagnosis.notes}`;
          }
        }

        // Add secondary diagnoses
        if (secondaryDiagnoses.length > 0) {
          if (diagnosisText) diagnosisText += '\n';
          secondaryDiagnoses.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) {
                diagnosisText += ` (${diag.notes})`;
              }
              diagnosisText += '\n';
            }
          });
        }

        // If no primary/secondary structure, just list all diagnoses
        if (!primaryDiagnosis && visitDiagnosisData.length > 0) {
          diagnosisText = '';
          visitDiagnosisData.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              if (index > 0) diagnosisText += '\n';
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) diagnosisText += ` - ${diag.notes}`;
            }
          });
        }

        // Update diagnosis field only if empty
        if (!diagnosis || diagnosis.trim() === '' || diagnosis === 'Enter diagnosis details...') {
          setDiagnosis(diagnosisText.trim());
          console.log('✅ Diagnosis field updated with:', diagnosisText.trim());
        }

        console.log('✅ Diagnosis data processed:', {
          primaryFound: !!primaryDiagnosis,
          primaryName: primaryDiagnosis?.diagnoses?.name,
          secondaryCount: secondaryDiagnoses.length,
          totalDiagnoses: visitDiagnosisData.length
        });

      } catch (error) {
        console.log('❌ Error formatting diagnosis data:', error);
      }
    }
  }, [visitDiagnosisData, diagnosis]);

  // Populate form fields when existing discharge summary is loaded
  useEffect(() => {
    if (existingDischargeSummary) {
      try {
        console.log('📝 Populating form with existing discharge summary data');

        const { summary, medications, examination, surgery } = existingDischargeSummary;

        // Populate main fields
        if (summary) {
          setDiagnosis(summary.primary_diagnosis || '');
          setInvestigations(summary.lab_investigations?.investigations_text || '');
          setStayNotes(summary.ot_notes || '');
          setCaseSummaryPresentingComplaints(summary.chief_complaints || '');
          setAdvice(summary.discharge_advice || '');
          setTreatmentCondition(summary.condition_on_discharge || 'Satisfactory');
          setTreatmentStatus(summary.treatment_during_stay || 'Please select');
          setReviewDate(summary.review_on_date ? format(new Date(summary.review_on_date), 'yyyy-MM-dd') : '2025-09-26');
          setResidentOnDischarge(summary.resident_on_discharge || 'Please select');
          setEnableSmsAlert(summary.additional_data?.enable_sms_alert || false);

          // Update patient info
          setPatientInfo(prev => ({
            ...prev,
            otherConsultants: summary.other_consultants || '',
            reasonOfDischarge: summary.reason_of_discharge || 'Please select'
          }));
        }

        // Populate medications
        if (medications && medications.length > 0) {
          const formattedMedications = medications.map((med, index) => ({
            id: (index + 1).toString(),
            name: med.name || '',
            unit: med.unit || '',
            remark: med.remark || '',
            route: med.route || 'Select',
            dose: med.dose || 'Select',
            quantity: med.quantity || '',
            days: med.days || '0',
            startDate: med.start_date || '',
            timing: med.timing || { morning: false, afternoon: false, evening: false, night: false },
            isSos: med.is_sos || false
          }));

          setMedicationRows(formattedMedications);
          console.log('💊 Populated', formattedMedications.length, 'medications');
        }

        // Populate examination data
        if (examination) {
          setExamination({
            temp: examination.temperature || '',
            pr: examination.pulse_rate || '',
            rr: examination.respiratory_rate || '',
            bp: examination.blood_pressure || '',
            spo2: examination.spo2 || '',
            details: examination.examination_details || ''
          });
          console.log('🔍 Populated examination data');
        }

        // Populate surgery details
        if (surgery) {
          setSurgeryDetails({
            date: surgery.surgery_date ? format(new Date(surgery.surgery_date), "yyyy-MM-dd'T'HH:mm") : '',
            procedurePerformed: surgery.procedure_performed || '',
            surgeon: surgery.surgeon || '',
            anesthetist: surgery.anesthetist || '',
            anesthesia: surgery.anesthesia_type || '',
            implant: surgery.implant || '',
            description: surgery.description || ''
          });
          console.log('🏥 Populated surgery details');
        }

        console.log('✅ Form populated with existing discharge summary data');

      } catch (error) {
        console.error('❌ Error populating form with existing data:', error);
      }
    }
  }, [existingDischargeSummary]);


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

  // Template management functions
  const addNewTemplate = () => {
    if (newTemplateName.trim() && newTemplateContent.trim()) {
      const newTemplate = {
        name: newTemplateName.trim(),
        content: newTemplateContent.trim()
      };
      setStayNotesTemplates([...stayNotesTemplates, newTemplate]);
      setNewTemplateName('');
      setNewTemplateContent('');
      setShowAddTemplate(false);
      toast({
        title: "Success",
        description: "Template added successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const editTemplate = (index: number) => {
    setEditingTemplateIndex(index);
    setEditingTemplateName(stayNotesTemplates[index].name);
    setEditingTemplateContent(stayNotesTemplates[index].content);
  };

  const saveEditTemplate = () => {
    if (editingTemplateIndex !== null && editingTemplateName.trim() && editingTemplateContent.trim()) {
      const updatedTemplates = [...stayNotesTemplates];
      updatedTemplates[editingTemplateIndex] = {
        name: editingTemplateName.trim(),
        content: editingTemplateContent.trim()
      };
      setStayNotesTemplates(updatedTemplates);
      setEditingTemplateIndex(null);
      setEditingTemplateName('');
      setEditingTemplateContent('');
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const cancelEditTemplate = () => {
    setEditingTemplateIndex(null);
    setEditingTemplateName('');
    setEditingTemplateContent('');
  };

  const deleteTemplate = (index: number) => {
    const updatedTemplates = stayNotesTemplates.filter((_, i) => i !== index);
    setStayNotesTemplates(updatedTemplates);
    toast({
      title: "Success",
      description: "Template deleted successfully",
    });
  };

  const moveTemplateUp = (index: number) => {
    if (index > 0) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index], updatedTemplates[index - 1]] = [updatedTemplates[index - 1], updatedTemplates[index]];
      setStayNotesTemplates(updatedTemplates);
    }
  };

  const moveTemplateDown = (index: number) => {
    if (index < stayNotesTemplates.length - 1) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index], updatedTemplates[index + 1]] = [updatedTemplates[index + 1], updatedTemplates[index]];
      setStayNotesTemplates(updatedTemplates);
    }
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

      console.log('💾 Starting IPD discharge summary save process...');
      console.log('📋 Patient Data:', patientData);
      console.log('🔍 Visit ID (string):', visitId);

      // 1. Get visit and patient UUIDs
      let visitUUID = patientData.id;
      let patientUUID = patientData.patients?.id;

      console.log('🆔 Initial UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);

      if (!visitUUID) {
        console.log('⚠️ No visitUUID found, querying visits table...');
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id, patient_id')
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('❌ Error fetching visit data:', visitError);
          throw new Error(`Could not find visit record: ${visitError.message}`);
        }

        visitUUID = visitData?.id;
        patientUUID = visitData?.patient_id;
        console.log('✅ Fetched UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);
      }

      // Validate required UUIDs
      if (!visitUUID || !patientUUID) {
        const errorMsg = `Missing required IDs - Visit UUID: ${visitUUID}, Patient UUID: ${patientUUID}`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate required fields
      if (!patientInfo.name) {
        throw new Error('Patient name is required');
      }
      if (!patientInfo.doa) {
        throw new Error('Admission date is required');
      }

      // Helper function to convert empty strings to null for date fields
      const formatDate = (dateValue: any) => {
        if (!dateValue || dateValue === '' || dateValue === 'Invalid Date') {
          return null;
        }
        return dateValue;
      };

      // 2. Prepare discharge summary data matching the actual database schema
      const dischargeData = {
        // Foreign keys - use UUIDs as per schema
        visit_id: visitUUID,
        patient_id: patientUUID,

        // Basic patient info (required fields)
        patient_name: patientInfo.name,
        reg_id: patientInfo.regId || null,
        address: patientInfo.address || null,
        age_sex: patientInfo.ageSex || null,

        // Dates - admission_date is required NOT NULL, others can be null
        admission_date: formatDate(patientInfo.doa),
        date_of_discharge: formatDate(patientInfo.dateOfDischarge),

        // Consultants
        treating_consultant: patientInfo.treatingConsultant || null,
        other_consultants: patientInfo.otherConsultants || null,
        reason_of_discharge: patientInfo.reasonOfDischarge || null,
        corporate_type: patientInfo.corporateType || null,

        // Medical data - using correct schema column names
        primary_diagnosis: diagnosis || null,
        ot_notes: stayNotes || null,
        chief_complaints: caseSummaryPresentingComplaints || null,
        discharge_advice: advice || null,

        // Treatment info - using correct schema column names
        condition_on_discharge: treatmentCondition || null,
        treatment_during_stay: treatmentStatus || null,
        review_on_date: formatDate(reviewDate),
        resident_on_discharge: residentOnDischarge || null,

        // Store investigations in JSONB column
        lab_investigations: {
          investigations_text: investigations
        },

        // Examination data in vital_signs JSONB column
        vital_signs: {
          temperature: examination.temp,
          pulse_rate: examination.pr,
          respiratory_rate: examination.rr,
          blood_pressure: examination.bp,
          spo2: examination.spo2,
          examination_details: examination.details
        },

        // Medications in discharge_medications JSONB column
        discharge_medications: medicationRows.map(med => ({
          name: med.name,
          unit: med.unit,
          dose: med.dose,
          quantity: med.quantity,
          days: med.days,
          route: med.route,
          timing: med.timing,
          is_sos: med.isSos,
          remark: med.remark
        })),

        // Surgery details in procedures_performed JSONB column
        procedures_performed: {
          surgery_date: surgeryDetails.date,
          procedure_performed: surgeryDetails.procedurePerformed,
          surgeon: surgeryDetails.surgeon,
          anesthetist: surgeryDetails.anesthetist,
          anesthesia_type: surgeryDetails.anesthesia,
          implant: surgeryDetails.implant,
          description: surgeryDetails.description
        },

        // Store original visit_id string in additional_data for reference
        additional_data: {
          visit_id_string: visitId,
          enable_sms_alert: enableSmsAlert
        }
      };

      console.log('💾 Saving IPD discharge summary with data:', JSON.stringify(dischargeData, null, 2));

      // 3. Check if a discharge summary already exists for this visit
      const { data: existingRecord } = await supabase
        .from('ipd_discharge_summary')
        .select('id')
        .eq('visit_id', visitUUID)
        .maybeSingle();

      let dischargeSummary, summaryError;

      if (existingRecord) {
        // Update existing record
        console.log('📝 Updating existing discharge summary:', existingRecord.id);
        const result = await supabase
          .from('ipd_discharge_summary')
          .update(dischargeData)
          .eq('id', existingRecord.id)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      } else {
        // Insert new record
        console.log('➕ Inserting new discharge summary');
        const result = await supabase
          .from('ipd_discharge_summary')
          .insert(dischargeData)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      }

      if (summaryError) {
        console.error('❌ Supabase Error Details:', {
          message: summaryError.message,
          details: summaryError.details,
          hint: summaryError.hint,
          code: summaryError.code
        });
        throw new Error(`Database error: ${summaryError.message}${summaryError.hint ? ' - ' + summaryError.hint : ''}`);
      }

      console.log('✅ IPD discharge summary saved successfully:', dischargeSummary.id);
      console.log('📋 Summary contains:', {
        medications: medicationRows.length,
        investigations: investigations.length,
        diagnosis: diagnosis ? 'Yes' : 'No',
        stay_notes: stayNotes ? 'Yes' : 'No'
      });

      console.log('🎉 IPD discharge summary saved to database successfully!');

      toast({
        title: "Success",
        description: "Discharge summary saved successfully!",
      });

    } catch (error) {
      console.error('❌ Error saving discharge summary:', error);
      toast({
        title: "Error",
        description: `Failed to save discharge summary: ${error.message}`,
      });
    }
  };

  const handlePrintPreview = async () => {
    try {
      toast({
        title: "Generating Print Preview",
        description: "Loading discharge summary for printing...",
      });

      console.log('🖨️ Fetching data for print preview...');

      // Get visit UUID
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (!visitData?.id) {
        toast({
          title: "Error",
          description: "Visit not found",
          variant: "destructive"
        });
        return;
      }

      // Fetch discharge summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('ipd_discharge_summary')
        .select('*')
        .eq('visit_id', visitData.id)
        .single();

      if (summaryError || !summaryData) {
        toast({
          title: "Error",
          description: "No discharge summary found. Please save first.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Summary data loaded for print:', summaryData);

      // Generate print HTML
      const printHTML = generatePrintHTML(summaryData, patientInfo);

      // Open print preview in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toast({
          title: "Success",
          description: "Print preview opened successfully!",
        });
      }

    } catch (error) {
      console.error('❌ Print preview error:', error);
      toast({
        title: "Error",
        description: `Failed to generate print preview: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to generate formatted print HTML
  const generatePrintHTML = (summaryData: any, patientInfo: any) => {
    const currentDate = format(new Date(), 'dd/MM/yyyy');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Discharge Summary - ${patientInfo.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .patient-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      border: 1px solid #000;
      padding: 10px;
      margin-bottom: 15px;
    }

    .patient-grid-item {
      display: flex;
      font-size: 10pt;
    }

    .patient-grid-item strong {
      min-width: 120px;
      font-weight: bold;
    }

    .section {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }

    .section-title {
      font-weight: bold;
      font-size: 12pt;
      background-color: #f0f0f0;
      padding: 5px 10px;
      border-left: 4px solid #333;
      margin-bottom: 8px;
    }

    .section-content {
      padding-left: 10px;
      text-align: justify;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th {
      background-color: #e0e0e0;
      font-weight: bold;
      padding: 6px;
      text-align: left;
    }

    td {
      padding: 6px;
    }

    .footer {
      margin-top: 30px;
      border-top: 1px solid #000;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
    }

    .emergency-note {
      text-align: center;
      font-weight: bold;
      margin-top: 20px;
      padding: 10px;
      border: 2px solid #000;
      background-color: #fff3cd;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Discharge Summary</h1>
  </div>

  <div class="patient-grid">
    <div class="patient-grid-item">
      <strong>Name:</strong>
      <span>${patientInfo.name}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Patient ID:</strong>
      <span>${summaryData.reg_id || patientInfo.regId}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Primary Care Provider:</strong>
      <span>${summaryData.treating_consultant || patientInfo.treatingConsultant}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Registration ID:</strong>
      <span>${summaryData.reg_id || patientInfo.regId}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Age/Gender:</strong>
      <span>${patientInfo.ageSex}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Address:</strong>
      <span>${summaryData.address || patientInfo.address}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Tariff:</strong>
      <span>${summaryData.corporate_type || patientInfo.corporateType || 'Private'}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Discharge Date:</strong>
      <span>${summaryData.date_of_discharge ? format(new Date(summaryData.date_of_discharge), 'dd/MM/yyyy') : currentDate}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Admission Date:</strong>
      <span>${summaryData.admission_date ? format(new Date(summaryData.admission_date), 'dd/MM/yyyy') : ''}</span>
    </div>
    <div class="patient-grid-item">
      <strong>Discharge Protocol:</strong>
      <span>${summaryData.reason_of_discharge || 'GAMA'}</span>
    </div>
  </div>

  ${summaryData.condition_on_discharge ? `
  <div class="section">
    <div class="section-title">Present Condition</div>
    <div class="section-content">${summaryData.condition_on_discharge}</div>
  </div>
  ` : ''}

  ${summaryData.primary_diagnosis ? `
  <div class="section">
    <div class="section-title">DIAGNOSIS:</div>
    <div class="section-content">${summaryData.primary_diagnosis}</div>
  </div>
  ` : ''}

  ${summaryData.discharge_medications && summaryData.discharge_medications.length > 0 ? `
  <div class="section">
    <div class="section-title">MEDICATION:</div>
    <div class="section-content">
      <p style="margin-bottom: 5px;">Following table represents the medication prescribed to the patient on discharge:</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Strength</th>
            <th>Route</th>
            <th>Dosage</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          ${summaryData.discharge_medications.map(med => `
            <tr>
              <td>${med.name || ''}</td>
              <td>${med.dose || ''}</td>
              <td>${med.route || 'IV'}</td>
              <td>${formatMedicationTiming(med.timing)}</td>
              <td>${med.days || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  ${summaryData.chief_complaints ? `
  <div class="section">
    <div class="section-title">CLINICAL COURSE:</div>
    <div class="section-content">${summaryData.chief_complaints}</div>
  </div>
  ` : ''}

  ${summaryData.treatment_during_stay ? `
  <div class="section">
    <div class="section-title">DISCHARGE INSTRUCTION:</div>
    <div class="section-content">${summaryData.treatment_during_stay}</div>
  </div>
  ` : ''}

  ${summaryData.ot_notes ? `
  <div class="section">
    <div class="section-title">IMPORTANT:</div>
    <div class="section-content">${summaryData.ot_notes.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${summaryData.discharge_advice ? `
  <div class="section">
    <div class="section-title">ADVICE:</div>
    <div class="section-content">${summaryData.discharge_advice.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${summaryData.lab_investigations?.investigations_text ? `
  <div class="section">
    <div class="section-title">INVESTIGATIONS:</div>
    <div class="section-content">${summaryData.lab_investigations.investigations_text.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}

  ${summaryData.review_on_date ? `
  <div class="section">
    <div class="section-title">Review on:</div>
    <div class="section-content">
      <strong>Reviewed On Discharge:</strong> ${format(new Date(summaryData.review_on_date), 'dd/MM/yyyy')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>
      <strong>Date:</strong> ${currentDate}
    </div>
    <div style="text-align: right;">
      <strong>${summaryData.treating_consultant || 'Dr. Amod Shirode (IMS Residence)'}</strong>
    </div>
  </div>

  <div class="emergency-note">
    <strong>Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.</strong>
  </div>

  <script>
    // Helper function to format medication timing
    function formatMedicationTiming(timing) {
      if (!timing) return '';
      const times = [];
      if (timing.morning) times.push('सुबह (Morning)');
      if (timing.afternoon) times.push('दोपहर (Afternoon)');
      if (timing.evening) times.push('शाम (Evening)');
      if (timing.night) times.push('रात (Night)');
      return times.join(', ') || '';
    }
  </script>
</body>
</html>
    `;
  };

  // Helper function to format medication timing for print
  const formatMedicationTiming = (timing: any) => {
    if (!timing) return '';
    const times = [];
    if (timing.morning) times.push('सुबह (Morning)');
    if (timing.afternoon) times.push('दोपहर (Afternoon)');
    if (timing.evening) times.push('शाम (Evening)');
    if (timing.night) times.push('रात (Night)');
    return times.join(', ') || '';
  };

  // Function to fetch all discharge summary data and display in textbox
  const handleFetchDischargeSummaryData = async () => {
    try {
      toast({
        title: "Fetching Data",
        description: "Loading discharge summary data from database...",
      });

      console.log('📥 Fetching discharge summary data for visit:', visitId);

      // Get visit UUID from string visit_id
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (!visitData?.id) {
        toast({
          title: "Error",
          description: "Visit not found",
          variant: "destructive"
        });
        return;
      }

      // Get discharge summary from ipd_discharge_summary table
      const { data: summaryData, error: summaryError } = await supabase
        .from('ipd_discharge_summary')
        .select('*')
        .eq('visit_id', visitData.id)
        .single();

      if (summaryError) {
        if (summaryError.code === 'PGRST116') {
          toast({
            title: "No Data Found",
            description: "No saved discharge summary found for this patient",
            variant: "destructive"
          });
        } else {
          throw summaryError;
        }
        return;
      }

      console.log('✅ Found discharge summary data:', summaryData);

      // Format all data into a readable text format for the textbox
      let formattedText = '';

      // Diagnosis
      if (summaryData.primary_diagnosis) {
        formattedText += `DIAGNOSIS:\n${summaryData.primary_diagnosis}\n\n`;
      }

      // Investigations
      if (summaryData.lab_investigations?.investigations_text) {
        formattedText += `INVESTIGATIONS:\n${summaryData.lab_investigations.investigations_text}\n\n`;
      }

      // Case Summary Presenting Complaints
      if (summaryData.chief_complaints) {
        formattedText += `CASE SUMMARY / PRESENTING COMPLAINTS:\n${summaryData.chief_complaints}\n\n`;
      }

      // Advice
      if (summaryData.discharge_advice) {
        formattedText += `ADVICE:\n${summaryData.discharge_advice}\n\n`;
      }

      // Examination / Vital Signs
      if (summaryData.vital_signs) {
        formattedText += `EXAMINATION / VITAL SIGNS:\n`;
        if (summaryData.vital_signs.temperature) formattedText += `Temperature: ${summaryData.vital_signs.temperature}°F\n`;
        if (summaryData.vital_signs.pulse_rate) formattedText += `Pulse Rate: ${summaryData.vital_signs.pulse_rate}/min\n`;
        if (summaryData.vital_signs.respiratory_rate) formattedText += `Respiratory Rate: ${summaryData.vital_signs.respiratory_rate}/min\n`;
        if (summaryData.vital_signs.blood_pressure) formattedText += `Blood Pressure: ${summaryData.vital_signs.blood_pressure} mmHg\n`;
        if (summaryData.vital_signs.spo2) formattedText += `SpO2: ${summaryData.vital_signs.spo2}%\n`;
        if (summaryData.vital_signs.examination_details) formattedText += `Details: ${summaryData.vital_signs.examination_details}\n`;
        formattedText += '\n';
      }

      // Medications (Treatment on Discharge)
      if (summaryData.discharge_medications && Array.isArray(summaryData.discharge_medications) && summaryData.discharge_medications.length > 0) {
        formattedText += `MEDICATIONS (TREATMENT ON DISCHARGE):\n`;
        summaryData.discharge_medications.forEach((med, index) => {
          formattedText += `${index + 1}. ${med.name || 'N/A'}`;
          if (med.dose) formattedText += ` - ${med.dose}`;
          if (med.route) formattedText += ` (${med.route})`;
          if (med.days) formattedText += ` for ${med.days} days`;
          const timings = [];
          if (med.timing?.morning) timings.push('Morning');
          if (med.timing?.afternoon) timings.push('Afternoon');
          if (med.timing?.evening) timings.push('Evening');
          if (med.timing?.night) timings.push('Night');
          if (timings.length > 0) formattedText += ` - ${timings.join(', ')}`;
          if (med.remark) formattedText += ` | Remark: ${med.remark}`;
          formattedText += '\n';
        });
        formattedText += '\n';
      }

      // Surgery Details
      if (summaryData.procedures_performed) {
        formattedText += `SURGERY DETAILS:\n`;
        if (summaryData.procedures_performed.surgery_date) {
          formattedText += `Date: ${format(new Date(summaryData.procedures_performed.surgery_date), 'dd-MM-yyyy HH:mm')}\n`;
        }
        if (summaryData.procedures_performed.procedure_performed) {
          formattedText += `Procedure: ${summaryData.procedures_performed.procedure_performed}\n`;
        }
        if (summaryData.procedures_performed.surgeon) {
          formattedText += `Surgeon: ${summaryData.procedures_performed.surgeon}\n`;
        }
        if (summaryData.procedures_performed.anesthetist) {
          formattedText += `Anesthetist: ${summaryData.procedures_performed.anesthetist}\n`;
        }
        if (summaryData.procedures_performed.anesthesia_type) {
          formattedText += `Anesthesia: ${summaryData.procedures_performed.anesthesia_type}\n`;
        }
        if (summaryData.procedures_performed.implant) {
          formattedText += `Implant: ${summaryData.procedures_performed.implant}\n`;
        }
        if (summaryData.procedures_performed.description) {
          formattedText += `Description: ${summaryData.procedures_performed.description}\n`;
        }
        formattedText += '\n';
      }

      // Display formatted text in the newTemplateContent textarea
      setNewTemplateContent(formattedText);

      toast({
        title: "Success",
        description: "Discharge summary data loaded successfully!",
      });

      console.log('✅ Discharge summary data formatted and displayed');

    } catch (error) {
      console.error('❌ Error fetching discharge summary data:', error);
      toast({
        title: "Error",
        description: `Failed to fetch data: ${error.message}`,
        variant: "destructive"
      });
    }
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

      // Try with visit_id_string first, fallback to visit_id if column doesn't exist
      let data, error;

      try {
        const result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            visit_id_string,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at
          `)
          .or(`visit_id_string.eq.${visitId},visit_id.eq.${visitId}`)
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      } catch (columnError) {
        console.log('🔄 visit_id_string column not found, using visit_id fallback');

        // Fallback: query without visit_id_string column
        const result = await supabase
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

        data = result.data;
        error = result.error;
      }

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
      <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
      </form>
    );
  };

  // Show error if patient data not found, but provide working fallback form
  if (!patientData && !isPatientLoading && patientError) {
    return renderFallbackForm();
  }

  return (
    <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
          <CardTitle className="flex items-center justify-between">
            <span>Diagnosis</span>
            {isDiagnosisLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Loading diagnosis data...
              </div>
            )}
            {visitDiagnosisData && visitDiagnosisData.length > 0 && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {visitDiagnosisData.length} Diagnosis(es) Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnosis Details:</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis details..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Case Summary Presenting Complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Case Summary Presenting Complaints:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={caseSummaryPresentingComplaints}
            onChange={(e) => setCaseSummaryPresentingComplaints(e.target.value)}
            placeholder="Enter case summary and presenting complaints..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Advice */}
      <Card>
        <CardHeader>
          <CardTitle>Advice:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Enter discharge advice..."
            className="min-h-[120px]"
          />
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
                    <td className="border border-gray-300 px-1 py-1 relative">
                      <div className="relative">
                        <Input
                          value={row.name}
                          onChange={(e) => {
                            updateMedicationRow(row.id, 'name', e.target.value);
                            setMedicationSearchTerm(e.target.value);
                            setActiveSearchRowId(row.id);
                          }}
                          onFocus={() => setActiveSearchRowId(row.id)}
                          onBlur={() => setTimeout(() => setActiveSearchRowId(null), 300)}
                          className="border-0 focus:ring-0 text-sm"
                          placeholder="Search medicine name..."
                        />
                        {medicationSearchTerm.length >= 2 && availableMedications.length > 0 && activeSearchRowId === row.id && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {availableMedications.map((medication) => (
                              <div
                                key={medication.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur event
                                  const medicationName = medication.name + (medication.strength ? ` ${medication.strength}` : '');
                                  updateMedicationRow(row.id, 'name', medicationName);
                                  setMedicationSearchTerm('');
                                  setActiveSearchRowId(null);
                                }}
                              >
                                <div className="font-medium text-gray-900">{medication.name}</div>
                                {medication.strength && (
                                  <div className="text-xs text-gray-500">Strength: {medication.strength}</div>
                                )}
                                {medication.generic_name && (
                                  <div className="text-xs text-gray-500">Generic: {medication.generic_name}</div>
                                )}
                                {medication.manufacturer && (
                                  <div className="text-xs text-gray-400">Mfg: {medication.manufacturer}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                          <SelectItem value="PO">PO</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="IM">IM</SelectItem>
                          <SelectItem value="S/C">S/C</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="P/V">P/V</SelectItem>
                          <SelectItem value="R.T">R.T</SelectItem>
                          <SelectItem value="LA">LA</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Sublingual">Sublingual</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
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
                          <SelectItem value="SOS">SOS</SelectItem>
                          <SelectItem value="OD">OD</SelectItem>
                          <SelectItem value="BD">BD</SelectItem>
                          <SelectItem value="TDS">TDS</SelectItem>
                          <SelectItem value="QID">QID</SelectItem>
                          <SelectItem value="HS">HS</SelectItem>
                          <SelectItem value="Twice a week">Twice a week</SelectItem>
                          <SelectItem value="Once a week">Once a week</SelectItem>
                          <SelectItem value="Once fort nightly">Once fort nightly</SelectItem>
                          <SelectItem value="Once a month">Once a month</SelectItem>
                          <SelectItem value="A/D">A/D</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                          <SelectItem value="1/2">1/2</SelectItem>
                          <SelectItem value="1/4">1/4</SelectItem>
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
                            <SelectTrigger className="border-0 focus:ring-0 text-xs h-6 w-16">
                              <SelectValue placeholder={timing} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1AM">1AM</SelectItem>
                              <SelectItem value="2AM">2AM</SelectItem>
                              <SelectItem value="3AM">3AM</SelectItem>
                              <SelectItem value="4AM">4AM</SelectItem>
                              <SelectItem value="5AM">5AM</SelectItem>
                              <SelectItem value="6AM">6AM</SelectItem>
                              <SelectItem value="7AM">7AM</SelectItem>
                              <SelectItem value="8AM">8AM</SelectItem>
                              <SelectItem value="9AM">9AM</SelectItem>
                              <SelectItem value="10AM">10AM</SelectItem>
                              <SelectItem value="11AM">11AM</SelectItem>
                              <SelectItem value="12AM">12AM</SelectItem>
                              <SelectItem value="1PM">1PM</SelectItem>
                              <SelectItem value="2PM">2PM</SelectItem>
                              <SelectItem value="3PM">3PM</SelectItem>
                              <SelectItem value="4PM">4PM</SelectItem>
                              <SelectItem value="5PM">5PM</SelectItem>
                              <SelectItem value="6PM">6PM</SelectItem>
                              <SelectItem value="7PM">7PM</SelectItem>
                              <SelectItem value="8PM">8PM</SelectItem>
                              <SelectItem value="9PM">9PM</SelectItem>
                              <SelectItem value="10PM">10PM</SelectItem>
                              <SelectItem value="11PM">11PM</SelectItem>
                              <SelectItem value="12PM">12PM</SelectItem>
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

      {/* Surgery Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Surgery Details</span>
            {(isSurgeryLoading || isOtNotesLoading) && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                {isSurgeryLoading && isOtNotesLoading ? 'Loading surgery & OT data...' :
                 isSurgeryLoading ? 'Loading surgery data...' :
                 'Loading OT notes...'}
              </div>
            )}
            {visitSurgeryData && visitSurgeryData.length > 0 && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {visitSurgeryData.length} Surgery(s) Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date:</Label>
              <Input
                type="datetime-local"
                value={surgeryDetails.date}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, date: e.target.value})}
                placeholder="Select date and time"
              />
            </div>
            <div className="space-y-2">
              <Label>Procedure Performed:</Label>
              <Input
                value={surgeryDetails.procedurePerformed}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, procedurePerformed: e.target.value})}
                placeholder="e.g., Femoral Hernia Repair (427), Hernia Repair (CGHS-003), 2D echocardiography (592)"
                className={visitSurgeryData && visitSurgeryData.length > 0 ? 'bg-green-50 border-green-200' : ''}
                readOnly={isSurgeryLoading}
              />
              {visitSurgeryData && visitSurgeryData.length > 0 && (
                <div className="text-xs text-green-600">
                  ✅ Loaded from billing system
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Surgeon:</Label>
              <Input
                value={surgeryDetails.surgeon}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, surgeon: e.target.value})}
                placeholder="Enter surgeon name"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Anesthetist:</Label>
              <Input
                value={surgeryDetails.anesthetist}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, anesthetist: e.target.value})}
                placeholder="Enter anesthetist name"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
                readOnly={isSurgeryLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Anesthesia:</Label>
              <Input
                value={surgeryDetails.anesthesia}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, anesthesia: e.target.value})}
                placeholder="Enter anesthesia type"
                className={isSurgeryLoading ? 'bg-gray-50' : ''}
                readOnly={isSurgeryLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Implant:</Label>
              <Input
                value={surgeryDetails.implant}
                onChange={(e) => setSurgeryDetails({...surgeryDetails, implant: e.target.value})}
                placeholder="e.g., asssssassax or N/A if no implant"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description:</Label>
              <Button
                size="sm"
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                🤖 AI Generate
              </Button>
            </div>
            <Textarea
              value={surgeryDetails.description}
              onChange={(e) => setSurgeryDetails({...surgeryDetails, description: e.target.value})}
              placeholder={`**Surgical Operation Record**

**Patient Information:**
- Name: USA
- Age: 25
- Gender: Male

**Date of Surgery:** September 25, 2025

Enter surgical procedure description here...`}
              className="min-h-[150px]"
            />
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
                <div className="flex justify-end mb-2">
                  <Button
                    onClick={() => setShowAddTemplate(!showAddTemplate)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                  >
                    {showAddTemplate ? 'Cancel' : 'Add'}
                  </Button>
                </div>

                {/* Collapsible Add New Template */}
                {showAddTemplate && (
                  <div className="mb-2 p-3 border rounded bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-sm font-medium mb-2 block">Add New Template:</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Template name..."
                        className="text-sm"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        autoFocus
                      />
                      <Textarea
                        placeholder="Template content..."
                        className="text-sm min-h-[60px]"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={addNewTemplate}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                        >
                          Add Template
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddTemplate(false);
                            setNewTemplateName('');
                            setNewTemplateContent('');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Label>Favorite Templates:</Label>
                <div className="border rounded p-2 h-48 overflow-y-auto bg-cyan-50">
                  {stayNotesTemplates.map((template, index) => {
                    const isEditing = editingTemplateIndex === index;

                    return (
                      <div key={index} className="p-2 hover:bg-white hover:shadow-sm rounded mb-2 border-b border-gray-100 last:border-b-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingTemplateName}
                              onChange={(e) => setEditingTemplateName(e.target.value)}
                              className="text-sm h-8 font-medium"
                              placeholder="Template name..."
                              autoFocus
                            />
                            <Textarea
                              value={editingTemplateContent}
                              onChange={(e) => setEditingTemplateContent(e.target.value)}
                              className="text-sm min-h-[60px]"
                              placeholder="Template content..."
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={saveEditTemplate}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditTemplate}
                                size="sm"
                                variant="outline"
                                className="text-xs flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 cursor-pointer" onClick={() => {
                                // Build patient details context
                                let patientContext = `\n\nPATIENT DETAILS:\n`;
                                patientContext += `Name: ${patientInfo.name}\n`;
                                patientContext += `Reg ID: ${patientInfo.regId}\n`;
                                patientContext += `Age/Sex: ${patientInfo.ageSex}\n`;
                                patientContext += `Address: ${patientInfo.address}\n`;
                                patientContext += `Admission Date: ${patientInfo.doa}\n`;
                                patientContext += `Discharge Date: ${patientInfo.dateOfDischarge}\n`;
                                patientContext += `Treating Consultant: ${patientInfo.treatingConsultant}\n`;
                                if (patientInfo.corporateType) patientContext += `Corporate Type: ${patientInfo.corporateType}\n`;

                                // Add diagnosis if available
                                if (diagnosis) {
                                  patientContext += `\nDIAGNOSIS:\n${diagnosis}\n`;
                                }

                                // Add investigations if available
                                if (investigations) {
                                  patientContext += `\nINVESTIGATIONS:\n${investigations}\n`;
                                }

                                // Add surgery details if available
                                if (surgeryDetails.procedurePerformed) {
                                  patientContext += `\nSURGERY PERFORMED:\n`;
                                  patientContext += `Procedure: ${surgeryDetails.procedurePerformed}\n`;
                                  if (surgeryDetails.surgeon) patientContext += `Surgeon: ${surgeryDetails.surgeon}\n`;
                                  if (surgeryDetails.anesthetist) patientContext += `Anesthetist: ${surgeryDetails.anesthetist}\n`;
                                  if (surgeryDetails.date) patientContext += `Date: ${surgeryDetails.date}\n`;
                                }

                                // Add the template content with patient context to newTemplateContent textbox (above Fetch Data button)
                                // Preserve existing content if any
                                setNewTemplateContent(prev => {
                                  const newContent = template.content + patientContext;
                                  // If there's already content, append with separator, otherwise just set new content
                                  return prev ? prev + '\n\n---\n\n' + newContent : newContent;
                                });
                              }}>
                                <div className="text-sm font-medium text-gray-800 mb-1">{template.name}</div>
                                <div className="text-xs text-gray-600 line-clamp-2">{template.content}</div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <Button
                                  onClick={() => editTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                  title="Edit template"
                                >
                                  ✏️
                                </Button>
                                <Button
                                  onClick={() => deleteTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  title="Delete template"
                                >
                                  🗑️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateUp(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === 0}
                                  title="Move up"
                                >
                                  ⬆️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateDown(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === stayNotesTemplates.length - 1}
                                  title="Move down"
                                >
                                  ⬇️
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Choose from above or type here..."
                    className="min-h-[80px] text-sm"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!newTemplateContent.trim()) {
                          toast({
                            title: "Error",
                            description: "Please add content to send to ChatGPT",
                            variant: "destructive"
                          });
                          return;
                        }

                        try {
                          toast({
                            title: "Processing",
                            description: "Sending request to ChatGPT...",
                          });

                          console.log('🤖 Sending to ChatGPT:', newTemplateContent);

                          // Call OpenAI API
                          const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                            },
                            body: JSON.stringify({
                              model: 'gpt-4',
                              messages: [
                                {
                                  role: 'user',
                                  content: newTemplateContent
                                }
                              ],
                              temperature: 0.7,
                              max_tokens: 2000
                            })
                          });

                          if (!response.ok) {
                            throw new Error(`OpenAI API error: ${response.statusText}`);
                          }

                          const data = await response.json();
                          const generatedSummary = data.choices[0]?.message?.content;

                          if (generatedSummary) {
                            // Display generated summary in Stay Notes box
                            setStayNotes(generatedSummary);

                            toast({
                              title: "Success",
                              description: "Discharge summary generated successfully!",
                            });

                            console.log('✅ Generated Summary:', generatedSummary);
                          } else {
                            throw new Error('No response from ChatGPT');
                          }

                        } catch (error) {
                          console.error('❌ ChatGPT Error:', error);
                          toast({
                            title: "Error",
                            description: `Failed to generate summary: ${error.message}`,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Message chat GPT as
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleFetchDischargeSummaryData}
                    >
                      Fetch Data
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stay Notes:</Label>
                <Textarea
                  value={stayNotes}
                  onChange={(e) => setStayNotes(e.target.value)}
                  className="min-h-[280px]"
                />
              </div>
            </div>
          </div>
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
    </form>
  );
};

export default IpdDischargeSummary;