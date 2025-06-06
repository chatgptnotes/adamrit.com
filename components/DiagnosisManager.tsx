"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  X,
  AlertTriangle,
  Package,
  Stethoscope,
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  Save,
  Receipt,
  Edit2,
  Trash2,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import EditBillingModal from "@/components/EditBillingModal";

// Types
interface Diagnosis {
  id: string;
  name: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}

interface Package {
  id: string;
  name: string;
  code: string;
  amount: string;
  complication1?: string;
  complication2?: string;
}

interface Complication {
  id: number;
  complication_code: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  category: string;
  is_active: boolean;
}

interface PatientDiagnosis {
  id: number;
  diagnosis: Diagnosis;
  status: 'active' | 'resolved' | 'chronic';
  diagnosed_date: string;
  notes: string;
}

interface PatientComplication {
  id: number;
  complication: Complication;
  diagnosis_id?: number;
  status: 'active' | 'resolved' | 'monitoring';
  occurred_date: string;
  notes: string;
}

interface DiagnosisManagerProps {
  patientUniqueId: string;
  visitId?: string;
  onDiagnosesChange?: (diagnoses: PatientDiagnosis[]) => void;
}

type CghsSurgeryComplication = {
  id: number;
  name?: string;
  complication_name?: string;
  inv1?: string;
  inv2?: string;
  inv3?: string;
  inv4?: string;
  med1?: string;
  med2?: string;
  med3?: string;
  med4?: string;
  // add any other fields you use
};

