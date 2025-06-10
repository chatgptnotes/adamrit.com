"use client"

import { useState, useEffect, useCallback } from "react"
import debounce from "lodash/debounce"
import { PatientDashboard } from "@/components/patient-dashboard"
import { DiagnosisMaster } from "@/components/diagnosis-master"
import { SurgeryMaster } from "@/components/surgery-master"
import { Approvals } from "@/components/esic-approvals"
import { ReportsAnalytics } from "@/components/reports-analytics"
import { MedicalStaffMaster } from "@/components/medical-staff-master"
import { PatientRegistryList } from "@/components/patient-registry-list"
import {
  Search,
  Users,
  ClipboardList,
  CheckCircle2,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Scissors,
  UserCog,
  UserPlus,
  Stethoscope,
  User,
  Monitor,
  TestTube,
  FileSearch,
  Pill,
  Calendar,
  LayoutDashboard,
  ActivitySquare,
  PlusCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import UserAddForm from "@/components/user-add-form"
import { useRouter, useSearchParams } from "next/navigation"
import UserList from "@/components/user-list"
import AddDiagnosisForm from "@/components/add-diagnosis-form"
import AddRadiologyForm from "@/components/add-radiology-form"
import AddLabForm from "@/components/add-lab-form"
import AddOtherInvestigationForm from "@/components/add-other-investigation-form"
import AddMedicationForm from "@/components/add-medication-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
  TableCaption
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { sendWhatsAppNotification } from "@/lib/whatsapp-notification"
import SettingsPage from "@/app/settings/page"
import { useComplications } from "@/hooks/useComplications"
import { Select, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select"
import * as XLSX from 'xlsx';

// Types
interface Diagnosis {
  id: string;
  name: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}
interface Doctor {
  id: string;
  name: string;
  degree?: string;
  specialization?: string;
  is_referring?: boolean;
  is_anaesthetist?: boolean;
  is_surgeon?: boolean;
  is_radiologist?: boolean;
  is_pathologist?: boolean;
  is_physician?: boolean;
  other_speciality?: string;
}
interface CGHSSurgery {
  id: string;
  name: string;
  code?: string;
  amount?: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}
interface YojnaSurgery {
  id: string;
  name: string;
  code?: string;
  amount?: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}
interface PrivateSurgery {
  id: string;
  name: string;
  code?: string;
  amount?: string;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}
interface Complication {
  id: string;
  name: string;
  risk_level?: string;
  description?: string;
  foreign_key?: string;
  lab1?: string;
  lab2?: string;
  rad1?: string;
  rad2?: string;
  med1?: string;
  med2?: string;
  med3?: string;
  med4?: string;
}
interface RadiologyTest {
  id: string;
  name: string;
  cost?: string;
  code?: string;
  non_nabh_cost?: string;
}
interface LabTest {
  id: string;
  name: string;
  cost?: string;
  code?: string;
}
interface OtherInvestigation {
  id: string;
  name: string;
  cost?: string;
  code?: string;
}
interface Medication {
  id: string;
  name: string;
  type: string;
  cost: string;
  speciality?: string;
  non_nabh_cost?: string;
}

type Patient = {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  registration_date?: string;
  insurance_person_no?: string;
  admission_date?: string;
  // ...baaki fields
};

// Add type for activeTab
type TabType = 
  | "complications-master" 
  | "radiology-master" 
  | "lab-master" 
  | "other-investigations-master" 
  | "medications-master" 
  | "approvals" 
  | "reports" 
  | "medical-staff-master" 
  | "user-list" 
  | "doctor-master" 
  | "settings"
  | "today-ipd-dashboard"
  | "today-opd-dashboard"
  | "patient"
  | "patient-dashboard"
  | "diagnosis-master"
  | "cghs-surgery-master"
  | "yojna-surgery-master"
  | "private-surgery-master"
  | "patient-registration";

export default function Home() {
  const searchParams = useSearchParams();
  const tab = (searchParams?.get('tab') || 'complications-master') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(tab);
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false)
  const [showAddSurgery, setShowAddSurgery] = useState(false)
  const [surgeries, setSurgeries] = useState([
    { name: "Appendectomy", amount: "₹10,000", code: "S001", complication1: "Surgical Site Infection", complication2: "Bleeding", complication3: "Intestinal Obstruction", complication4: "none" },
    { name: "Cholecystectomy", amount: "₹12,000", code: "S002", complication1: "Bile Leak", complication2: "Bleeding", complication3: "Infection", complication4: "none" },
    { name: "Hernia Repair", amount: "₹8,000", code: "S003", complication1: "Infection", complication2: "Recurrence", complication3: "none", complication4: "none" },
    { name: "Cataract Surgery", amount: "₹7,500", code: "S004", complication1: "Infection", complication2: "Retinal Detachment", complication3: "none", complication4: "none" },
    { name: "Coronary Bypass", amount: "₹1,50,000", code: "S005", complication1: "Bleeding", complication2: "Infection", complication3: "Pulmonary Embolism", complication4: "Heart Arrhythmias" },
  ])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [editDiagnosis, setEditDiagnosis] = useState<Diagnosis | null>(null);
  const [radiology, setRadiology] = useState<RadiologyTest[]>([])
  const [showAddRadiology, setShowAddRadiology] = useState(false)
  const [editRadiology, setEditRadiology] = useState<RadiologyTest | null>(null)
  const [lab, setLab] = useState<LabTest[]>([])
  const [showAddLab, setShowAddLab] = useState(false)
  const [editLab, setEditLab] = useState<LabTest | null>(null)
  const [otherInvestigations, setOtherInvestigations] = useState<OtherInvestigation[]>([])
  const [showAddOtherInvestigation, setShowAddOtherInvestigation] = useState(false)
  const [editOtherInvestigation, setEditOtherInvestigation] = useState<OtherInvestigation | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [editMedication, setEditMedication] = useState<Medication | null>(null)
  const [todayIPDVisits, setTodayIPDVisits] = useState<any[]>([])
  const [ipdStats, setIPDStats] = useState({
    totalPatients: 0,
    admissionsToday: 0,
    dischargesToday: 0
  })
  const [todayOPDVisits, setTodayOPDVisits] = useState<any[]>([])
  const [opdStats, setOPDStats] = useState({
    totalPatients: 0,
    morningSlot: 0,
    eveningSlot: 0
  })
  const [showAddUser, setShowAddUser] = useState(false)
  const [users, setUsers] = useState([
    { name: "Rahul Sharma", email: "rahul@example.com", role: "Admin" },
    { name: "Priya Singh", email: "priya@example.com", role: "Doctor" },
    { name: "Amit Verma", email: "amit@example.com", role: "Nurse" },
    { name: "Neha Gupta", email: "neha@example.com", role: "Receptionist" },
    { name: "Suresh Kumar", email: "suresh@example.com", role: "Lab Technician" },
  ])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const router = useRouter()
  const [searchValue, setSearchValue] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; unique_id: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [complications, setComplications] = useState<Complication[]>([])
  const [editComplication, setEditComplication] = useState<Complication | null>(null)
  const [showAddComplication, setShowAddComplication] = useState(false)

  // Replace with separate state variables for each surgery type
  const [showAddCGHSSurgery, setShowAddCGHSSurgery] = useState(false)
  const [showAddYojnaSurgery, setShowAddYojnaSurgery] = useState(false)
  const [showAddPrivateSurgery, setShowAddPrivateSurgery] = useState(false)

  const [cghsSurgeries, setCGHSSurgeries] = useState<CGHSSurgery[]>([])
  const [editCGHSSurgery, setEditCGHSSurgery] = useState<CGHSSurgery | null>(null)

  const [yojnaSurgeries, setYojnaSurgeries] = useState<YojnaSurgery[]>([])
  const [editYojnaSurgery, setEditYojnaSurgery] = useState<YojnaSurgery | null>(null)

  const [privateSurgeries, setPrivateSurgeries] = useState<PrivateSurgery[]>([])
  const [editPrivateSurgery, setEditPrivateSurgery] = useState<PrivateSurgery | null>(null)

  const [updates, setUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Removed ipdPatients and opdPatients state since we now use todayIPDVisits and todayOPDVisits for dashboards

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [searchCGHS, setSearchCGHS] = useState('');
  const [cghsPage, setCGHSPage] = useState(1);
  const [cghsPageSize] = useState(10);
  const [cghsTotalRows, setCGHSTotalRows] = useState(0);

  // Add these new states near the other useState declarations
  const [searchMed, setSearchMed] = useState('');
  const [medPage, setMedPage] = useState(1);
  const [medPageSize, setMedPageSize] = useState(10);
  const [medTotalRows, setMedTotalRows] = useState(0);

  const { complications: complicationsData } = useComplications(); // [{id, name, ...}]

  // Add separate state variables for diagnosis section
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState("")
  const [diagnosisPage, setDiagnosisPage] = useState(1)
  const [diagnosisPageSize] = useState(10)
  const [diagnosisTotalRows, setDiagnosisTotalRows] = useState(0)

  // Add these state variables near the top of your component
  const [complicationSearchTerm, setComplicationSearchTerm] = useState("");
  const [complicationPage, setComplicationPage] = useState(1);
  const [complicationPageSize] = useState(10);
  const [complicationTotalRows, setComplicationTotalRows] = useState(0);

  // Add useEffect to handle initial state
  useEffect(() => {
    setMounted(true)
    const fetchDoctors = async () => {
      const { data, error } = await supabase.from('doctor').select('*')
      if (!error) setDoctors(data || [])
    }
    fetchDoctors()
  }, [])

  // Fetch diagnoses from Supabase on mount
  useEffect(() => {
    const fetchDiagnoses = async () => {
      let query = supabase
        .from('diagnosis')
        .select('*', { count: 'exact' })
        .order('name')
        .range((diagnosisPage - 1) * diagnosisPageSize, diagnosisPage * diagnosisPageSize - 1);

      if (diagnosisSearchTerm.trim()) {
        query = query.ilike('name', `%${diagnosisSearchTerm.trim()}%`);
      }

      const { data, error, count } = await query;
      if (!error) {
        setDiagnoses(data || []);
        setDiagnosisTotalRows(count || 0);
      }
    };
    fetchDiagnoses();
  }, [diagnosisPage, diagnosisPageSize, diagnosisSearchTerm]);

  // Fetch CGHS surgeries from Supabase on mount
  useEffect(() => {
    setMounted(true)
    const fetchCGHSSurgeries = async () => {
      let query = supabase
        .from('cghs_surgery')
        .select('*', { count: 'exact' })
        .order('name')
        .range((cghsPage - 1) * cghsPageSize, cghsPage * cghsPageSize - 1);

      if (searchCGHS.trim()) {
        query = query.ilike('name', `%${searchCGHS.trim()}%`);
      }

      const { data, error, count } = await query;
      if (!error) {
        setCGHSSurgeries(data || []);
        setCGHSTotalRows(count || 0);
      }
    };
    fetchCGHSSurgeries()
  }, [cghsPage, cghsPageSize, searchCGHS]);

  // Fetch Yojna surgeries from Supabase on mount
  useEffect(() => {
    setMounted(true)
    const fetchYojnaSurgeries = async () => {
      const { data, error } = await supabase.from('yojna_surgery').select('*')
      if (!error) setYojnaSurgeries((data as YojnaSurgery[]) || [])
    }
    fetchYojnaSurgeries()
  }, [])

  // Fetch Private surgeries from Supabase on mount
  useEffect(() => {
    setMounted(true)
    const fetchPrivateSurgeries = async () => {
      const { data, error } = await supabase.from('private_surgery').select('*')
      if (!error) setPrivateSurgeries((data as PrivateSurgery[]) || [])
    }
    fetchPrivateSurgeries()
  }, [])

  // Fetch complications from Supabase on mount
  const fetchComplications = async () => {
    let query = supabase
      .from('complication')
      .select('*', { count: 'exact' })
      .order('name')
      .range((complicationPage - 1) * complicationPageSize, complicationPage * complicationPageSize - 1);

    if (complicationSearchTerm.trim()) {
      query = query.ilike('name', `%${complicationSearchTerm.trim()}%`);
    }

    const { data, error, count } = await query;
    if (!error) {
      setComplications((data as Complication[]) || []);
      setComplicationTotalRows(count || 0);
    }
  };
  useEffect(() => {
    fetchComplications();
  }, [complicationPage, complicationPageSize, complicationSearchTerm]);

  // Fetch radiology tests from Supabase radiology table
  useEffect(() => {
    const fetchRadiology = async () => {
      let query = supabase
        .from('radiology')
        .select('*', { count: 'exact' })
        .order('code')
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }

      const { data, error, count } = await query;
      if (!error) {
        setRadiology(data || []);
        setTotalRows(count || 0);
      }
    };
    fetchRadiology();
  }, [page, pageSize, searchTerm]);

  // Fetch lab tests from Supabase on mount
  useEffect(() => {
    const fetchLabTests = async () => {
      let query = supabase
        .from('lab')
        .select('*', { count: 'exact' })
        .order('name')
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }

      const { data, error, count } = await query;
      if (!error) {
        setLab((data as LabTest[]) || []);
        setTotalRows(count || 0);
      }
    };
    fetchLabTests();
  }, [page, pageSize, searchTerm]);

  // Fetch other investigations from Supabase on mount
  useEffect(() => {
    const fetchOtherInvestigations = async () => {
      const { data, error } = await supabase.from('other_investigations').select('*');
      if (!error) setOtherInvestigations((data as OtherInvestigation[]) || []);
    };
    fetchOtherInvestigations();
  }, []);

  // Fetch medications from Supabase on mount
  useEffect(() => {
    const fetchMedications = async () => {
      let query = supabase
        .from('medications')
        .select('*', { count: 'exact' })
        .order('name')
        .range((medPage - 1) * medPageSize, medPage * medPageSize - 1);

      if (searchMed.trim()) {
        query = query.ilike('name', `%${searchMed.trim()}%`);
      }

      const { data, error, count } = await query;
      if (!error) {
        setMedications((data as Medication[]) || []);
        setMedTotalRows(count || 0);
      }
    };
    fetchMedications();
  }, [medPage, medPageSize, searchMed]);

  // Function to fetch today's IPD data
  const fetchTodayIPDData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's visits with patient information
    // Include IPD visits and other visits that should be considered IPD
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select(`
        *,
        patients!inner(
          id,
          unique_id,
          name,
          age,
          gender,
          phone
        )
      `)
      .eq('visit_date', today)
      .in('visit_type', ['IPD', 'Emergency', 'Procedure']);

    if (!visitsError && visitsData) {
      setTodayIPDVisits(visitsData);

      // Calculate stats
      const totalPatients = visitsData.length;
      const admissionsToday = visitsData.filter(v =>
        new Date(v.created_at).toISOString().split('T')[0] === today
      ).length;

      setIPDStats({
        totalPatients,
        admissionsToday,
        dischargesToday: 0 // You can add discharge logic later
      });
    }
  };

  // Function to fetch today's OPD data
  const fetchTodayOPDData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's OPD visits with patient information
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select(`
        *,
        patients!inner(
          id,
          unique_id,
          name,
          age,
          gender,
          phone
        )
      `)
      .eq('visit_date', today)
      .in('visit_type', ['OPD', 'Regular Checkup', 'Follow-up', 'Specialist Consultation']);

    if (!visitsError && visitsData) {
      setTodayOPDVisits(visitsData);

      // Calculate stats - assume morning slot is before 2 PM
      const totalPatients = visitsData.length;
      const morningSlot = visitsData.filter(v => {
        const hour = new Date(v.created_at).getHours();
        return hour < 14; // Before 2 PM
      }).length;
      const eveningSlot = totalPatients - morningSlot;

      setOPDStats({
        totalPatients,
        morningSlot,
        eveningSlot
      });
    }
  };

  // Fetch today's IPD visits and stats
  useEffect(() => {
    fetchTodayIPDData();
  }, []);

  // Fetch today's OPD visits and stats
  useEffect(() => {
    fetchTodayOPDData();
  }, []);

  // Refresh data every 30 seconds to catch new visits
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "today-ipd-dashboard") {
        fetchTodayIPDData();
      } else if (activeTab === "today-opd-dashboard") {
        fetchTodayOPDData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Debounce search to avoid too many database queries
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 0) {
        setIsSearching(true);
        try {
          const { data, error } = await supabase
            .from('patients')
            .select('id, name, unique_id')
            .ilike('name', `%${searchTerm}%`)
            .order('name')
            .limit(5);

          if (!error && data) {
            setSearchResults(data);
          } else {
            console.error('Search error:', error);
          }
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handler to add diagnosis
  const handleAddDiagnosis = async (name: string, formData: Partial<Diagnosis> | undefined) => {
    const { data, error } = await supabase.from('diagnosis').insert([{
      name: name,
      complication1: formData?.complication1 || '',
      complication2: formData?.complication2 || '',
      complication3: formData?.complication3 || '',
      complication4: formData?.complication4 || ''
    }]);
    if (error) {
      window.alert("Error adding diagnosis: " + error.message);
    } else {
      const { data: newDiagnoses } = await supabase.from('diagnosis').select('*');
      setDiagnoses((newDiagnoses as Diagnosis[]) || []);
      setShowAddDiagnosis(false);
      window.alert("Diagnosis Added Successfully!");
    }
  };

  // Handler to update diagnosis
  const handleEditDiagnosis = async (id: string, name: string, formData: Partial<Diagnosis> | undefined) => {
    console.log("EDIT DIAGNOSIS", { id, name, formData });
    const { data, error } = await supabase
      .from('diagnosis')
      .update({
        name: name,
        complication1: formData?.complication1 || '',
        complication2: formData?.complication2 || '',
        complication3: formData?.complication3 || '',
        complication4: formData?.complication4 || ''
      })
      .eq('id', id);

    if (error) {
      window.alert("Error updating diagnosis: " + error.message);
    } else {
      const { data: newDiagnoses } = await supabase.from('diagnosis').select('*');
      setDiagnoses((newDiagnoses as Diagnosis[]) || []);
      setEditDiagnosis(null);
      window.alert("Diagnosis Updated Successfully!");
    }
  };

  // Handler to delete diagnosis
  const handleDeleteDiagnosis = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this diagnosis?")) return;
    const { error } = await supabase.from('diagnosis').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting diagnosis: " + error.message);
    } else {
      const { data: newDiagnoses } = await supabase.from('diagnosis').select('*');
      setDiagnoses((newDiagnoses as Diagnosis[]) || []);
    }
  };

  // Handler to add CGHS surgery
  const handleAddCGHSSurgery = async (formData: Partial<CGHSSurgery>) => {
    const { data, error } = await supabase.from('cghs_surgery').insert([formData]);
    if (error) {
      window.alert("Error adding surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('cghs_surgery').select('*');
      setCGHSSurgeries((newSurgeries as CGHSSurgery[]) || []);
      setShowAddCGHSSurgery(false);
      window.alert("Surgery Added Successfully!");
    }
  };

  // Handler to update CGHS surgery
  const handleEditCGHSSurgery = async (id: string, formData: Partial<CGHSSurgery>) => {
    const { data, error } = await supabase.from('cghs_surgery').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('cghs_surgery').select('*');
      setCGHSSurgeries((newSurgeries as CGHSSurgery[]) || []);
      setEditCGHSSurgery(null);
      window.alert("Surgery Updated Successfully!");
    }
  };

  // Handler to delete CGHS surgery
  const handleDeleteCGHSSurgery = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this surgery?")) return;
    const { error } = await supabase.from('cghs_surgery').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('cghs_surgery').select('*');
      setCGHSSurgeries((newSurgeries as CGHSSurgery[]) || []);
    }
  };

  // Handler to add Yojna surgery
  const handleAddYojnaSurgery = async (formData: Partial<YojnaSurgery>) => {
    const { data, error } = await supabase.from('yojna_surgery').insert([formData]);
    if (error) {
      window.alert("Error adding surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('yojna_surgery').select('*');
      setYojnaSurgeries((newSurgeries as YojnaSurgery[]) || []);
      setShowAddYojnaSurgery(false);
      window.alert("Surgery Added Successfully!");
    }
  };

  // Handler to update Yojna surgery
  const handleEditYojnaSurgery = async (id: string, formData: Partial<YojnaSurgery>) => {
    const { data, error } = await supabase.from('yojna_surgery').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('yojna_surgery').select('*');
      setYojnaSurgeries((newSurgeries as YojnaSurgery[]) || []);
      setEditYojnaSurgery(null);
      window.alert("Surgery Updated Successfully!");
    }
  };

  // Handler to delete Yojna surgery
  const handleDeleteYojnaSurgery = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this surgery?")) return;
    const { error } = await supabase.from('yojna_surgery').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('yojna_surgery').select('*');
      setYojnaSurgeries((newSurgeries as YojnaSurgery[]) || []);
    }
  };

  // Handler to add Private surgery
  const handleAddPrivateSurgery = async (formData: Partial<PrivateSurgery>) => {
    const { data, error } = await supabase.from('private_surgery').insert([formData]);
    if (error) {
      window.alert("Error adding surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('private_surgery').select('*');
      setPrivateSurgeries((newSurgeries as PrivateSurgery[]) || []);
      setShowAddPrivateSurgery(false);
      window.alert("Surgery Added Successfully!");
    }
  };

  // Handler to update Private surgery
  const handleEditPrivateSurgery = async (id: string, formData: Partial<PrivateSurgery>) => {
    const { data, error } = await supabase.from('private_surgery').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('private_surgery').select('*');
      setPrivateSurgeries((newSurgeries as PrivateSurgery[]) || []);
      setEditPrivateSurgery(null);
      window.alert("Surgery Updated Successfully!");
    }
  };

  // Handler to delete Private surgery
  const handleDeletePrivateSurgery = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this surgery?")) return;
    const { error } = await supabase.from('private_surgery').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting surgery: " + error.message);
    } else {
      const { data: newSurgeries } = await supabase.from('private_surgery').select('*');
      setPrivateSurgeries((newSurgeries as PrivateSurgery[]) || []);
    }
  };

  // Handler to add complication
  const handleAddComplication = async (formData: Partial<Complication>) => {
    const { data, error } = await supabase.from('complication').insert([formData]);
    if (error) {
      window.alert("Error adding complication: " + error.message);
    } else {
      const { data: newComplications } = await supabase.from('complication').select('*');
      setComplications((newComplications as Complication[]) || []);
      setShowAddComplication(false);
      window.alert("Complication Added Successfully!");
    }
  };

  // Handler to update complication
  const handleEditComplication = async (id: string, formData: Partial<Complication>) => {
    const { data, error } = await supabase.from('complication').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating complication: " + error.message);
    } else {
      const { data: newComplications } = await supabase.from('complication').select('*');
      setComplications((newComplications as Complication[]) || []);
      setEditComplication(null);
      window.alert("Complication Updated Successfully!");
    }
  };

  // Handler to delete complication
  const handleDeleteComplication = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this complication?")) return;
    const { error } = await supabase.from('complication').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting complication: " + error.message);
    } else {
      const { data: newComplications } = await supabase.from('complication').select('*');
      setComplications((newComplications as Complication[]) || []);
    }
  };

  // Handler to add radiology test
  const handleAddRadiology = async (formData: Partial<RadiologyTest>) => {
    // Transform the data to match investigations table structure
    const investigationData = {
      name: formData.name,
      code: formData.code,
      rate: parseFloat(formData.cost || '0')
    };

    const { data, error } = await supabase.from('investigations').insert([investigationData]);
    if (error) {
      window.alert("Error adding test: " + error.message);
    } else {
      // Refresh the radiology list
      const { data: newTests } = await supabase
        .from('investigations')
        .select('*')
        .like('code', 'R-%')
        .order('code');
      if (newTests) {
        const radiologyData = newTests.map(item => ({
          id: item.id,
          name: item.name,
          cost: item.rate?.toString() || '0',
          code: item.code
        }));
        setRadiology(radiologyData);
      }
      setShowAddRadiology(false);
      window.alert("Radiology Test Added Successfully!");
    }
  };

  // Handler to update radiology test
  const handleEditRadiology = async (id: string, formData: Partial<RadiologyTest>) => {
    // Transform the data to match investigations table structure
    const investigationData = {
      name: formData.name,
      code: formData.code,
      rate: parseFloat(formData.cost || '0')
    };

    const { data, error } = await supabase.from('investigations').update(investigationData).eq('id', id);
    if (error) {
      window.alert("Error updating test: " + error.message);
    } else {
      // Refresh the radiology list
      const { data: newTests } = await supabase
        .from('investigations')
        .select('*')
        .like('code', 'R-%')
        .order('code');
      if (newTests) {
        const radiologyData = newTests.map(item => ({
          id: item.id,
          name: item.name,
          cost: item.rate?.toString() || '0',
          code: item.code
        }));
        setRadiology(radiologyData);
      }
      setEditRadiology(null);
      window.alert("Radiology Test Updated Successfully!");
    }
  };

  // Handler to delete radiology test
  const handleDeleteRadiology = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    const { error } = await supabase.from('investigations').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting test: " + error.message);
    } else {
      // Refresh the radiology list
      const { data: newTests } = await supabase
        .from('investigations')
        .select('*')
        .like('code', 'R-%')
        .order('code');
      if (newTests) {
        const radiologyData = newTests.map(item => ({
          id: item.id,
          name: item.name,
          cost: item.rate?.toString() || '0',
          code: item.code
        }));
        setRadiology(radiologyData);
      }
    }
  };

  // Handler to add lab test
  const handleAddLab = async (formData: Partial<LabTest>) => {
    const { data, error } = await supabase.from('lab').insert([formData]);
    if (error) {
      window.alert("Error adding test: " + error.message);
    } else {
      const { data: newTests } = await supabase.from('lab').select('*');
      setLab((newTests as LabTest[]) || []);
      setShowAddLab(false);
      window.alert("Lab Test Added Successfully!");
    }
  };

  // Handler to update lab test
  const handleEditLab = async (id: string, formData: Partial<LabTest>) => {
    const { data, error } = await supabase.from('lab').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating test: " + error.message);
    } else {
      const { data: newTests } = await supabase.from('lab').select('*');
      setLab((newTests as LabTest[]) || []);
      setEditLab(null);
      window.alert("Lab Test Updated Successfully!");
    }
  };

  // Handler to delete lab test
  const handleDeleteLab = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    const { error } = await supabase.from('lab').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting test: " + error.message);
    } else {
      const { data: newTests } = await supabase.from('lab').select('*');
      setLab((newTests as LabTest[]) || []);
    }
  };

  // Handler to add other investigation
  const handleAddOtherInvestigation = async (formData: Partial<OtherInvestigation>) => {
    const { error } = await supabase.from('other_investigations').insert([formData]);
    if (error) {
      window.alert("Error adding: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('other_investigations').select('*');
      setOtherInvestigations((newData as OtherInvestigation[]) || []);
      setShowAddOtherInvestigation(false);
      window.alert("Other Investigation Added Successfully!");
    }
  };

  // Handler to update other investigation
  const handleEditOtherInvestigation = async (id: string, formData: Partial<OtherInvestigation>) => {
    const { error } = await supabase.from('other_investigations').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('other_investigations').select('*');
      setOtherInvestigations((newData as OtherInvestigation[]) || []);
      setEditOtherInvestigation(null);
      window.alert("Other Investigation Updated Successfully!");
    }
  };

  // Handler to delete other investigation
  const handleDeleteOtherInvestigation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    const { error } = await supabase.from('other_investigations').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('other_investigations').select('*');
      setOtherInvestigations((newData as OtherInvestigation[]) || []);
    }
  };

  const handleAddMedication = async (formData: Partial<Medication>) => {
    const { error } = await supabase.from('medications').insert([formData]);
    if (error) {
      window.alert("Error adding: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('medications').select('*');
      setMedications((newData as Medication[]) || []);
      setShowAddMedication(false);
      window.alert("Medication Added Successfully!");
    }
  };

  const handleEditMedication = async (id: string, formData: Partial<Medication>) => {
    const { error } = await supabase.from('medications').update(formData).eq('id', id);
    if (error) {
      window.alert("Error updating: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('medications').select('*');
      setMedications((newData as Medication[]) || []);
      setEditMedication(null);
      window.alert("Medication Updated Successfully!");
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) {
      window.alert("Error deleting: " + (error.message || JSON.stringify(error)));
    } else {
      const { data: newData } = await supabase.from('medications').select('*');
      setMedications((newData as Medication[]) || []);
    }
  };

  // Fetch latest updates from GitHub
  const fetchLatestUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const res = await fetch("https://api.github.com/repos/chatgptnotes/adamrit.in/commits?per_page=5");
      const data = await res.json();
      setUpdates(data);
    } catch (err) {
      setUpdates([]);
    } finally {
      setLoadingUpdates(false);
    }
  };

  // Optionally, fetch on mount
  useEffect(() => {
    fetchLatestUpdates();
  }, []);

  // Remove fetchIPDPatients and fetchOPDPatients since we now use todayIPDVisits and todayOPDVisits for dashboards

  // Synchronize activeTab with tabFromUrl
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  function getComplicationName(id) {
    if (!id) return "";
    const comp = complications.find(c => c.id === id);
    return comp ? comp.name : "";
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Fetch all complications for lookup
        const { data: complications, error: compError } = await supabase
          .from('complication')
          .select('id, name');

        if (compError) throw new Error('Error fetching complications: ' + compError.message);

        // Map complication names to IDs
        const nameToId = {};
        complications.forEach(c => {
          if (c.name) {
            nameToId[c.name.toLowerCase().trim()] = c.id;
          }
        });

        // Process each row and filter out invalid ones
        const invalidRows = [];
        const validDiagnoses = jsonData
          .filter(row => row.name && row.name.trim() !== '')
          .map(row => {
            const comp1 = row.complication1 ? row.complication1.toLowerCase().trim() : null;
            const comp2 = row.complication2 ? row.complication2.toLowerCase().trim() : null;
            const comp3 = row.complication3 ? row.complication3.toLowerCase().trim() : null;
            const comp4 = row.complication4 ? row.complication4.toLowerCase().trim() : null;

            // Check if all complications are valid (or blank)
            const isValid =
              (!comp1 || nameToId[comp1]) &&
              (!comp2 || nameToId[comp2]) &&
              (!comp3 || nameToId[comp3]) &&
              (!comp4 || nameToId[comp4]);

            if (!isValid) {
              invalidRows.push(row);
              return null;
            }

            return {
              name: row.name.trim(),
              complication1: comp1 ? nameToId[comp1] || null : null,
              complication2: comp2 ? nameToId[comp2] || null : null,
              complication3: comp3 ? nameToId[comp3] || null : null,
              complication4: comp4 ? nameToId[comp4] || null : null,
            };
          })
          .filter(d => d && d.name);

        if (validDiagnoses.length === 0) {
          alert(
            'No valid diagnoses found in the file. Please check the data.\\n' +
            (invalidRows.length > 0
              ? 'Invalid rows (complication not found):\\n' +
                invalidRows.map(r => JSON.stringify(r)).join('\\n')
              : '')
          );
          return;
        }

        // Insert valid diagnoses into the table
        const { error: insertError } = await supabase
          .from('diagnosis')
          .insert(validDiagnoses);

        if (insertError) {
          throw new Error('Error uploading diagnoses: ' + insertError.message);
        }

        alert(`Successfully uploaded ${validDiagnoses.length} diagnoses!`);
        fetchDiagnoses(); // Refresh the list
      } catch (error) {
        alert(error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        {/* Hospital Name and Search */}
        <div className="h-16 flex items-center justify-between px-6">
          <h1 className="text-2xl font-bold text-blue-600">Hope Hospital</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchValue}
              onChange={handleSearch}
              placeholder="Search patients..."
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-full w-full"
            />

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto z-50">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between"
                    onClick={() => {
                      router.push(`/patient-management/${patient.id}`);
                      setSearchResults([]);
                      setSearchValue('');
                    }}
                  >
                    <span className="font-medium">{patient.name}</span>
                    <span className="text-sm text-gray-500">{patient.unique_id}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading Indicator */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Modern Navigation */}
        <nav className="px-6 pb-3">
          <ul className="flex space-x-1">
            <li>
              <button
                onClick={() => router.push('/?tab=patient')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "patient"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <LayoutDashboard className="w-4 h-4 inline-block mr-2" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=today-ipd-dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "today-ipd-dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Monitor className="w-4 h-4 inline-block mr-2" />
                IPD
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=today-opd-dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "today-opd-dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-2" />
                OPD
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=patient-dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "patient-dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Users className="w-4 h-4 inline-block mr-2" />
                Patients
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=doctor-master')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "doctor-master"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Stethoscope className="w-4 h-4 inline-block mr-2" />
                Doctors
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=reports')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "reports"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <BarChart3 className="w-4 h-4 inline-block mr-2" />
                Reports
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/?tab=settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "settings"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Settings className="w-4 h-4 inline-block mr-2" />
                Settings
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        {activeTab === "today-ipd-dashboard" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Today's IPD Dashboard</h3>
                <div className="flex gap-2">
                  <Link href="/visit/IPD-registration" legacyBehavior>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <PlusCircle className="h-4 w-4" />
                      New IPD Visit
                    </Button>
                  </Link>
                  <Button
                    onClick={fetchTodayIPDData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm text-blue-700 font-medium mb-2">Total IPD Patients</h4>
                  <p className="text-3xl font-bold">{ipdStats.totalPatients}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm text-green-700 font-medium mb-2">Admissions Today</h4>
                  <p className="text-3xl font-bold">{ipdStats.admissionsToday}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm text-purple-700 font-medium mb-2">Discharges Today</h4>
                  <p className="text-3xl font-bold">{ipdStats.dischargesToday}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IPD Visit ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room No.</th> */}
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age / Gender</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todayIPDVisits.length > 0 ? (
                      todayIPDVisits.map((visit, index) => (
                        <tr key={visit.id || index}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Link
                              href={`/patient-management/${visit.patients?.id}`}
                              className="text-blue-600 underline"
                              legacyBehavior>
                              {visit.visit_id || `IPD-${String(index + 1).padStart(4, '0')}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.patients?.unique_id || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.patients?.name || '-'}</td>
                          {/* <td className="px-4 py-2 whitespace-nowrap">{visit.visit_date || '-'}</td> */}
                          <td className="px-4 py-2 whitespace-nowrap">{visit.visit_date ? new Date(visit.visit_date).toLocaleDateString('en-GB') : '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.patients?.age || '-'} / {visit.patients?.gender || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Link href={`/patient-management/${visit.patients?.id}`} className="text-blue-600 underline">
                              View Patient
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No IPD visits found for today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "today-opd-dashboard" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Today's OPD Dashboard</h3>
                <div className="flex gap-2">
                  <Link href="/visit/OPD-registration" legacyBehavior>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <PlusCircle className="h-4 w-4" />
                      New OPD Visit
                    </Button>
                  </Link>
                  <Button
                    onClick={fetchTodayOPDData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm text-blue-700 font-medium mb-2">Total OPD Patients</h4>
                  <p className="text-3xl font-bold">{opdStats.totalPatients}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm text-green-700 font-medium mb-2">Morning Slot</h4>
                  <p className="text-3xl font-bold">{opdStats.morningSlot}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm text-purple-700 font-medium mb-2">Evening Slot</h4>
                  <p className="text-3xl font-bold">{opdStats.eveningSlot}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPD Visit ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todayOPDVisits.length > 0 ? (
                      todayOPDVisits.map((visit, index) => (
                        <tr key={visit.id || index}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Link
                              href={`/patient-management/${visit.patients?.id}`}
                              className="text-blue-600 underline"
                              legacyBehavior>
                              {visit.visit_id || `OPD-${String(index + 1).padStart(4, '0')}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{`T-${String(index + 1).padStart(3, '0')}`}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.patients?.unique_id || 'N/A'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.patients?.name || 'N/A'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {new Date(visit.created_at).getHours() < 14 ? 'Morning' : 'Evening'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.department || visit.visit_type || 'OPD'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{visit.appointment_with || visit.doctor_name || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{visit.status || 'Waiting'}</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Link
                                href={`/visit/IPD-registration?patientId=${visit.patients?.unique_id}&name=${encodeURIComponent(visit.patients?.name || '')}&uniqueId=${visit.patients?.unique_id}`}
                                legacyBehavior>
                                <button
                                  className="flex items-center justify-center p-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full"
                                  title="Register New IPD Visit"
                                >
                                  <span className="text-xs font-bold">→IPD</span>
                                </button>
                              </Link>
                              <Link href={`/patient-management/${visit.patients?.id}`} legacyBehavior>
                                <button
                                  className="flex items-center justify-center p-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full"
                                  title="View Patient Details"
                                >
                                  <span className="text-xs font-bold">View</span>
                                </button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          No OPD visits found for today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "patient" && (
          <div className="flex-1 p-8">
            <h1 className="text-3xl font-bold mb-6">Welcome to Hope Hospital</h1>

            {/* Recent Updates Section */}
            <div className="grid gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h2 className="text-2xl font-semibold mb-4 text-blue-800 flex items-center gap-2">
                  <ActivitySquare className="h-6 w-6" />
                  Recent Updates & New Features
                  <button
                    onClick={fetchLatestUpdates}
                    className="ml-2 p-2 rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition flex items-center justify-center"
                    title="Refresh updates"
                    aria-label="Refresh updates"
                    disabled={loadingUpdates}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {loadingUpdates ? (
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    ) : (
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                </h2>
                <div className="space-y-4">
                  {updates && updates.length > 0 ? (
                    updates.map((commit, idx) => (
                      <div key={commit.sha} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{commit.commit.message.split("\n")[0]}</h3>
                            <p className="text-xs text-gray-500 mt-1">By {commit.commit.author.name} on {new Date(commit.commit.author.date).toLocaleDateString()}</p>
                            <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">View Commit</a>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : loadingUpdates ? (
                    <div className="text-center text-blue-600">Loading updates...</div>
                  ) : (
                    <div className="text-center text-gray-500">No recent updates found.</div>
                  )}
                </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h2 className="text-2xl font-semibold mb-4 text-purple-800 flex items-center gap-2">
                  <PlusCircle className="h-6 w-6" />
                  Suggest New Features
                </h2>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <p className="text-sm text-gray-600 mb-4">
                    We're constantly improving! Share your ideas for new features or improvements.
                    Your suggestions will be sent directly to Dr. Murali for review.
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const suggestion = (form.elements.namedItem('suggestion') as HTMLTextAreaElement).value;
                    if (suggestion.trim()) {
                      try {
                        // Save to database
                        const { error } = await supabase
                          .from('feature_suggestions')
                          .insert([{ suggestion: suggestion.trim() }]);

                        if (error) {
                          alert('Error saving suggestion: ' + error.message);
                        } else {
                          // Send WhatsApp notification
                          await sendWhatsAppNotification(suggestion.trim());

                          alert('Thank you for your suggestion! We will review it and get back to you soon.');
                          form.reset();
                        }
                      } catch (err) {
                        alert('Error saving suggestion. Please try again.');
                        console.error('Error:', err);
                      }
                    }
                  }}>
                    <textarea
                      name="suggestion"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Describe your feature idea or improvement suggestion..."
                      required
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        Send Suggestion to Dr. Murali
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => router.push('/?tab=patient-registration')}
                    className="flex flex-col items-center gap-2 p-4 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    <UserPlus className="h-8 w-8" />
                    <span className="text-sm font-medium">Register Patient</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/?tab=today-ipd-dashboard')}
                    className="flex flex-col items-center gap-2 p-4 h-auto bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                  >
                    <Monitor className="h-8 w-8" />
                    <span className="text-sm font-medium">IPD Dashboard</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/?tab=today-opd-dashboard')}
                    className="flex flex-col items-center gap-2 p-4 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                  >
                    <Calendar className="h-8 w-8" />
                    <span className="text-sm font-medium">OPD Dashboard</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/?tab=reports')}
                    className="flex flex-col items-center gap-2 p-4 h-auto bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
                  >
                    <BarChart3 className="h-8 w-8" />
                    <span className="text-sm font-medium">View Reports</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "patient-dashboard" && <PatientRegistryList />}
        {activeTab === "diagnosis-master" && (
          <div className="w-full px-0">
            <div className="border rounded-lg p-4 w-full max-w-none">
              <h3 className="text-lg font-medium mb-4">Diagnosis Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="diagnosis-upload" className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">Upload Excel/CSV</label>
                <input
                  id="diagnosis-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                  onClick={() => setShowAddDiagnosis(true)}
                >
                  + Add More
                </button>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={diagnosisSearchTerm}
                  onChange={e => { setDiagnosisSearchTerm(e.target.value); setDiagnosisPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Complication 1</TableHead>
                      <TableHead>Complication 2</TableHead>
                      <TableHead>Complication 3</TableHead>
                      <TableHead>Complication 4</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnoses.map((diagnosis, idx) => (
                      <TableRow key={diagnosis.id || idx}>
                        <TableCell>{diagnosis.name}</TableCell>
                        <TableCell>{getComplicationName(diagnosis.complication1)}</TableCell>
                        <TableCell>{getComplicationName(diagnosis.complication2)}</TableCell>
                        <TableCell>{getComplicationName(diagnosis.complication3)}</TableCell>
                        <TableCell>{getComplicationName(diagnosis.complication4)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditDiagnosis(diagnosis)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDiagnosis(diagnosis.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mb-2 text-sm text-gray-500">
                Showing {diagnoses.length} of {diagnosisTotalRows} results
              </p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDiagnosisPage(diagnosisPage - 1)}
                  disabled={diagnosisPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {diagnosisPage} of {Math.max(1, Math.ceil(diagnosisTotalRows / diagnosisPageSize))}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setDiagnosisPage(diagnosisPage + 1)}
                  disabled={diagnosisPage >= Math.ceil(diagnosisTotalRows / diagnosisPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
            {showAddDiagnosis && (
              <AddDiagnosisForm
                onCancel={() => setShowAddDiagnosis(false)}
                onSubmit={handleAddDiagnosis}
              />
            )}
            {editDiagnosis && (
              <AddDiagnosisForm
                onCancel={() => setEditDiagnosis(null)}
                onSubmit={(name, formData) => handleEditDiagnosis(editDiagnosis.id, name, formData)}
                initialData={{
                  name: editDiagnosis.name || "",
                  complication1: editDiagnosis.complication1 || "",
                  complication2: editDiagnosis.complication2 || "",
                  complication3: editDiagnosis.complication3 || "",
                  complication4: editDiagnosis.complication4 || "",
                }}
              />
            )}
          </div>
        )}
        {activeTab === "cghs-surgery-master" && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">CGHS Surgery Master</h1>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAddCGHSSurgery(true)}
                  className="ml-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add CGHS Surgery
                </Button>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchCGHS}
                  onChange={e => { setSearchCGHS(e.target.value); setCGHSPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>CGHS Code</TableHead>
                    <TableHead>Package Amount</TableHead>
                    <TableHead>Complication 1</TableHead>
                    <TableHead>Complication 2</TableHead>
                    <TableHead>Complication 3</TableHead>
                    <TableHead>Complication 4</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cghsSurgeries.map((surgery, index) => (
                    <TableRow key={surgery.id}>
                      <TableCell className="font-medium">{surgery.name}</TableCell>
                      <TableCell>{surgery.code}</TableCell>
                      <TableCell>{surgery.amount}</TableCell>
                      <TableCell>{surgery.complication1}</TableCell>
                      <TableCell>{surgery.complication2}</TableCell>
                      <TableCell>{surgery.complication3}</TableCell>
                      <TableCell>{surgery.complication4}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditCGHSSurgery(surgery)}>
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCGHSSurgery(surgery.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mb-2 text-sm text-gray-500">
              Showing {cghsSurgeries.length} of {cghsTotalRows} results
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                disabled={cghsPage === 1}
                onClick={() => setCGHSPage(cghsPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {cghsPage} of {Math.ceil(cghsTotalRows / cghsPageSize)}
              </span>
              <button
                disabled={cghsPage * cghsPageSize >= cghsTotalRows}
                onClick={() => setCGHSPage(cghsPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
            {/* Add/Edit Modal */}
            {(showAddCGHSSurgery || editCGHSSurgery) && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                  <h3 className="text-lg font-medium mb-4">{editCGHSSurgery ? 'Edit' : 'Add'} CGHS Surgery</h3>
                  <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const nameEl = formEl.elements.namedItem('name') as HTMLInputElement;
                    const codeEl = formEl.elements.namedItem('code') as HTMLInputElement;
                    const amountEl = formEl.elements.namedItem('amount') as HTMLInputElement;
                    const complication1El = formEl.elements.namedItem('complication1') as HTMLInputElement;
                    const complication2El = formEl.elements.namedItem('complication2') as HTMLInputElement;
                    const complication3El = formEl.elements.namedItem('complication3') as HTMLInputElement;
                    const complication4El = formEl.elements.namedItem('complication4') as HTMLInputElement;
                    const surgeryData = {
                      name: nameEl.value,
                      code: codeEl.value,
                      amount: amountEl.value,
                      complication1: complication1El.value,
                      complication2: complication2El.value,
                      complication3: complication3El.value,
                      complication4: complication4El.value
                    };
                    if (editCGHSSurgery) {
                      await handleEditCGHSSurgery(editCGHSSurgery.id, surgeryData);
                    } else {
                      await handleAddCGHSSurgery(surgeryData);
                    }
                  }}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-1">Name</label>
                        <input name="name" className="border rounded px-2 py-1 w-full" required defaultValue={editCGHSSurgery?.name || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">CGHS Code</label>
                        <input name="code" className="border rounded px-2 py-1 w-full" required defaultValue={editCGHSSurgery?.code || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Package Amount</label>
                        <input name="amount" className="border rounded px-2 py-1 w-full" required defaultValue={editCGHSSurgery?.amount || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 1</label>
                        <input name="complication1" className="border rounded px-2 py-1 w-full" defaultValue={editCGHSSurgery?.complication1 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 2</label>
                        <input name="complication2" className="border rounded px-2 py-1 w-full" defaultValue={editCGHSSurgery?.complication2 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 3</label>
                        <input name="complication3" className="border rounded px-2 py-1 w-full" defaultValue={editCGHSSurgery?.complication3 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 4</label>
                        <input name="complication4" className="border rounded px-2 py-1 w-full" defaultValue={editCGHSSurgery?.complication4 || ''} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="px-3 py-1 rounded border" onClick={() => { setShowAddCGHSSurgery(false); setEditCGHSSurgery(null); }}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{editCGHSSurgery ? 'Update' : 'Add'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "yojna-surgery-master" && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Yojna Surgery Master</h1>
              <Button
                onClick={() => setShowAddYojnaSurgery(true)}
                className="ml-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Yojna Surgery
              </Button>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Yojna Code</TableHead>
                    <TableHead>Package Amount</TableHead>
                    <TableHead>Complication 1</TableHead>
                    <TableHead>Complication 2</TableHead>
                    <TableHead>Complication 3</TableHead>
                    <TableHead>Complication 4</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yojnaSurgeries.map((surgery, index) => (
                    <TableRow key={surgery.id}>
                      <TableCell className="font-medium">{surgery.name}</TableCell>
                      <TableCell>{surgery.code}</TableCell>
                      <TableCell>{surgery.amount}</TableCell>
                      <TableCell>{surgery.complication1}</TableCell>
                      <TableCell>{surgery.complication2}</TableCell>
                      <TableCell>{surgery.complication3}</TableCell>
                      <TableCell>{surgery.complication4}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditYojnaSurgery(surgery)}>
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteYojnaSurgery(surgery.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Add/Edit Modal */}
            {(showAddYojnaSurgery || editYojnaSurgery) && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                  <h3 className="text-lg font-medium mb-4">{editYojnaSurgery ? 'Edit' : 'Add'} Yojna Surgery</h3>
                  <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const nameEl = formEl.elements.namedItem('name') as HTMLInputElement;
                    const codeEl = formEl.elements.namedItem('code') as HTMLInputElement;
                    const amountEl = formEl.elements.namedItem('amount') as HTMLInputElement;
                    const complication1El = formEl.elements.namedItem('complication1') as HTMLInputElement;
                    const complication2El = formEl.elements.namedItem('complication2') as HTMLInputElement;
                    const complication3El = formEl.elements.namedItem('complication3') as HTMLInputElement;
                    const complication4El = formEl.elements.namedItem('complication4') as HTMLInputElement;
                    const surgeryData = {
                      name: nameEl.value,
                      code: codeEl.value,
                      amount: amountEl.value,
                      complication1: complication1El.value,
                      complication2: complication2El.value,
                      complication3: complication3El.value,
                      complication4: complication4El.value
                    };
                    if (editYojnaSurgery) {
                      await handleEditYojnaSurgery(editYojnaSurgery.id, surgeryData);
                    } else {
                      await handleAddYojnaSurgery(surgeryData);
                    }
                  }}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-1">Name</label>
                        <input name="name" className="border rounded px-2 py-1 w-full" required defaultValue={editYojnaSurgery?.name || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Yojna Code</label>
                        <input name="code" className="border rounded px-2 py-1 w-full" required defaultValue={editYojnaSurgery?.code || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Package Amount</label>
                        <input name="amount" className="border rounded px-2 py-1 w-full" required defaultValue={editYojnaSurgery?.amount || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 1</label>
                        <input name="complication1" className="border rounded px-2 py-1 w-full" defaultValue={editYojnaSurgery?.complication1 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 2</label>
                        <input name="complication2" className="border rounded px-2 py-1 w-full" defaultValue={editYojnaSurgery?.complication2 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 3</label>
                        <input name="complication3" className="border rounded px-2 py-1 w-full" defaultValue={editYojnaSurgery?.complication3 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 4</label>
                        <input name="complication4" className="border rounded px-2 py-1 w-full" defaultValue={editYojnaSurgery?.complication4 || ''} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="px-3 py-1 rounded border" onClick={() => { setShowAddYojnaSurgery(false); setEditYojnaSurgery(null); }}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{editYojnaSurgery ? 'Update' : 'Add'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "private-surgery-master" && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Private Surgery Master</h1>
              <Button
                onClick={() => setShowAddPrivateSurgery(true)}
                className="ml-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Private Surgery
              </Button>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Private Code</TableHead>
                    <TableHead>Package Amount</TableHead>
                    <TableHead>Complication 1</TableHead>
                    <TableHead>Complication 2</TableHead>
                    <TableHead>Complication 3</TableHead>
                    <TableHead>Complication 4</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privateSurgeries.map((surgery, index) => (
                    <TableRow key={surgery.id}>
                      <TableCell className="font-medium">{surgery.name}</TableCell>
                      <TableCell>{surgery.code}</TableCell>
                      <TableCell>{surgery.amount}</TableCell>
                      <TableCell>{surgery.complication1}</TableCell>
                      <TableCell>{surgery.complication2}</TableCell>
                      <TableCell>{surgery.complication3}</TableCell>
                      <TableCell>{surgery.complication4}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditPrivateSurgery(surgery)}>
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePrivateSurgery(surgery.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Add/Edit Modal */}
            {(showAddPrivateSurgery || editPrivateSurgery) && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                  <h3 className="text-lg font-medium mb-4">{editPrivateSurgery ? 'Edit' : 'Add'} Private Surgery</h3>
                  <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const nameEl = formEl.elements.namedItem('name') as HTMLInputElement;
                    const codeEl = formEl.elements.namedItem('code') as HTMLInputElement;
                    const amountEl = formEl.elements.namedItem('amount') as HTMLInputElement;
                    const complication1El = formEl.elements.namedItem('complication1') as HTMLInputElement;
                    const complication2El = formEl.elements.namedItem('complication2') as HTMLInputElement;
                    const complication3El = formEl.elements.namedItem('complication3') as HTMLInputElement;
                    const complication4El = formEl.elements.namedItem('complication4') as HTMLInputElement;
                    const surgeryData = {
                      name: nameEl.value,
                      code: codeEl.value,
                      amount: amountEl.value,
                      complication1: complication1El.value,
                      complication2: complication2El.value,
                      complication3: complication3El.value,
                      complication4: complication4El.value
                    };
                    if (editPrivateSurgery) {
                      await handleEditPrivateSurgery(editPrivateSurgery.id, surgeryData);
                    } else {
                      await handleAddPrivateSurgery(surgeryData);
                    }
                  }}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-1">Name</label>
                        <input name="name" className="border rounded px-2 py-1 w-full" required defaultValue={editPrivateSurgery?.name || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Private Code</label>
                        <input name="code" className="border rounded px-2 py-1 w-full" required defaultValue={editPrivateSurgery?.code || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Package Amount</label>
                        <input name="amount" className="border rounded px-2 py-1 w-full" required defaultValue={editPrivateSurgery?.amount || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 1</label>
                        <input name="complication1" className="border rounded px-2 py-1 w-full" defaultValue={editPrivateSurgery?.complication1 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 2</label>
                        <input name="complication2" className="border rounded px-2 py-1 w-full" defaultValue={editPrivateSurgery?.complication2 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 3</label>
                        <input name="complication3" className="border rounded px-2 py-1 w-full" defaultValue={editPrivateSurgery?.complication3 || ''} />
                      </div>
                      <div>
                        <label className="block mb-1">Complication 4</label>
                        <input name="complication4" className="border rounded px-2 py-1 w-full" defaultValue={editPrivateSurgery?.complication4 || ''} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="px-3 py-1 rounded border" onClick={() => { setShowAddPrivateSurgery(false); setEditPrivateSurgery(null); }}>Cancel</button>
                      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{editPrivateSurgery ? 'Update' : 'Add'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "complications-master" && (
          <div className="w-full px-0">
            <div className="border rounded-lg p-4 w-full max-w-none">
              <h3 className="text-lg font-medium mb-4">Complication Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="complications-upload" className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">Upload Excel/CSV</label>
                <input id="complications-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden" />
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                  onClick={() => setShowAddComplication(true)}
                >
                  + Add More
                </button>
                <input
                  type="text"
                  placeholder="Search complication..."
                  value={complicationSearchTerm}
                  onChange={e => { setComplicationSearchTerm(e.target.value); setComplicationPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
              <table className="min-w-full w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Risk Level</th>
                    <th className="border px-2 py-1 text-left">Description</th>
                    <th className="border px-2 py-1 text-left">Foreign Key</th>
                    <th className="border px-2 py-1 text-left">Lab 1</th>
                    <th className="border px-2 py-1 text-left">Lab 2</th>
                    <th className="border px-2 py-1 text-left">Rad 1</th>
                    <th className="border px-2 py-1 text-left">Rad 2</th>
                    <th className="border px-2 py-1 text-left">MED1</th>
                    <th className="border px-2 py-1 text-left">MED2</th>
                    <th className="border px-2 py-1 text-left">MED3</th>
                    <th className="border px-2 py-1 text-left">MED4</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complications.map((complication, idx) => (
                    <tr key={complication.id || idx}>
                      <td className="border px-2 py-1">{complication.name}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${complication.risk_level === "High" ? "bg-red-100 text-red-800" :
                          complication.risk_level === "Medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                          {complication.risk_level}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{complication.description}</td>
                      <td className="border px-2 py-1">{complication.foreign_key || `COMP_${idx + 1}`}</td>
                      <td className="border px-2 py-1">{complication.lab1}</td>
                      <td className="border px-2 py-1">{complication.lab2}</td>
                      <td className="border px-2 py-1">{complication.rad1}</td>
                      <td className="border px-2 py-1">{complication.rad2}</td>
                      <td className="border px-2 py-1">{complication.med1}</td>
                      <td className="border px-2 py-1">{complication.med2}</td>
                      <td className="border px-2 py-1">{complication.med3}</td>
                      <td className="border px-2 py-1">{complication.med4}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button title="View">👁️</button>
                        <button title="Edit" onClick={() => setEditComplication(complication)}>✏️</button>
                        <button title="Delete" onClick={() => handleDeleteComplication(complication.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mb-2 text-sm text-gray-500">
                Showing {complications.length} of {complicationTotalRows} results
              </p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  className="px-3 py-1 border rounded"
                  disabled={complicationPage === 1}
                  onClick={() => setComplicationPage(complicationPage - 1)}
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {complicationPage} of {Math.max(1, Math.ceil(complicationTotalRows / complicationPageSize))}
                </span>
                <button
                  className="px-3 py-1 border rounded"
                  disabled={complicationPage >= Math.ceil(complicationTotalRows / complicationPageSize)}
                  onClick={() => setComplicationPage(complicationPage + 1)}
                >
                  Next
                </button>
              </div>
              {/* Add/Edit Modal */}
              {(showAddComplication || editComplication) && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                    <h3 className="text-lg font-medium mb-4">{editComplication ? 'Edit' : 'Add'} Complication</h3>
                    <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const nameEl = formEl.elements.namedItem('name') as HTMLInputElement;
                      const riskLevelEl = formEl.elements.namedItem('risk_level') as HTMLSelectElement;
                      const descriptionEl = formEl.elements.namedItem('description') as HTMLTextAreaElement;
                      const foreignKeyEl = formEl.elements.namedItem('foreign_key') as HTMLInputElement;
                      const lab1El = formEl.elements.namedItem('lab1') as HTMLInputElement;
                      const lab2El = formEl.elements.namedItem('lab2') as HTMLInputElement;
                      const rad1El = formEl.elements.namedItem('rad1') as HTMLInputElement;
                      const rad2El = formEl.elements.namedItem('rad2') as HTMLInputElement;
                      const med1El = formEl.elements.namedItem('med1') as HTMLInputElement;
                      const med2El = formEl.elements.namedItem('med2') as HTMLInputElement;
                      const med3El = formEl.elements.namedItem('med3') as HTMLInputElement;
                      const med4El = formEl.elements.namedItem('med4') as HTMLInputElement;

                      const formData = {
                        name: nameEl.value,
                        risk_level: riskLevelEl.value,
                        description: descriptionEl.value,
                        foreign_key: foreignKeyEl.value || `COMP_${Date.now()}`,
                        lab1: lab1El.value,
                        lab2: lab2El.value,
                        rad1: rad1El.value,
                        rad2: rad2El.value,
                        med1: med1El.value,
                        med2: med2El.value,
                        med3: med3El.value,
                        med4: med4El.value,
                      };

                      if (editComplication) {
                        await handleEditComplication(editComplication.id, formData);
                      } else {
                        const { data, error } = await supabase.from('complication').insert([formData]);
                        if (error) {
                          window.alert("Error adding complication: " + error.message);
                        } else {
                          const { data: newComplications } = await supabase.from('complication').select('*');
                          setComplications((newComplications as Complication[]) || []);
                          window.alert("Complication Added Successfully!");
                        }
                      }
                      setShowAddComplication(false);
                      setEditComplication(null);
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            defaultValue={editComplication?.name || ''}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Foreign Key</label>
                          <input
                            type="text"
                            name="foreign_key"
                            defaultValue={editComplication?.foreign_key || ''}
                            placeholder="COMP_XXX"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Risk Level</label>
                          <select
                            name="risk_level"
                            defaultValue={editComplication?.risk_level || 'Low'}
                            className="w-full p-2 border rounded"
                            required
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-1">Description</label>
                          <textarea name="description" className="border rounded px-2 py-1 w-full" rows={3} required defaultValue={editComplication?.description || ''}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block mb-1">Lab 1</label>
                            <input name="lab1" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.lab1 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Lab 2</label>
                            <input name="lab2" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.lab2 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Rad 1</label>
                            <input name="rad1" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.rad1 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Rad 2</label>
                            <input name="rad2" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.rad2 || ''} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div>
                            <label className="block mb-1">Med1</label>
                            <input name="med1" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.med1 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Med2</label>
                            <input name="med2" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.med2 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Med3</label>
                            <input name="med3" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.med3 || ''} />
                          </div>
                          <div>
                            <label className="block mb-1">Med4</label>
                            <input name="med4" className="border rounded px-2 py-1 w-full" defaultValue={editComplication?.med4 || ''} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" className="px-3 py-1 rounded border" onClick={() => { setShowAddComplication(false); setEditComplication(null); }}>Cancel</button>
                          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{editComplication ? 'Update' : 'Add'}</button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "radiology-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Radiology Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => setShowAddRadiology(true)}>+ Add More</button>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">CGHS Code</th>
                    <th className="border px-2 py-1 text-left">Cost</th>
                    <th className="border px-2 py-1 text-left">Non NABH Cost</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {radiology.map((test) => (
                    <tr key={test.id}>
                      <td className="border px-2 py-1">{test.name}</td>
                      <td className="border px-2 py-1">{test.code}</td>
                      <td className="border px-2 py-1">{test.cost}</td>
                      <td className="border px-2 py-1">{test.non_nabh_cost}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button title="Edit" onClick={() => setEditRadiology(test)}>✏️</button>
                        <button title="Delete" onClick={() => handleDeleteRadiology(test.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mb-2 text-sm text-gray-500">
                Showing {radiology.length} of {totalRows} results
              </p>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span style={{ margin: '0 8px' }}>
                  Page {page} of {Math.ceil(totalRows / pageSize)}
                </span>
                <button disabled={page === Math.ceil(totalRows / pageSize)} onClick={() => setPage(page + 1)}>Next</button>
              </div>
              {(showAddRadiology || editRadiology) && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                    <h3 className="text-lg font-medium mb-4">{editRadiology ? 'Edit' : 'Add'} Radiology Test</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const nameInput = formEl.querySelector<HTMLInputElement>('input[name="name"]');
                      const costInput = formEl.querySelector<HTMLInputElement>('input[name="cost"]');
                      const codeInput = formEl.querySelector<HTMLInputElement>('input[name="code"]');
                      const non_nabh_costInput = formEl.querySelector<HTMLInputElement>('input[name="non_nabh_cost"]');

                      if (!nameInput || !costInput || !codeInput) {
                        window.alert("Form elements not found");
                        return;
                      }

                      const testData = {
                        name: nameInput.value,
                        cost: costInput.value,
                        code: codeInput.value,
                        non_nabh_cost: non_nabh_costInput ? non_nabh_costInput.value : '',
                      };
                      if (editRadiology) {
                        await handleEditRadiology(editRadiology.id, testData);
                      } else {
                        await handleAddRadiology(testData);
                      }
                    }}>
                      <div className="mb-2">
                        <label className="block mb-1">Name</label>
                        <input name="name" className="border rounded px-2 py-1 w-full" required defaultValue={editRadiology?.name || ''} />
                      </div>
                      <div className="mb-2">
                        <label className="block mb-1">Cost</label>
                        <input name="cost" className="border rounded px-2 py-1 w-full" required defaultValue={editRadiology?.cost || ''} />
                      </div>
                      <div className="mb-2">
                        <label className="block mb-1">CGHS Code</label>
                        <input name="code" className="border rounded px-2 py-1 w-full" required defaultValue={editRadiology?.code || ''} />
                      </div>
                      <div className="mb-2">
                        <label className="block mb-1">Non NABH Cost</label>
                        <input name="non_nabh_cost" className="border rounded px-2 py-1 w-full" defaultValue={editRadiology?.non_nabh_cost || ''} />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" className="px-3 py-1 border rounded" onClick={() => {
                          setShowAddRadiology(false);
                          setEditRadiology(null);
                        }}>Cancel</button>
                        <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Save</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "lab-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Lab Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => setShowAddLab(true)}>+ Add More</button>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Cost</th>
                    <th className="border px-2 py-1 text-left">CGHS Code</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.map((test) => (
                    <tr key={test.id}>
                      <td className="border px-2 py-1">{test.name}</td>
                      <td className="border px-2 py-1">{test.cost}</td>
                      <td className="border px-2 py-1">{test.code}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button title="Edit" onClick={() => setEditLab(test)}>✏️</button>
                        <button title="Delete" onClick={() => handleDeleteLab(test.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mb-2 text-sm text-gray-500">
                Showing {lab.length} of {totalRows} results
              </p>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span style={{ margin: '0 8px' }}>
                  Page {page} of {Math.ceil(totalRows / pageSize)}
                </span>
                <button disabled={page === Math.ceil(totalRows / pageSize)} onClick={() => setPage(page + 1)}>Next</button>
              </div>
              {(showAddLab || editLab) && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                    <h3 className="text-lg font-medium mb-4">{editLab ? 'Edit' : 'Add'} Lab Test</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const nameInput = formEl.querySelector<HTMLInputElement>('input[name="name"]');
                      const costInput = formEl.querySelector<HTMLInputElement>('input[name="cost"]');
                      const codeInput = formEl.querySelector<HTMLInputElement>('input[name="code"]');

                      if (!nameInput || !costInput || !codeInput) {
                        window.alert("Form elements not found");
                        return;
                      }

                      const testData = {
                        name: nameInput.value,
                        cost: costInput.value,
                        code: codeInput.value,
                      };
                      if (editLab) {
                        await handleEditLab(editLab.id, testData);
                      } else {
                        await handleAddLab(testData);
                      }
                    }}>
                      <div className="mb-2">
                        <label className="block mb-1">Name</label>
                        <input name="name" className="border rounded px-2 py-1 w-full" required defaultValue={editLab?.name || ''} />
                      </div>
                      <div className="mb-2">
                        <label className="block mb-1">Cost</label>
                        <input name="cost" className="border rounded px-2 py-1 w-full" required defaultValue={editLab?.cost || ''} />
                      </div>
                      <div className="mb-2">
                        <label className="block mb-1">CGHS Code</label>
                        <input name="code" className="border rounded px-2 py-1 w-full" required defaultValue={editLab?.code || ''} />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" className="px-3 py-1 border rounded" onClick={() => {
                          setShowAddLab(false);
                          setEditLab(null);
                        }}>Cancel</button>
                        <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Save</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "other-investigations-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Other Investigations Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="other-investigations-upload" className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">Upload Excel/CSV</label>
                <input id="other-investigations-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden" />
                <button className="bg-green-500 text-white px-3 py-1 rounded ml-2" onClick={() => setShowAddOtherInvestigation(true)}>+ Add More</button>
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Cost</th>
                    <th className="border px-2 py-1 text-left">CGHS Code</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otherInvestigations.map((test, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{test.name}</td>
                      <td className="border px-2 py-1">{test.cost}</td>
                      <td className="border px-2 py-1">{test.code}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button title="View">👁️</button>
                        <button title="Edit">✏️</button>
                        <button title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showAddOtherInvestigation && (
                <AddOtherInvestigationForm
                  onCancel={() => setShowAddOtherInvestigation(false)}
                  onSubmit={async data => {
                    await handleAddOtherInvestigation(data);
                  }}
                />
              )}
            </div>
          </div>
        )}
        {activeTab === "medications-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Medications Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="medications-upload" className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">Upload Excel/CSV</label>
                <input id="medications-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden" />
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                  onClick={() => setShowAddMedication(true)}
                >
                  + Add More
                </button>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchMed}
                  onChange={e => { setSearchMed(e.target.value); setMedPage(1); }}
                  className="ml-4 p-2 border rounded w-64"
                />
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Type</th>
                    <th className="border px-2 py-1 text-left">Cost</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                    <th className="border px-2 py-1 text-left">speciality</th>
                    <th className="border px-2 py-1 text-left">Non NABH Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{med.name}</td>
                      <td className="border px-2 py-1">{med.type}</td>
                      <td className="border px-2 py-1">{med.cost}</td>
                      <td className="border px-2 py-1">{med.speciality}</td>
                      <td className="border px-2 py-1">{med.non_nabh_cost}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button title="View">👁</button>
                        <button title="Edit" onClick={() => setEditMedication(med)}>✏</button>
                        <button title="Delete" onClick={() => handleDeleteMedication(med.id)}>🗑</button>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mb-2 text-sm text-gray-500">
                Showing {medications.length} of {medTotalRows} results
              </p>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button disabled={medPage === 1} onClick={() => setMedPage(medPage - 1)}>Prev</button>
                <span style={{ margin: '0 8px' }}>
                  Page {medPage} of {Math.ceil(medTotalRows / medPageSize)}
                </span>
                <button disabled={medPage === Math.ceil(medTotalRows / medPageSize)} onClick={() => setMedPage(medPage + 1)}>Next</button>
              </div>
              {showAddMedication && (
                <AddMedicationForm
                  onCancel={() => setShowAddMedication(false)}
                  onSubmit={handleAddMedication}
                />
              )}
            </div>
          </div>
        )}
        {activeTab === "approvals" && <Approvals />}
        {activeTab === "reports" && <ReportsAnalytics />}
        {activeTab === "medical-staff-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Medical Staff Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <label htmlFor="medical-staff-upload" className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">Upload Excel/CSV</label>
                <input id="medical-staff-upload" type="file" accept=".csv,.xls,.xlsx" className="hidden" />
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Cost</th>
                    <th className="border px-2 py-1 text-left">CGHS Code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border px-2 py-1">Nurse Anjali</td><td className="border px-2 py-1">₹500</td><td className="border px-2 py-1">MS001</td></tr>
                  <tr><td className="border px-2 py-1">Technician Ravi</td><td className="border px-2 py-1">₹600</td><td className="border px-2 py-1">MS002</td></tr>
                  <tr><td className="border px-2 py-1">Ward Boy Suresh</td><td className="border px-2 py-1">₹400</td><td className="border px-2 py-1">MS003</td></tr>
                  <tr><td className="border px-2 py-1">Receptionist Meena</td><td className="border px-2 py-1">₹450</td><td className="border px-2 py-1">MS004</td></tr>
                  <tr><td className="border px-2 py-1">Pharmacist Ritu</td><td className="border px-2 py-1">₹550</td><td className="border px-2 py-1">MS005</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "user-list" && (
          <>
            <UserList users={users} onAddUser={() => setShowAddUser(true)} />
            {showAddUser && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
                  <h3 className="text-lg font-medium mb-4">Add User</h3>
                  <UserAddForm
                    onCancel={() => setShowAddUser(false)}
                    onSubmit={data => {
                      setUsers([...users, {
                        name: `${data.firstName} ${data.lastName}`.trim(),
                        email: data.email,
                        role: data.role.charAt(0).toUpperCase() + data.role.slice(1)
                      }]);
                      window.alert("User Added Successfully!");
                      setShowAddUser(false);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "doctor-master" && (
          <div className="p-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Doctor Master</h3>
              <div className="mb-4 flex items-center gap-2">
                <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => setShowAddDoctor(true)}>+ Add Doctor</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-left">Name</th>
                      <th className="border px-2 py-1 text-left">Degree</th>
                      <th className="border px-2 py-1 text-left">Specialization</th>
                      <th className="border px-2 py-1 text-left">Referring Doctor</th>
                      <th className="border px-2 py-1 text-left">Anaesthetist</th>
                      <th className="border px-2 py-1 text-left">Surgeon</th>
                      <th className="border px-2 py-1 text-left">Radiologist</th>
                      <th className="border px-2 py-1 text-left">Pathologist</th>
                      <th className="border px-2 py-1 text-left">Physician</th>
                      <th className="border px-2 py-1 text-left">Other Speciality</th>
                      <th className="border px-2 py-1 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc, idx) => (
                      <tr key={doc.id || idx}>
                        <td className="border px-2 py-1">{doc.name}</td>
                        <td className="border px-2 py-1">{doc.degree}</td>
                        <td className="border px-2 py-1">{doc.specialization}</td>
                        <td className="border px-2 py-1">{doc.is_referring ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.is_anaesthetist ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.is_surgeon ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.is_radiologist ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.is_pathologist ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.is_physician ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{doc.other_speciality}</td>
                        <td className="border px-2 py-1 flex gap-2">
                          <button title="View">👁️</button>
                          <button title="Edit" onClick={() => setEditDiagnosis(diagnosis)}>✏️</button>
                          <button title="Delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddDoctor && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                  <div className="bg-white p-6 rounded shadow-lg max-w-3xl w-full">
                    <h3 className="text-lg font-medium mb-4">Add Doctor</h3>
                    <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const nameEl = formEl.elements.namedItem('name') as HTMLInputElement;
                      const degreeEl = formEl.elements.namedItem('degree') as HTMLInputElement;
                      const specializationEl = formEl.elements.namedItem('specialization') as HTMLInputElement;
                      const isReferringEl = formEl.elements.namedItem('isReferring') as HTMLInputElement;
                      const isAnaesthetistEl = formEl.elements.namedItem('isAnaesthetist') as HTMLInputElement;
                      const isSurgeonEl = formEl.elements.namedItem('isSurgeon') as HTMLInputElement;
                      const isRadiologistEl = formEl.elements.namedItem('isRadiologist') as HTMLInputElement;
                      const isPathologistEl = formEl.elements.namedItem('isPathologist') as HTMLInputElement;
                      const isPhysicianEl = formEl.elements.namedItem('isPhysician') as HTMLInputElement;
                      const otherSpecialityEl = formEl.elements.namedItem('otherSpeciality') as HTMLInputElement;

                      // Insert into Supabase
                      const { data, error } = await supabase.from('doctor').insert([{
                        name: nameEl.value,
                        degree: degreeEl.value,
                        specialization: specializationEl.value,
                        is_referring: isReferringEl.checked,
                        is_anaesthetist: isAnaesthetistEl.checked,
                        is_surgeon: isSurgeonEl.checked,
                        is_radiologist: isRadiologistEl.checked,
                        is_pathologist: isPathologistEl.checked,
                        is_physician: isPhysicianEl.checked,
                        other_speciality: otherSpecialityEl.value
                      }]);
                      if (error) {
                        window.alert("Error adding doctor: " + error.message);
                      } else {
                        // Refresh doctor list
                        const { data: newDoctors } = await supabase.from('doctor').select('*');
                        setDoctors(newDoctors || []);
                        setShowAddDoctor(false);
                        window.alert("Doctor Added Successfully!");
                      }
                    }}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block mb-1">Name</label>
                          <input name="name" className="border rounded px-2 py-1 w-full" required />
                        </div>
                        <div>
                          <label className="block mb-1">Degree</label>
                          <input name="degree" className="border rounded px-2 py-1 w-full" required />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1">Specialization</label>
                        <input name="specialization" className="border rounded px-2 py-1 w-full" required />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Doctor Type</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <input type="checkbox" name="isReferring" id="isReferring" className="mr-2" />
                            <label htmlFor="isReferring">Referring Doctor</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" name="isAnaesthetist" id="isAnaesthetist" className="mr-2" />
                            <label htmlFor="isAnaesthetist">Anaesthetist</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" name="isSurgeon" id="isSurgeon" className="mr-2" />
                            <label htmlFor="isSurgeon">Surgeon</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" name="isRadiologist" id="isRadiologist" className="mr-2" />
                            <label htmlFor="isRadiologist">Radiologist</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" name="isPathologist" id="isPathologist" className="mr-2" />
                            <label htmlFor="isPathologist">Pathologist</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" name="isPhysician" id="isPhysician" className="mr-2" />
                            <label htmlFor="isPhysician">Physician</label>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1">Other Speciality (if any)</label>
                        <input name="otherSpeciality" className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="px-3 py-1 rounded border" onClick={() => setShowAddDoctor(false)}>Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Add Doctor</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}