export function DiagnosisManager({ patientUniqueId, visitId, onDiagnosesChange }: DiagnosisManagerProps) {
  // State management
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [surgeries, setSurgeries] = useState<Package[]>([]);
  const [complications, setComplications] = useState<Complication[]>([]);
  const [relatedComplications, setRelatedComplications] = useState<Complication[]>([]);
  
  const [patientDiagnoses, setPatientDiagnoses] = useState<PatientDiagnosis[]>([]);
  const [patientComplications, setPatientComplications] = useState<PatientComplication[]>([]);
  const [selectedSurgeries, setSelectedSurgeries] = useState<Package[]>([]);
  
  // Search and selection states
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [surgerySearch, setSurgerySearch] = useState('');
  const [complicationSearch, setComplicationSearch] = useState('');
  const [showDiagnosisResults, setShowDiagnosisResults] = useState(false);
  const [showSurgeryResults, setShowSurgeryResults] = useState(false);
  const [showComplicationResults, setShowComplicationResults] = useState(false);
  
  // Dialog states
  const [showAddDiagnosisDialog, setShowAddDiagnosisDialog] = useState(false);
  const [showAddSurgeryDialog, setShowAddSurgeryDialog] = useState(false);
  const [showAddComplicationDialog, setShowAddComplicationDialog] = useState(false);
  
  // Billing state
  const [billingId, setBillingId] = useState<number | null>(null);
  const [isSavingToBilling, setIsSavingToBilling] = useState(false);
  const [existingBillingRecords, setExistingBillingRecords] = useState<any[]>([]);
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(true);
  
  // Form states
  const [newDiagnosis, setNewDiagnosis] = useState({
    name: '',
    complication1: '',
    complication2: '',
    complication3: '',
    complication4: ''
  });
  
  const [newSurgery, setNewSurgery] = useState({
    surgery_name: '',
    description: '',
    cghs_code: '',
    amount: '',
    category: '',
    duration_days: ''
  });
  
  const [newComplication, setNewComplication] = useState({
    complication_code: '',
    name: '',
    description: '',
    severity: 'mild' as const,
    category: ''
  });

  // Refs for click outside detection
  const diagnosisSearchRef = useRef<HTMLDivElement>(null);
  const surgerySearchRef = useRef<HTMLDivElement>(null);
  const complicationSearchRef = useRef<HTMLDivElement>(null);

  // New states for edit functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // New state for billing details
  const [billingDetails, setBillingDetails] = useState<{ [key: number]: { surgeries: string[], complications: string[] } }>({});

  // Add these states at the top of your component
  const [storedRadiology, setStoredRadiology] = useState<any[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [medicationStartDays, setMedicationStartDays] = useState<{ [key: string]: string }>({});
  const [medicationEndDays, setMedicationEndDays] = useState<{ [key: string]: string }>({});
  // New states for CGHS surgery sections
  const [selectedCghsComplications, setSelectedCghsComplications] = useState<string[]>([]);
  const [cghsComplicationSearch, setCghsComplicationSearch] = useState('');
  const [cghsInvestigationSearch, setCghsInvestigationSearch] = useState('');
  const [cghsMedicationSearch, setCghsMedicationSearch] = useState('');
  const [cghsInvestigationNumbers, setCghsInvestigationNumbers] = useState<{ [key: string]: string }>({});
  // Investigations filter state
  const [investigationType, setInvestigationType] = useState<'radiology' | 'lab' | 'other' | 'all'>('radiology');

  const investigationsList = [
    "ESR", "RA fact", "D1", "Pus C&S", "Blood C&S", "CRP", "CBC", "LFT", "KFT", "Urine R/M", "X-Ray", "MRI", "CT Scan", "D-Dimer", "Procalcitonin", "Ferritin", "LDH"
  ];
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [investigationInputs, setInvestigationInputs] = useState<{ [key: string]: string }>({});

  const handleInvestigationSelect = (inv: string) => {
    setSelectedInvestigations((prev) =>
      prev.includes(inv) ? prev.filter(i => i !== inv) : [...prev, inv]
    );
  };

  const handleInvestigationInputChange = (inv: string, value: string) => {
    setInvestigationInputs((prev) => ({ ...prev, [inv]: value }));
  };

  // Add this state at the top of your component
  const [promptType, setPromptType] = useState('Discharge summary');

  // New state for CGHS surgery complications
  const [cghsSurgeryComplications, setCghsSurgeryComplications] = useState<CghsSurgeryComplication[]>([]);

  // New states for selectable chips
  const [selectedInvestigationChips, setSelectedInvestigationChips] = useState<string[]>([]);
  const [selectedMedicationChips, setSelectedMedicationChips] = useState<string[]>([]);

  // New state for selected diagnosis ID
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<string | number | null>(null);

  // New state for CGHS surgery related complications with investigations and medications
  const [cghsRelatedComplications, setCghsRelatedComplications] = useState<any[]>([]);

  // Add state for selected complications, investigations, and medications and their day ranges for both sections
  const [selectedDiagnosisComplications, setSelectedDiagnosisComplications] = useState<string[]>([]);
  const [diagnosisComplicationDays, setDiagnosisComplicationDays] = useState<{ [key: string]: string }>({});
  const [selectedDiagnosisInvestigations, setSelectedDiagnosisInvestigations] = useState<string[]>([]);
  const [diagnosisInvestigationDays, setDiagnosisInvestigationDays] = useState<{ [key: string]: string }>({});
  const [selectedDiagnosisMedications, setSelectedDiagnosisMedications] = useState<string[]>([]);
  const [diagnosisMedicationDays, setDiagnosisMedicationDays] = useState<{ [key: string]: { start: string, end: string } }>({});

  const [cghsComplicationDays, setCghsComplicationDays] = useState<{ [key: string]: string }>({});
  const [selectedCghsInvestigations, setSelectedCghsInvestigations] = useState<string[]>([]);
  const [cghsInvestigationDays, setCghsInvestigationDays] = useState<{ [key: string]: string }>({});
  const [selectedCghsMedications, setSelectedCghsMedications] = useState<string[]>([]);
  const [cghsMedicationDays, setCghsMedicationDays] = useState<{ [key: string]: { start: string, end: string } }>({});

  // Fetch data on component mount
  useEffect(() => {
    fetchDiagnoses();
    fetchSurgeries();
    fetchComplications();
    fetchPatientData();
    
    // Add sample complications for testing
    const sampleComplications = [
      {
        id: 1,
        complication_code: 'COMP1',
        name: 'sepsis',
        description: 'Blood infection',
        severity: 'severe' as const,
        category: 'Infection',
        is_active: true,
        inv1: 'CBC',
        inv2: 'ESR',
        inv3: 'CRP',
        inv4: 'Blood C&S',
        med1: 'Amoxicillin',
        med2: 'Paracetamol',
        med3: 'Ibuprofen',
        med4: 'Omeprazole'
      },
      {
        id: 2,
        complication_code: 'COMP2',
        name: 'shock',
        description: 'Circulatory failure',
        severity: 'critical' as const,
        category: 'Cardiovascular',
        is_active: true,
        inv1: 'X-Ray',
        inv2: 'MRI',
        inv3: 'CT Scan',
        inv4: 'D-Dimer',
        med1: 'Atorvastatin',
        med2: 'Amlodipine',
        med3: 'Losartan',
        med4: 'Aspirin'
      },
      {
        id: 3,
        complication_code: 'COMP3',
        name: 'respiratory-failure',
        description: 'Breathing difficulty',
        severity: 'severe' as const,
        category: 'Respiratory',
        is_active: true,
        inv1: 'Stool routine',
        inv2: 'Blood Glucose Random',
        inv3: 'Urine R/M',
        inv4: 'LFT',
        med1: 'Ciprofloxacin',
        med2: 'Metformin',
        med3: 'Levothyroxine',
        med4: 'Clopidogrel'
      }
    ];
    
    setRelatedComplications(sampleComplications as any);
  }, [patientUniqueId]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (diagnosisSearchRef.current && !diagnosisSearchRef.current.contains(event.target as Node)) {
        setShowDiagnosisResults(false);
      }
      if (surgerySearchRef.current && !surgerySearchRef.current.contains(event.target as Node)) {
        setShowSurgeryResults(false);
      }
      if (complicationSearchRef.current && !complicationSearchRef.current.contains(event.target as Node)) {
        setShowComplicationResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent component when diagnoses change
  useEffect(() => {
    if (onDiagnosesChange) {
      onDiagnosesChange(patientDiagnoses);
    }
  }, [patientDiagnoses, onDiagnosesChange]);

  // Fetch functions
  const fetchDiagnoses = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnosis')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDiagnoses(data || []);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch diagnoses",
        variant: "destructive"
      });
    }
  };

  const fetchSurgeries = async () => {
    try {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSurgeries(data || []);
    } catch (error) {
      console.error('Error fetching surgeries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch surgeries",
        variant: "destructive"
      });
    }
  };

  const fetchComplications = async () => {
    try {
      const { data, error } = await supabase
        .from('complication')
        .select('*')
        .order('name');
      if (error) {
        console.log('Complications table not available:', error.message);
        setComplications([]);
        return;
      }
      setComplications(data || []);
    } catch (error) {
      console.log('Complications table not yet set up, using empty state');
      setComplications([]);
    }
  };

  const fetchPatientData = async () => {
    setIsLoadingPatientData(true);
    try {
      // Fetch existing billing records for this patient
      const { data: billingData, error: billingError } = await supabase
        .from('patient_billing')
        .select('*')
        .eq('patient_unique_id', patientUniqueId)
        .order('created_at', { ascending: false });

      if (!billingError && billingData && Array.isArray(billingData)) {
        setExistingBillingRecords(billingData);
        console.log(`Found ${billingData.length} billing records for patient`);
      } else {
        console.log('No existing billing records found for patient or billing tables not set up');
        setExistingBillingRecords([]);
      }

      // Fetch patient diagnoses
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('patient_diagnosis')
        .select(`
          *,
          diagnosis:diagnosis(*)
        `)
        .eq('patient_unique_id', patientUniqueId)
        .order('diagnosed_date', { ascending: false });

      if (!diagnosisError && diagnosisData) {
        const formattedDiagnoses: PatientDiagnosis[] = diagnosisData.map(d => ({
          id: d.id,
          diagnosis: d.diagnosis,
          status: d.status,
          diagnosed_date: d.diagnosed_date,
          notes: d.notes
        }));
        setPatientDiagnoses(formattedDiagnoses);
      } else {
        console.log('No diagnoses found for patient or diagnosis tables not set up');
        setPatientDiagnoses([]);
      }

      // Set empty states for surgeries and complications for now
      setSelectedSurgeries([]);
      setPatientComplications([]);

    } catch (error) {
      console.log('Error fetching patient data:', error);
      setExistingBillingRecords([]);
      setPatientDiagnoses([]);
      setSelectedSurgeries([]);
      setPatientComplications([]);
    } finally {
      setIsLoadingPatientData(false);
    }
  };

  // Filter functions for search
  const filteredDiagnoses = diagnoses.filter(diagnosis =>
    diagnosis.name.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  const filteredSurgeries = surgeries.filter(surgery =>
    (surgery.name && surgery.name.toLowerCase().includes(surgerySearch.toLowerCase())) ||
    (surgery.code && surgery.code.toLowerCase().includes(surgerySearch.toLowerCase()))
  );

  const filteredComplications = complications.filter(complication =>
    (complication.name && complication.name.toLowerCase().includes(complicationSearch.toLowerCase())) ||
    (complication.category && complication.category.toLowerCase().includes(complicationSearch.toLowerCase())) ||
    (complication.severity && complication.severity.toLowerCase().includes(complicationSearch.toLowerCase()))
  );

  // Add functions
  const addDiagnosisToPatient = async (diagnosis: Diagnosis) => {
    try {
      // Check if diagnosis already added
      if (patientDiagnoses.find(d => d.diagnosis.id === diagnosis.id)) {
        toast({
          title: "Already added",
          description: "This diagnosis is already in the patient's record",
          variant: "destructive"
        });
        return;
      }

      // Log the data we're trying to insert
      console.log('Attempting to insert diagnosis with data:', {
        patient_unique_id: patientUniqueId,
        diagnosis_id: diagnosis.id,
        status: 'active',
        diagnosed_date: new Date().toISOString().split('T')[0],
        notes: '',
        visit_id: visitId
      });

      // Save to database
      const { data, error } = await supabase
        .from('patient_diagnosis')
        .insert({
          patient_unique_id: patientUniqueId,
          diagnosis_id: diagnosis.id,
          status: 'active',
          diagnosed_date: new Date().toISOString().split('T')[0],
          notes: '',
          visit_id: visitId
        })
        .select(`
          *,
          diagnosis:diagnosis(*)
        `)
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      // Update local state with the saved data
      const newPatientDiagnosis: PatientDiagnosis = {
        id: data.id,
        diagnosis: data.diagnosis,
        status: data.status,
        diagnosed_date: data.diagnosed_date,
        notes: data.notes
      };
      
      setPatientDiagnoses(prev => [newPatientDiagnosis, ...prev]);
      setDiagnosisSearch('');
      setShowDiagnosisResults(false);
      
      // Fetch related complications
      const diagnosisComplications = await fetchRelatedComplications([diagnosis.id]) ?? [];
      // This will now automatically set relatedComplications state
      
      toast({
        title: "Success",
        description: `Added diagnosis: ${diagnosis.name}`
      });
    } catch (error: any) {
      console.error('Error adding diagnosis:', error);
      console.error('Error details:', error?.message || error?.details || JSON.stringify(error));
      
      // More specific error message
      let errorMessage = "Failed to add diagnosis. ";
      if (error?.message?.includes('patient_diagnosis') || error?.code === '42P01') {
        errorMessage += "The patient_diagnosis table doesn't exist yet. Please create it in your database.";
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please check if the patient_diagnosis table exists and has the correct schema.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const addSurgeryToPatient = async (surgery: Package) => {
    if (selectedSurgeries.find(s => s.id === surgery.id)) {
      toast({
        title: "Surgery already added",
        description: "This surgery is already selected",
        variant: "destructive"
      });
      return;
    }

    setSelectedSurgeries(prev => [...prev, surgery]);
    setSurgerySearch('');
    setShowSurgeryResults(false);

    // Fetch related complications for all selected surgeries
    const surgeryComplications = await fetchCghsRelatedComplications([...selectedSurgeries.map(s => s.id), surgery.id]) ?? [];

    toast({
      title: "Success",
      description: `Added surgery: ${surgery.name}`
    });
  };

  const addComplicationToPatient = async (complication: Complication, diagnosisId?: number) => {
    try {
      // Check if complication already added
      if (patientComplications.find(c => c.complication.id === complication.id)) {
        toast({
          title: "Already added",
          description: "This complication is already in the patient's record",
          variant: "destructive"
        });
        return;
      }

      // For now, store in local state (until patient_complications table is created)
      const newPatientComplication: PatientComplication = {
        id: Date.now(), // temporary ID
        complication: complication,
        status: 'active',
        occurred_date: new Date().toISOString().split('T')[0],
        notes: '',
        diagnosis_id: diagnosisId
      };
      
      setPatientComplications(prev => [newPatientComplication, ...prev]);
      setComplicationSearch('');
      setShowComplicationResults(false);
      
      toast({
        title: "Success",
        description: `Added complication: ${complication.name}`
      });
    } catch (error) {
      console.error('Error adding complication:', error);
      toast({
        title: "Error",
        description: "Failed to add complication",
        variant: "destructive"
      });
    }
  };

  const fetchRelatedComplications = async (diagnosisIds: string[]) => {
    try {
      // For now, we'll extract complications directly from the diagnosis data
      const selectedDiagnosis = diagnoses.find(d => diagnosisIds.includes(d.id));
      if (selectedDiagnosis) {
        const relatedComps = [
          selectedDiagnosis.complication1,
          selectedDiagnosis.complication2,
          selectedDiagnosis.complication3,
          selectedDiagnosis.complication4
        ].filter(Boolean);
        
        // Convert to Complication objects for display
        const complicationObjects = relatedComps.map((comp, index) => {
          // Get specific investigations and medications for each complication
          const getInvestigationsAndMedications = (compName: string, compIndex: number) => {
            // Define specific investigations and medications for different complications
            const mappings: { [key: string]: { investigations: string[], medications: string[] } } = {
              'sepsis': {
                investigations: ['Blood C&S', 'CBC', 'CRP', 'Procalcitonin'],
                medications: ['Broad Spectrum Antibiotics', 'IV Fluids', 'Vasopressors', 'Steroids']
              },
              'shock': {
                investigations: ['ECG', 'Echo', 'Blood Pressure Monitoring', 'Lactate'],
                medications: ['Inotropes', 'IV Fluids', 'Vasopressors', 'Dobutamine']
              },
              'respiratory-failure': {
                investigations: ['ABG', 'Chest X-Ray', 'Ventilator Settings', 'PEEP'],
                medications: ['Mechanical Ventilation', 'PEEP', 'Sedation', 'Muscle Relaxants']
              },
              'bleeding': {
                investigations: ['CBC', 'PT/INR', 'APTT', 'Platelet Count'],
                medications: ['Tranexamic Acid', 'Fresh Frozen Plasma', 'Platelets', 'Vitamin K']
              },
              'infection': {
                investigations: ['Blood Culture', 'Urine Culture', 'WBC Count', 'ESR'],
                medications: ['Antibiotics', 'Paracetamol', 'IV Fluids', 'Analgesics']
              },
              'diabetic-ketoacidosis': {
                investigations: ['Blood Sugar', 'Ketones', 'ABG', 'Electrolytes'],
                medications: ['Insulin', 'IV Fluids', 'Potassium', 'Bicarbonate']
              },
              'hypertensive-crisis': {
                investigations: ['Blood Pressure', 'ECG', 'Fundoscopy', 'Renal Function'],
                medications: ['Antihypertensives', 'Diuretics', 'ACE Inhibitors', 'Beta Blockers']
              }
            };
            
            // Get mapping for the specific complication name
            const mapping = mappings[compName.toLowerCase()];
            if (mapping) {
              return mapping;
            }
            
            // Default fallback with different values for each complication
            const defaultInvestigations = [
              ['CBC', 'ESR', 'CRP', 'X-Ray'],
              ['Blood Sugar', 'Urine R/M', 'ECG', 'Chest X-Ray'],
              ['LFT', 'RFT', 'Lipid Profile', 'HbA1c'],
              ['Thyroid Function', 'Vitamin D', 'B12', 'Folate']
            ];
            
            const defaultMedications = [
              ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Omeprazole'],
              ['Metformin', 'Amlodipine', 'Atorvastatin', 'Aspirin'],
              ['Levothyroxine', 'Vitamin D3', 'B12 Injection', 'Folic Acid'],
              ['Ciprofloxacin', 'Prednisolone', 'Salbutamol', 'Cetirizine']
            ];
            
            return {
              investigations: defaultInvestigations[compIndex] || defaultInvestigations[0],
              medications: defaultMedications[compIndex] || defaultMedications[0]
            };
          };
          
          const { investigations, medications } = getInvestigationsAndMedications(comp!, index);
          
          return {
            id: index + 1,
            complication_code: `COMP${index + 1}`,
            name: comp!,
            description: '',
            severity: 'moderate' as const,
            category: 'Related',
            is_active: true,
            inv1: investigations[0] || '',
            inv2: investigations[1] || '',
            inv3: investigations[2] || '',
            inv4: investigations[3] || '',
            med1: medications[0] || '',
            med2: medications[1] || '',
            med3: medications[2] || '',
            med4: medications[3] || ''
          } as any;
        });
        
        // Set the complications in state
        setRelatedComplications(complicationObjects);
        return complicationObjects;
      } else {
        setRelatedComplications([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching related complications:', error);
      setRelatedComplications([]);
      return [];
    }
  };

  const fetchCghsRelatedComplications = async (surgeryIds: string[]) => {
    try {
      // Extract complications from selected surgeries
      const allSelectedSurgeries = selectedSurgeries.filter(s => surgeryIds.includes(s.id));
      if (allSelectedSurgeries.length > 0) {
        const allComps = allSelectedSurgeries.flatMap(surgery => [
          surgery.complication1,
          surgery.complication2,
          (surgery as any).complication3,
          (surgery as any).complication4
        ].filter(Boolean));
        
        // Remove duplicates
        const uniqueComps = [...new Set(allComps)];
        
        // Convert to Complication objects with investigations and medications
        const complicationObjects = uniqueComps.map((comp, index) => {
          // Define different investigations and medications for different complications
          const getInvestigationsAndMedications = (compName: string) => {
            const mappings: { [key: string]: { investigations: string[], medications: string[] } } = {
              'mastoiditis': {
                investigations: ['CT Scan Temporal Bone', 'Audiometry', 'Tympanometry', 'CBC'],
                medications: ['Amoxicillin-Clavulanate', 'Prednisolone', 'Analgesic', 'Antihistamine']
              },
              'labyrinthitis': {
                investigations: ['MRI Brain', 'Vestibular Function Tests', 'Audiometry', 'Blood Sugar'],
                medications: ['Betahistine', 'Meclizine', 'Prochlorperazine', 'Diazepam']
              },
              'sepsis': {
                investigations: ['Blood C&S', 'CBC', 'CRP', 'Procalcitonin'],
                medications: ['Broad Spectrum Antibiotics', 'IV Fluids', 'Vasopressors', 'Steroids']
              },
              'airway-obstruction': {
                investigations: ['Chest X-Ray', 'ABG', 'Peak Flow', 'Pulse Oximetry'],
                medications: ['Bronchodilators', 'Steroids', 'Oxygen', 'Adrenaline']
              },
              'shock': {
                investigations: ['ECG', 'Echo', 'Blood Pressure Monitoring', 'Lactate'],
                medications: ['Inotropes', 'IV Fluids', 'Vasopressors', 'Dobutamine']
              },
              'respiratory-failure': {
                investigations: ['ABG', 'Chest X-Ray', 'Ventilator Settings', 'PEEP'],
                medications: ['Mechanical Ventilation', 'PEEP', 'Sedation', 'Muscle Relaxants']
              },
              'multi-organ-failure': {
                investigations: ['Renal Function', 'Liver Function', 'Cardiac Enzymes', 'Coagulation Profile'],
                medications: ['Dialysis', 'CRRT', 'Plasma Exchange', 'Supportive Care']
              }
            };
            
            // Default fallback
            return mappings[compName.toLowerCase()] || {
              investigations: ['Basic Investigation 1', 'Basic Investigation 2', 'Basic Investigation 3', 'Basic Investigation 4'],
              medications: ['Basic Medication 1', 'Basic Medication 2', 'Basic Medication 3', 'Basic Medication 4']
            };
          };
          
          const { investigations, medications } = getInvestigationsAndMedications(comp);
          
          return {
            id: index + 1,
            complication_code: `CGHS_COMP${index + 1}`,
            name: comp,
            description: '',
            severity: 'moderate' as const,
            category: 'Surgery Related',
            is_active: true,
            inv1: investigations[0] || '',
            inv2: investigations[1] || '',
            inv3: investigations[2] || '',
            inv4: investigations[3] || '',
            med1: medications[0] || '',
            med2: medications[1] || '',
            med3: medications[2] || '',
            med4: medications[3] || ''
          };
        });
        
        setCghsRelatedComplications(complicationObjects);
        return complicationObjects;
      } else {
        setCghsRelatedComplications([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching CGHS related complications:', error);
      setCghsRelatedComplications([]);
      return [];
    }
  };

  const fetchSurgeryComplications = async (surgeryIds: string[]) => {
    try {
      // Fetch all complications for the selected surgeries
      // Adjust the query based on your schema
      const { data: surgeryDetails, error } = await supabase
        .from('cghs_surgery')
        .select('id, name, complication1, complication2, complication3, complication4')
        .in('id', surgeryIds);

      if (error) throw error;

      // Collect all unique complication names
      const complicationNames = [
        ...new Set(
          surgeryDetails.flatMap(surgery => [surgery.complication1, surgery.complication2, surgery.complication3, surgery.complication4].filter(Boolean))
        )
      ];

      if (complicationNames.length === 0) {
        setRelatedComplications([]);
        return [];
      }

      // Fetch complication details by name
      const { data: complicationsData, error: compError } = await supabase
        .from('complication')
        .select('*')
        .in('name', complicationNames);
      if (compError) throw compError;

      return complicationsData || [];
    } catch (error) {
      console.error('Error fetching surgery complications:', error);
    }
  };

  const fetchCghsSurgeryComplications = async (surgeryId: number | string) => {
    const { data, error } = await supabase
      .from('complication_cghs_surgery')
      .select('*')
      .eq('surgery_id', surgeryId);

    console.log("Fetched complications:", data, error);

    if (!error && data) {
      setCghsSurgeryComplications(data);
    } else {
      setCghsSurgeryComplications([]);
    }
  };

  // Create new diagnosis
  const createNewDiagnosis = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnosis')
        .insert(newDiagnosis)
        .select()
        .single();

      if (error) throw error;
      
      setDiagnoses(prev => [...prev, data]);
      setNewDiagnosis({
        name: '',
        complication1: '',
        complication2: '',
        complication3: '',
        complication4: ''
      });
      setShowAddDiagnosisDialog(false);
      
      toast({
        title: "Success",
        description: "New diagnosis created successfully"
      });
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      toast({
        title: "Error",
        description: "Failed to create diagnosis",
        variant: "destructive"
      });
    }
  };

  // Remove functions
  const removeDiagnosis = async (id: number) => {
    try {
      const { error } = await supabase
        .from('patient_diagnosis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatientDiagnoses(prev => prev.filter(d => d.id !== id));
      toast({
        title: "Success",
        description: "Diagnosis removed successfully"
      });
    } catch (error) {
      console.error('Error removing diagnosis:', error);
      toast({
        title: "Error",
        description: "Failed to remove diagnosis",
        variant: "destructive"
      });
    }
  };

  const removeSurgery = (id: string) => {
    setSelectedSurgeries(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Success",
      description: "Surgery removed"
    });
  };

  const removeComplication = (id: number) => {
    setPatientComplications(prev => prev.filter(c => c.id !== id));
    
    toast({
      title: "Success",
      description: "Complication removed"
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'chronic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Billing functions
  const saveToBilling = async () => {
    setIsSavingToBilling(true);
    try {
      // Generate a unique bill number
      const billNumber = `BL${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now()}`;

      // Create the main billing record
      const billingInsertData = {
        patient_unique_id: patientUniqueId,
        visit_id: visitId || `VISIT-${Date.now()}`,
        bill_number: billNumber,
        patient_name: 'Patient Name', // You can get this from patient data
        bill_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        primary_diagnosis: patientDiagnoses.map(d => d.diagnosis.name).join(', ')
      };

      // Insert billing record
      const { data: billingData, error: billingError } = await supabase
        .from('patient_billing')
        .insert(billingInsertData)
        .select()
        .single();

      if (billingError || !billingData) {
        console.error('Billing insert error:', billingError);
        throw new Error('Failed to insert billing record. Check table/column names, required fields, and RLS.');
      }
      const billingIdLocal = billingData.id;
      setBillingId(billingIdLocal);

      // Save selected diagnoses to billing
      if (patientDiagnoses.length > 0) {
        const diagnosesToSave = patientDiagnoses.map(d => ({
          billing_id: billingIdLocal,
          diagnosis_id: d.diagnosis.id,
          diagnosis_name: d.diagnosis.name,
          status: d.status,
          diagnosed_date: d.diagnosed_date,
          notes: d.notes || ''
        }));

        const { error: diagnosisError } = await supabase
          .from('billing_diagnoses')
          .insert(diagnosesToSave);

        if (diagnosisError) {
          console.error('Billing diagnoses insert error:', diagnosisError);
          throw new Error('Failed to insert billing diagnoses. Check types and constraints.');
        }
      }

      // Save selected surgeries to billing
      if (selectedSurgeries.length > 0) {
        const surgeriesToSave = selectedSurgeries.map(s => ({
          billing_id: billingIdLocal,
          patient_unique_id: patientUniqueId,
          surgery_id: s.id,
          surgery_name: s.name,
          surgery_code: s.code,
          surgery_amount: s.amount,
          complication1: s.complication1 || '',
          complication2: s.complication2 || '',
          surgery_date: new Date().toISOString().split('T')[0]
        }));

        const { error: surgeryError } = await supabase
          .from('billing_surgeries')
          .insert(surgeriesToSave);

        if (surgeryError) {
          console.error('Billing surgeries insert error:', surgeryError);
          throw new Error('Failed to insert billing surgeries. Check types and constraints.');
        }
      }

      // Save complications to billing
      if (patientComplications.length > 0) {
        const complicationsToSave = patientComplications.map(c => ({
          billing_id: billingIdLocal,
          patient_unique_id: patientUniqueId,
          complication_name: c.complication.name,
          severity: c.complication.severity,
          status: c.status,
          occurred_date: c.occurred_date
        }));

        const { error: complicationError } = await supabase
          .from('billing_complications')
          .insert(complicationsToSave);

        if (complicationError) {
          console.error('Billing complications insert error:', complicationError);
          throw new Error('Failed to insert billing complications. Check types and constraints.');
        }
      }

      toast({
        title: "Success!",
        description: `Saved to billing (Bill #${billNumber}). All selected diagnoses, surgeries, and complications have been saved.`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error saving to billing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save to billing. Please check your data and database schema.",
        variant: "destructive"
      });
    } finally {
      setIsSavingToBilling(false);
    }
  };

  function mergeComplications(existing: Complication[], newOnes: Complication[]) {
    const map = new Map();
    [...existing, ...newOnes].forEach(comp => {
      map.set(comp.name, comp); // or comp.id if unique
    });
    return Array.from(map.values());
  }

  // Pseudocode for fetching related data
  const fetchSurgeriesAndComplications = async (billingId: number | string) => {
    const { data: surgeries } = await supabase
      .from('billing_surgeries')
      .select('surgery_name')
      .eq('billing_id', billingId);

    const { data: complications } = await supabase
      .from('billing_complications')
      .select('complication_name')
      .eq('billing_id', billingId);

    return {
      surgeries: surgeries?.map(s => s.surgery_name) || [],
      complications: complications?.map(c => c.complication_name) || [],
    };
  };

  useEffect(() => {
    const fetchAllDetails = async () => {
      const details: { [key: number]: { surgeries: string[], complications: string[] } } = {};
      for (const record of existingBillingRecords) {
        const res = await fetchSurgeriesAndComplications(record.id);
        details[record.id] = res;
      }
      setBillingDetails(details);
    };
    if (existingBillingRecords.length > 0) {
      fetchAllDetails();
    }
  }, [existingBillingRecords]);

  useEffect(() => {
    if (selectedSurgeries.length > 0) {
      // For now, first surgery ka complications dikha rahe hain
      fetchCghsSurgeryComplications(selectedSurgeries[0].id);
    } else {
      setCghsSurgeryComplications([]);
    }
  }, [selectedSurgeries]);

  useEffect(() => {
    if (selectedSurgeries.length > 0) {
      // Fetch CGHS related complications for selected surgeries
      fetchCghsRelatedComplications(selectedSurgeries.map(s => s.id));
    } else {
      setCghsRelatedComplications([]);
    }
  }, [selectedSurgeries]);

  const handleInvestigationChipClick = (inv: string) => {
    setSelectedInvestigationChips(prev =>
      prev.includes(inv) ? prev.filter(i => i !== inv) : [...prev, inv]
    );
  };

  const handleMedicationChipClick = (med: string) => {
    setSelectedMedicationChips(prev =>
      prev.includes(med) ? prev.filter(m => m !== med) : [...prev, med]
    );
  };

  // Note: Removed fetchComplicationsForDiagnosis function as it was overriding 
  // the correct diagnosis complications with database query results.
  // The complications should come from the diagnosis table fields (complication1, complication2, etc.)
  // not from a separate complications table linked by diagnosis_id.

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoadingPatientData && (
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading patient data...</p>
          </CardContent>
        </Card>
      )}

      {/* Existing Billing Records */}
      {!isLoadingPatientData && existingBillingRecords.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
              <Receipt className="h-4 w-4" />
              Patient Billing History
            </CardTitle>
            <CardDescription className="text-blue-600 text-xs">
              Previously saved billing records for this patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingBillingRecords.map((record) => (
                <div key={record.id} className="bg-white p-3 rounded-lg border group hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Display only diagnosis, surgery, and complications */}
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Diagnosis:</strong> {String(record.primary_diagnosis || 'Not specified')}</p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {record.bill_date
                            ? new Date(record.bill_date).toLocaleString()
                            : record.created_at
                              ? new Date(record.created_at).toLocaleString()
                              : "N/A"}
                        </p>
                        <p>
                          <strong>Surgery:</strong>{" "}
                          {billingDetails[record.id]?.surgeries?.length
                            ? billingDetails[record.id].surgeries.join(', ')
                            : 'None'}
                        </p>
                        <p>
                          <strong>Complications:</strong>{" "}
                          {billingDetails[record.id]?.complications?.length
                            ? billingDetails[record.id].complications.join(', ')
                            : 'None'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 ml-3">
                      {/* Action Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingRecord(record);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this billing record?')) {
                              try {
                                const { error } = await supabase
                                  .from('patient_billing')
                                  .delete()
                                  .eq('id', record.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: "Success",
                                  description: "Billing record deleted successfully",
                                });
                                
                                // Refresh the data
                                fetchPatientData();
                              } catch (error) {
                                console.error('Error deleting billing record:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to delete billing record",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {!isLoadingPatientData && existingBillingRecords.length === 0 && patientDiagnoses.length === 0 && selectedSurgeries.length === 0 && patientComplications.length === 0 && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500">
              <Receipt className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No previous medical records found</p>
              <p className="text-sm">Start by adding diagnoses, surgeries, or complications below</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnoses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-blue-700 tracking-tight mb-1">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Diagnosis
          </CardTitle>
          <CardDescription>
            Search and add diagnosis, view related complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnosis Search */}
          <div className="relative" ref={diagnosisSearchRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search diagnoses by name, ICD code, or category..."
                  value={diagnosisSearch}
                  onChange={(e) => {
                    setDiagnosisSearch(e.target.value);
                    setShowDiagnosisResults(true);
                  }}
                  onFocus={() => setShowDiagnosisResults(true)}
                  className="pl-10"
                />
              </div>
              <Dialog open={showAddDiagnosisDialog} onOpenChange={setShowAddDiagnosisDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Diagnosis</DialogTitle>
                    <DialogDescription>
                      Create a new diagnosis entry
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Diagnosis Name</Label>
                      <Input
                        value={newDiagnosis.name}
                        onChange={(e) => setNewDiagnosis(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter diagnosis name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Complication 1</Label>
                        <Input
                          value={newDiagnosis.complication1}
                          onChange={(e) => setNewDiagnosis(prev => ({ ...prev, complication1: e.target.value }))}
                          placeholder="e.g., Bleeding"
                        />
                      </div>
                      <div>
                        <Label>Complication 2</Label>
                        <Input
                          value={newDiagnosis.complication2}
                          onChange={(e) => setNewDiagnosis(prev => ({ ...prev, complication2: e.target.value }))}
                          placeholder="e.g., Infection"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Complication 3</Label>
                        <Input
                          value={newDiagnosis.complication3}
                          onChange={(e) => setNewDiagnosis(prev => ({ ...prev, complication3: e.target.value }))}
                          placeholder="e.g., Hypoglycemia"
                        />
                      </div>
                      <div>
                        <Label>Complication 4</Label>
                        <Input
                          value={newDiagnosis.complication4}
                          onChange={(e) => setNewDiagnosis(prev => ({ ...prev, complication4: e.target.value }))}
                          placeholder="e.g., Neuropathy"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDiagnosisDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNewDiagnosis}>
                      Create Diagnosis
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Search Results */}
            {showDiagnosisResults && diagnosisSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredDiagnoses.length > 0 ? (
                  filteredDiagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedDiagnosisId(diagnosis.id);
                        addDiagnosisToPatient(diagnosis);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{String(diagnosis.name || '')}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Complications: {[
                              String(diagnosis.complication1 || ''), 
                              String(diagnosis.complication2 || ''), 
                              String(diagnosis.complication3 || ''), 
                              String(diagnosis.complication4 || '')
                            ].filter(Boolean).join(', ') || 'None'}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No diagnoses found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Diagnoses */}
          {patientDiagnoses.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Selected Diagnoses</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {patientDiagnoses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{String(item.diagnosis?.name || '')}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Related complications available
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(String(item.status || 'active'))}>
                          {String(item.status || 'active')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Diagnosed: {new Date(item.diagnosed_date || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDiagnosis(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Surgeries Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-blue-700 tracking-tight mb-1">
            <Package className="h-5 w-5 text-green-600" />
            CGHS SURGERY
          </CardTitle>
          <CardDescription>
            Select CGHS surgeries for the patient
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Surgery Search */}
          <div className="relative" ref={surgerySearchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search surgeries by name or code..."
                value={surgerySearch}
                onChange={(e) => {
                  setSurgerySearch(e.target.value);
                  setShowSurgeryResults(true);
                }}
                onFocus={() => setShowSurgeryResults(true)}
                className="pl-10"
              />
            </div>
            
            {/* Surgery Search Results */}
            {showSurgeryResults && surgerySearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSurgeries.length > 0 ? (
                  filteredSurgeries.map((surgery) => (
                    <div
                      key={surgery.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => addSurgeryToPatient(surgery)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{String(surgery.name || '')}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Code: {String(surgery.code || '')} • ₹{String(surgery.amount || '')}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No surgeries found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Surgeries */}
          {selectedSurgeries.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Selected Surgeries</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedSurgeries.map((surgery) => (
                  <div key={surgery.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{String(surgery.name || '')}</div>
                      <div className="text-xs text-gray-600 mt-1">Code: {String(surgery.code || '')}</div>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="bg-white">
                          ₹{String(surgery.amount || '')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSurgery(surgery.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-orange-700 tracking-tight mb-1">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Complications mapped to diagnosis
          </CardTitle>
          <CardDescription>
            Monitor and manage potential complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search complications..."
            value={complicationSearch || ""}
            onChange={e => setComplicationSearch(e.target.value)}
            onFocus={() => setShowComplicationResults(true)}
            className="mb-2"
          />
          <div className="p-3 border rounded mb-3 bg-white">
            {/* Complications as simple selectable buttons */}
            <div>
              <strong>Complication: </strong>
              {relatedComplications.length > 0 ? (
                relatedComplications.map((comp, idx) => {
                  const isSelected = selectedDiagnosisComplications.includes(comp.name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDiagnosisComplications(prev =>
                        prev.includes(comp.name)
                          ? prev.filter(c => c !== comp.name)
                          : [...prev, comp.name]
                      )}
                      className={`px-3 py-1 rounded-full border mr-2 mb-2 text-xs transition-colors ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    >
                      {comp.name}
                    </button>
                  );
                })
              ) : 'None'}
            </div>
            
            {/* Investigations and Medications based on selected complications */}
            {selectedDiagnosisComplications.length > 0 && (
              <>
                <div className="mt-2">
                  <strong>Investigations:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      // Get investigations from selected complications
                      const selectedComplicationObjects = relatedComplications.filter(comp =>
                        selectedDiagnosisComplications.includes(comp.name)
                      );
                      const allInvestigations = selectedComplicationObjects.flatMap(comp => [
                        (comp as any).inv1,
                        (comp as any).inv2,
                        (comp as any).inv3,
                        (comp as any).inv4
                      ]).filter(Boolean);
                      
                      // Remove duplicates
                      const uniqueInvestigations = [...new Set(allInvestigations)];
                      
                      return uniqueInvestigations.map((inv, idx) => {
                        const isSelected = selectedDiagnosisInvestigations.includes(inv);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDiagnosisInvestigations(prev =>
                              prev.includes(inv)
                                ? prev.filter(i => i !== inv)
                                : [...prev, inv]
                            )}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit transition-colors mr-2 mb-2 text-xs ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                          >
                            <span>{inv}</span>
                            {isSelected && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Enter details"
                                  value={diagnosisInvestigationDays[inv] || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setDiagnosisInvestigationDays(prev => ({ 
                                    ...prev, 
                                    [inv]: e.target.value 
                                  }))}
                                  className="w-24 h-6 text-xs px-2 border border-blue-300 rounded bg-white ml-2"
                                />
                                <CheckCircle2 className="h-4 w-4 text-blue-500 ml-1" />
                              </>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
                <div className="mt-2">
                  <strong>Medications:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      // Get medications from selected complications
                      const selectedComplicationObjects = relatedComplications.filter(comp =>
                        selectedDiagnosisComplications.includes(comp.name)
                      );
                      const allMedications = selectedComplicationObjects.flatMap(comp => [
                        (comp as any).med1,
                        (comp as any).med2,
                        (comp as any).med3,
                        (comp as any).med4
                      ]).filter(Boolean);
                      
                      // Remove duplicates
                      const uniqueMedications = [...new Set(allMedications)];
                      
                      return uniqueMedications.map((med, idx) => {
                        const isSelected = selectedDiagnosisMedications.includes(med);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDiagnosisMedications(prev =>
                              prev.includes(med)
                                ? prev.filter(m => m !== med)
                                : [...prev, med]
                            )}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit transition-colors mr-2 mb-2 text-xs ${isSelected ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                          >
                            <span>{med}</span>
                            {isSelected && (
                              <>
                                <span className="mx-1 text-gray-600">Day</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={diagnosisMedicationDays[med]?.start || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setDiagnosisMedicationDays(prev => ({ 
                                    ...prev, 
                                    [med]: { 
                                      ...prev[med], 
                                      start: e.target.value 
                                    } 
                                  }))}
                                  className="w-14 h-6 text-xs px-1 border border-green-300 rounded bg-white"
                                />
                                <span className="mx-1 text-gray-600">to</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="7"
                                  value={diagnosisMedicationDays[med]?.end || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setDiagnosisMedicationDays(prev => ({ 
                                    ...prev, 
                                    [med]: { 
                                      ...prev[med], 
                                      end: e.target.value 
                                    } 
                                  }))}
                                  className="w-14 h-6 text-xs px-1 border border-green-300 rounded bg-white"
                                />
                                <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                              </>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complications mapped to CGHS surgery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-blue-700 tracking-tight mb-1">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Complications mapped to CGHS surgery
          </CardTitle>
          <CardDescription>
            Monitor and manage potential complications related to selected surgeries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search complications mapped to CGHS surgery..."
            value={cghsComplicationSearch || ''}
            onChange={e => setCghsComplicationSearch(e.target.value)}
            className="mb-2"
          />
          <div className="p-3 border rounded mb-3 bg-white">
            {/* Complications as simple selectable buttons */}
            <div>
              <strong>Complication: </strong>
              {cghsRelatedComplications.length > 0 ? (
                cghsRelatedComplications.map((comp, idx) => {
                  const isSelected = selectedCghsComplications.includes(comp.name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCghsComplications(prev =>
                        prev.includes(comp.name)
                          ? prev.filter(c => c !== comp.name)
                          : [...prev, comp.name]
                      )}
                      className={`px-3 py-1 rounded-full border mr-2 mb-2 text-xs transition-colors ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    >
                      {comp.name}
                    </button>
                  );
                })
              ) : selectedSurgeries.length > 0 ? 'No complications found for selected surgeries' : 'Select a surgery first'}
            </div>
            
            {/* Investigations and Medications based on selected complications */}
            {selectedCghsComplications.length > 0 && (
              <>
                <div className="mt-2">
                  <strong>Investigations:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      // Get investigations from selected complications
                      const selectedComplicationObjects = cghsRelatedComplications.filter(comp =>
                        selectedCghsComplications.includes(comp.name)
                      );
                      const allInvestigations = selectedComplicationObjects.flatMap(comp => [
                        (comp as any).inv1,
                        (comp as any).inv2,
                        (comp as any).inv3,
                        (comp as any).inv4
                      ]).filter(Boolean);
                      
                      // Remove duplicates
                      const uniqueInvestigations = [...new Set(allInvestigations)];
                      
                      return uniqueInvestigations.map((inv, idx) => {
                        const isSelected = selectedCghsInvestigations.includes(inv);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCghsInvestigations(prev =>
                              prev.includes(inv)
                                ? prev.filter(i => i !== inv)
                                : [...prev, inv]
                            )}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit transition-colors mr-2 mb-2 text-xs ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                          >
                            <span>{inv}</span>
                            {isSelected && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Enter details"
                                  value={cghsInvestigationDays[inv] || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setCghsInvestigationDays(prev => ({ 
                                    ...prev, 
                                    [inv]: e.target.value 
                                  }))}
                                  className="w-24 h-6 text-xs px-2 border border-blue-300 rounded bg-white ml-2"
                                />
                                <CheckCircle2 className="h-4 w-4 text-blue-500 ml-1" />
                              </>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
                <div className="mt-2">
                  <strong>Medications:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(() => {
                      // Get medications from selected complications
                      const selectedComplicationObjects = cghsRelatedComplications.filter(comp =>
                        selectedCghsComplications.includes(comp.name)
                      );
                      const allMedications = selectedComplicationObjects.flatMap(comp => [
                        (comp as any).med1,
                        (comp as any).med2,
                        (comp as any).med3,
                        (comp as any).med4
                      ]).filter(Boolean);
                      
                      // Remove duplicates
                      const uniqueMedications = [...new Set(allMedications)];
                      
                      return uniqueMedications.map((med, idx) => {
                        const isSelected = selectedCghsMedications.includes(med);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCghsMedications(prev =>
                              prev.includes(med)
                                ? prev.filter(m => m !== med)
                                : [...prev, med]
                            )}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit transition-colors mr-2 mb-2 text-xs ${isSelected ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                          >
                            <span>{med}</span>
                            {isSelected && (
                              <>
                                <span className="mx-1 text-gray-600">Day</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={cghsMedicationDays[med]?.start || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setCghsMedicationDays(prev => ({ 
                                    ...prev, 
                                    [med]: { 
                                      ...prev[med], 
                                      start: e.target.value 
                                    } 
                                  }))}
                                  className="w-14 h-6 text-xs px-1 border border-green-300 rounded bg-white"
                                />
                                <span className="mx-1 text-gray-600">to</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="7"
                                  value={cghsMedicationDays[med]?.end || ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setCghsMedicationDays(prev => ({ 
                                    ...prev, 
                                    [med]: { 
                                      ...prev[med], 
                                      end: e.target.value 
                                    } 
                                  }))}
                                  className="w-14 h-6 text-xs px-1 border border-green-300 rounded bg-white"
                                />
                                <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                              </>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save to Billing Section */}
      {(patientDiagnoses.length > 0 || selectedSurgeries.length > 0 || patientComplications.length > 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Receipt className="h-5 w-5" />
              Save to Billing
            </CardTitle>
            <CardDescription className="text-green-600">
              Save all selected diagnoses, surgeries, and complications to create a billing record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Summary to be saved:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-600">Diagnoses:</span>
                    <span className="ml-2">{patientDiagnoses.length} selected</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Surgeries:</span>
                    <span className="ml-2">{selectedSurgeries.length} selected</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">Complications:</span>
                    <span className="ml-2">{patientComplications.length} active</span>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={saveToBilling}
                  disabled={isSavingToBilling}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSavingToBilling ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Saving to Billing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save to Billing
                    </>
                  )}
                </Button>
              </div>
              
              {billingId && (
                <div className="text-sm text-green-600 text-center">
                  ✅ Successfully saved to billing (ID: {billingId})
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fetch and Add prompt sections moved here */}
      <div className="mt-6">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Fetch</label>
          <textarea
            className="w-full border rounded p-2 min-h-[80px] mb-4"
            placeholder="view all stored patient data here..."
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Add prompt</label>
          <select
            className="border rounded px-3 py-2 w-full max-w-xs"
            value={promptType}
            onChange={e => setPromptType(e.target.value)}
          >
            <option>Discharge summary</option>
            <option>Dama</option>
            <option>Death summary</option>
            <option>Death certificate</option>
            <option>Injury report</option>
          </select>
        </div>
      </div>

      {showEditModal && editingRecord && (
        <EditBillingModal
          record={editingRecord}
          onClose={() => setShowEditModal(false)}
          onSave={fetchPatientData}
        />
      )}
    </div>
  );
} 
