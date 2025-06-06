"use client"

import { useEffect, useState, useRef } from "react"
import { DiagnosisManager } from "./DiagnosisManager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ComplicationsList, mockComplications } from "@/components/complications-list"
import { SurgeryComplicationsList, mockSurgeryComplications } from "@/components/surgery-complications-list"
import { InvestigationsList } from "@/components/investigations-list"
import { MedicationsList } from "@/components/medications-list"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SelectedComplicationsList } from "@/components/selected-complications-list"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  PlusCircle,
  FileText,
  AlertCircle,
  UserRound,
  CalendarDays,
  Phone,
  Printer,
  ClipboardCheck,
  Receipt,
  Search,
  Plus,
  XCircle,
  Scissors,
  ClipboardList,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import React from "react"
import { useRouter, useParams } from "next/navigation"
import { DiagnosisList } from "@/components/diagnosis-list"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"; // Make sure this import is correct
import { TreatmentDates } from './treatment-dates';
import { getPatientVisits, Visit as VisitData } from '@/lib/supabase/api/visits';
import SurgicalPricingAdjuster from "@/components/SurgicalPricingAdjuster";
import { marked } from 'marked';
import { getSurgeons, Doctor as DoctorType } from "@/lib/supabase/api/doctors";
import SurgeonSelectRow from "./SurgeonSelectRow"; // path as per your structure

// Mock patient data
const patientData = {
  id: "ESIC-2023-1001",
  name: "Rahul Sharma",
  age: 42,
  gender: "Male",
  phone: "+91 98765 43210",
  address: "123 Park Street, New Delhi",
  insuranceStatus: "Active",
  registrationDate: "15 Jan 2023",
  lastVisit: "22 Apr 2023",
  dateOfAdmission: "10 Jun 2023",
  dateOfDischarge: "15 Jun 2023"
};

// Mock visit history data
const visitHistoryData = [
  {
    visitId: "VISIT-2023-0087",
    date: "22 Apr 2023",
    reason: "Follow-up for diabetes management",
    doctor: "Dr. Neha Patel",
    department: "Endocrinology",
    notes: "Patient's blood sugar levels are stable. Continue with current medication."
  },
  {
    visitId: "VISIT-2023-0042",
    date: "18 Mar 2023",
    reason: "Regular check-up",
    doctor: "Dr. Vikram Singh",
    department: "General Medicine",
    notes: "Vital signs normal. Recommended annual eye examination."
  },
  {
    visitId: "VISIT-2023-0015",
    date: "04 Feb 2023",
    reason: "Eye examination",
    doctor: "Dr. Anjali Gupta",
    department: "Ophthalmology",
    notes: "Early signs of diabetic retinopathy. Scheduled for follow-up in 3 months."
  },
];

// Update the doctorMasterList interface
interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

export const doctorMasterList: Doctor[] = [
  { id: 'dr1', name: 'Dr. Dhiraj Gupta MS. (Ortho)', specialization: 'Orthopedics' },
  { id: 'dr2', name: 'Dr. Ashwin Chinchkhede', specialization: 'MD. Med.' },
  // Add more doctors here as needed
];

// Re-add the surgery data since we still need it
// Surgery interface to match cghs_surgery table
interface Surgery {
  id: number;
  name: string;
  description: string;
  cghs_code: string;
  amount: number;
  category: string;
  duration_days: number;
  is_active: boolean;
  complication1?: string;
  complication2?: string;
  complication3?: string;
  complication4?: string;
}

// Define the Diagnosis type since it's still used in some places
interface Diagnosis {
  id: string;
  name: string;
  approved: boolean;
}

// Add the missing interface definition for SelectedComplicationsList
interface SelectedComplicationsListProps {
  surgeryComplications: string[];
  selectedSurgeries: string[];
  diagnosisComplications?: string[];
  selectedDiagnoses?: string[];
}

// Add some mock diagnoses data
// Add this after the surgeries array
const initialDiagnoses: Diagnosis[] = [
  { id: "d1", name: "Type 2 Diabetes Mellitus", approved: true },
  { id: "d2", name: "Hypertension", approved: true },
  { id: "d3", name: "Coronary Artery Disease", approved: true },
  { id: "d4", name: "Diabetic Nephropathy", approved: false },
]

// Add a mock database of diagnoses for search
// Add this after initialDiagnoses
const diagnosisDatabase = [
  { id: "d5", name: "Chronic Kidney Disease", icd: "N18" },
  { id: "d6", name: "Asthma", icd: "J45" },
  { id: "d7", name: "Rheumatoid Arthritis", icd: "M05" },
  { id: "d8", name: "Congestive Heart Failure", icd: "I50" },
  { id: "d9", name: "Chronic Obstructive Pulmonary Disease", icd: "J44" },
  { id: "d10", name: "Osteoporosis", icd: "M81" },
  { id: "d11", name: "Parkinson's Disease", icd: "G20" },
  { id: "d12", name: "Multiple Sclerosis", icd: "G35" },
  { id: "d13", name: "Hypothyroidism", icd: "E03" },
  { id: "d14", name: "Alzheimer's Disease", icd: "G30" },
  { id: "d15", name: "Epilepsy", icd: "G40" },
  { id: "d16", name: "Gastroesophageal Reflux Disease", icd: "K21" },
  { id: "d17", name: "Migraine", icd: "G43" },
  { id: "d18", name: "Anemia", icd: "D64" },
  { id: "d19", name: "Glaucoma", icd: "H40" },
  { id: "d20", name: "Psoriasis", icd: "L40" },
]

// Add these interfaces at the top of the file, after the imports
interface InvoiceSubItem {
  sr: string;
  item: string;
  code?: string;
  details?: string;
  rate?: number;
  qty?: number;
  amount?: number;
  pricing?: {
    baseAmount: number;
    primaryAdjustment: string;
    discountAmount: number;
    finalAmount: number;
    secondaryAdjustment?: string;
    subDiscountAmount?: number;
    secondaryAmount?: number;
    wardType?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface InvoiceItem {
  section?: string;
  sr?: string;
  item?: string;
  code?: string;
  rate?: number;
  qty?: number;
  amount?: number;
  details?: string;
  subItems?: InvoiceSubItem[];
}

// Add print styles as a constant
const printStyles = `
  @media print {
    html, body {
      width: 210mm;
      min-height: 297mm;
      font-size: 12px;
      color: #000;
    }
    .invoice-a4-page {
      page-break-after: always;
      width: 100%;
      min-height: 297mm;
      box-sizing: border-box;
      padding: 20mm 10mm;
    }
    .no-print { display: none !important; }
  }
  .invoice-table th, .invoice-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    font-size: 12px;
  }
  .invoice-table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 8px;
  }
  .invoice-header {
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    border: 1px solid #000;
    padding: 4px;
  }
  .invoice-section-title {
    font-weight: bold;
    background: #f2f2f2;
  }
  .invoice-green {
    background: #b6e7b0;
    font-weight: bold;
  }
  .invoice-total-row {
    font-weight: bold;
    font-size: 16px;
    background: #f2f2f2;
  }
`;

// Add these helper functions before the InvoicePage component
const formatClaimId = () => {
  // Generate a claim ID in the format CLAIM-YYYY-XXXX
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CLAIM-${year}-${random}`;
};

const formatBillNumber = (visitId: string) => {
  // Format bill number as BL24D-16/04
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `BL24D-${day}/${month}`;
};

function InvoicePage({ patientData, diagnoses, conservativeStart, conservativeEnd, surgicalStart, surgicalEnd, conservativeStart2, conservativeEnd2, visits, doctorOptions }: {
  patientData: Patient,
  diagnoses: Diagnosis[],
  conservativeStart: string,
  conservativeEnd: string,
  surgicalStart: string,
  surgicalEnd: string,
  conservativeStart2: string,
  conservativeEnd2: string,
  visits: Visit[],
  doctorOptions: Doctor[]
}) {
  // State for invoice data
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  // State for hidden rows
  const [hiddenRows, setHiddenRows] = useState<number[]>([]);

  // Function to toggle row visibility
  const toggleRowVisibility = (idx: number) => {
    setHiddenRows(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // Initialize comprehensive invoice items
  useEffect(() => {
    if (patientData) {
      // 1. Gather all surgical subItems with pricing from all sections
      const allItems = [
        // Pre-Surgical Conservative Treatment Section
        {
          type: "section",
          title: "Pre-Surgical Conservative Treatment",
          dateRange: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`
        },
        // Surgical Package Section
        {
          type: "section",
          title: "Surgical Package (5 Days)",
          dateRange: `Dt.(${surgicalStart?.split('-').reverse().join('/')} TO ${surgicalEnd?.split('-').reverse().join('/')})`
        },
        // Post-Surgical Conservative Treatment Section
        {
          type: "section",
          title: "Post-Surgical Conservative Treatment",
          dateRange: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`
        },
        // 1) Consultation for Inpatients (Pre-Surgical)
        {
          type: "main",
          sr: "1)",
          item: "Pre-Surgical Consultation for Inpatients",
          code: "2",
          subItems: [
            {
              sr: "i)",
              item: "Dr. Pranal Sahare,(Urologist)",
              details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
              rate: 0.0,
              qty: 0,
              amount: 0.0
            },
            // {
            //   sr: "ii)",
            //   item: "Dr. Ashwin Chichkhede, MD (Medicine)",
            //   details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
            //   rate: 350.00,
            //   qty: 8,
            //   amount: 2800.00
            // }
          ]
        },
        // 2) Pre-Surgical Accommodation Charges
        {
          type: "main",
          sr: "2)",
          item: "Pre-Surgical Accommodation Charges",
          subItems: [
            {
              sr: "i)",
              item: "Accommodation For General Ward",
              details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
              rate: 1500.00,
              qty: 1,
              amount: 1500.00
            }
          ]
        },
        // 4) Post-Surgical Consultation
        {
          type: "main",
          sr: "4)",
          item: "Post-Surgical Consultation for Inpatients",
          code: "2",
          subItems: [
            {
              sr: "i)",
              item: "Dr. Pranal Sahare,(Urologist)",
              details: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`,
              rate: 350.00,
              qty: 1,
              amount:350.00
            },
            // {
            //   sr: "ii)",
            //   item: "Dr. Ashwin Chichkhede, MD (Medicine)",
            //   details: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`,
            //   rate: 350.00,
            //   qty: 6,
            //   amount: 2100.00
            // }
          ]
        },
        // 5) Other Charges
        {
          type: "main",
          sr: "5)",
          item: "Other Charges",
          subItems: [
            {
              sr: "i)",
              item: "",
              code: "",
              rate: 0,
              qty: 0,
              amount: 0
            }
          ]
        },
        // 6) Post-Surgical Accommodation
        {
          type: "main",
          sr: "6)",
          item: "Post-Surgical Accommodation Charges",
          subItems: [
            {
              sr: "i)",
              item: "Accommodation For General Ward",
              details: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`,
              rate: 1500.00,
              qty: 1,
              amount: 1500.00
            }
          ]
        },
        // 7) Implant Charges
        {
          type: "main",
          sr: "7)",
          item: "Implant Charges",
          subItems: [
            {
              sr: "i)",
              item: "",
              code: "UNLISTED",
              rate: 0.00,
              qty: 0,
              amount: 0.00
            }
          ]
        },
        {
          type: "main",
          sr: "3)",
          item: "Pathology Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 1674.00,
          qty: 1,
          amount: 1674.00,
          subItems: [
            {
              sr: "i)",
              item: "",
              code: "UNLISTED",
              rate: 0.00,
              qty: 0,
              amount: 0.00
            }
          ]
        },
        {
          type: "main",
          sr: "8)",
          item: "Medicine Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 1674.00,
          qty: 1,
          amount: 1674.00,
          subItems: [
            {
              sr: "i)",
              item: "",
              code: "UNLISTED",
              rate: 0.00,
              qty: 0,
              amount: 0.00
            }
          ]
        },
      ];

      // 2. Define all surgical procedures with pricing (example data, replace with dynamic if needed)
      const surgicalProcedures = [
        {
          sr: "i)",
          item: "Resection Bladder Neck Endoscopic /Bladder neck incision/transurethral incision on prostate",
          code: "874",
          pricing: {
            baseAmount: 11308,
            primaryAdjustment: "ward10",
            discountAmount: 1130,
            finalAmount: 10178.00
          }
        },
        // {
        //   sr: "ii)",
        //   item: "Suprapubic Drainage (Cystostomy/vesicostomy)",
        //   code: "750",
        //   pricing: {
        //     baseAmount: 6900,
        //     primaryAdjustment: "ward10",
        //     secondaryAdjustment: "guideline50",
        //     discountAmount: 690,
        //     subDiscountAmount: 6210,
        //     finalAmount: 3105.00
        //   }
        // },
        // {
        //   sr: "iii)",
        //   item: "Diagnostic cystoscopy",
        //   code: "694",
        //   pricing: {
        //     baseAmount: 3306,
        //     primaryAdjustment: "ward10",
        //     secondaryAdjustment: "guideline50",
        //     discountAmount: 330,
        //     subDiscountAmount: 2976,
        //     finalAmount: 1488.00
        //   }
        // },
        // {
        //   sr: "iv)",
        //   item: "Meatotomy",
        //   code: "780",
        //   pricing: {
        //     baseAmount: 2698,
        //     primaryAdjustment: "ward10",
        //     secondaryAdjustment: "guideline50",
        //     discountAmount: 269,
        //     subDiscountAmount: 2429,
        //     finalAmount: 1214.00
        //   }
        // }
      ];

      // 3. Add a dedicated Surgical Treatment section
      allItems.push({
        type: "main",
        sr: "8)",
        item: `Surgical Treatment (${surgicalStart?.split('-').reverse().join('/')})`,
        subItems: surgicalProcedures
      });

      setInvoiceItems(allItems);
    }
  }, [patientData, conservativeStart, conservativeEnd, surgicalStart, surgicalEnd, conservativeStart2, conservativeEnd2]);

  // Add print styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        .hidden-for-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const latestVisit = visits[0];

  if (!patientData) {
    return <div className="p-4" > Loading invoice...</div>;
  }

  // Create a default visit if no visits exist
  const defaultVisit = {
    id: 'default-visit',
    visit_id: 'VISIT-2024-0001',
    patient_unique_id: patientData.unique_id || patientData.patient_unique_id,
    visit_date: new Date().toISOString(),
    visit_type: 'General',
    appointment_with: 'Dr. Default',
    visit_reason: 'General consultation',
    referring_doctor: 'Self',
    diagnosis: 'General examination',
    surgery: '',
    created_at: new Date().toISOString(),
    claim_id: 'CLAIM-2024-0001'
  };

  const currentVisit = latestVisit || defaultVisit;

  // Calculate total
  const calculateTotal = () => {
    let total = 0;
    invoiceItems.forEach(item => {
      if (item.type === "main") {
        if (item.subItems) {
          item.subItems.forEach((sub: any) => {
            if (sub.pricing) {
              // Handle items with pricing adjustments
              total += sub.pricing.finalAmount || 0;
            } else {
              // Handle regular items with rate and quantity
              const amount = (sub.rate || 0) * (sub.qty || 1);
              total += amount;
            }
          });
        } else {
          // Handle main items without subitems
          const amount = (item.rate || 0) * (item.qty || 1);
          total += amount;
        }
      }
    });
    return total;
  };

  // Add a new function to calculate item amount
  const calculateItemAmount = (item: any) => {
    if (item.pricing) {
      return item.pricing.finalAmount || 0;
    }
    return (item.rate || 0) * (item.qty || 1);
  };

  // Add a function to calculate subitem amount
  const calculateSubItemAmount = (subItem: any) => {
    if (subItem.pricing) {
      return subItem.pricing.finalAmount || 0;
    }
    return (subItem.rate || 0) * (subItem.qty || 1);
  };

  // Add a function to calculate section total
  const calculateSectionTotal = (sectionItems: any[]) => {
    return sectionItems.reduce((total, item) => {
      if (item.type === "main") {
        if (item.subItems) {
          return total + item.subItems.reduce((subTotal: number, sub: any) => {
            return subTotal + calculateSubItemAmount(sub);
          }, 0);
        }
        return total + calculateItemAmount(item);
      }
      return total;
    }, 0);
  };

  // Handler to update quantity and recalculate amount
  const handleQtyChange = (itemIdx: number, subIdx?: number, newQty?: number) => {
    setInvoiceItems(prevItems => {
      const newItems = [...prevItems];
      if (subIdx !== undefined) {
        // Update subitem quantity
        newItems[itemIdx].subItems[subIdx].qty = newQty || 1;
        newItems[itemIdx].subItems[subIdx].amount = calculateSubItemAmount(newItems[itemIdx].subItems[subIdx]);
      } else {
        // Update main item quantity
        newItems[itemIdx].qty = newQty || 1;
        newItems[itemIdx].amount = calculateItemAmount(newItems[itemIdx]);
      }
      return newItems;
    });
  };

  // Function to generate Roman numerals
  const generateRomanNumeral = (num: number): string => {
    const romanNumerals = [
      'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
      'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'
    ];

    if (num >= 1 && num <= romanNumerals.length) {
      return romanNumerals[num - 1];
    }

    // Fallback for numbers beyond our predefined list
    return `${num}`;
  };

  // Handler to add new row to a section
  const handleAddRow = (itemIdx: number, sectionType: string) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main") return item;

        if (!item.subItems) return item;

        const newSubItem = {
          sr: `${generateRomanNumeral(item.subItems.length + 1)})`,
          item: '', // blank
          code: '', // blank
          rate: 0,  // ya blank chahiye to undefined bhi kar sakte hain
          qty: 1,
          amount: 0
        };

        return {
          ...item,
          subItems: [...item.subItems, newSubItem]
        };
      });
    });
  };

  // Get default item name based on section type
  const getDefaultItemName = (sectionType: string) => {
    return ''; // Always blank
  };

  // Get default rate based on section type
  const getDefaultRate = (sectionType: string) => {
    switch (sectionType) {
      case 'consultation': return 350.00;
      case 'accommodation': return 1500.00;
      case 'other': return 100.00;
      case 'surgical': return 1000.00;
      case 'implant': return 5000.00;
      default: return 100.00;
    }
  };

  // Handler to update item name
  const handleItemNameChange = (itemIdx: number, subIdx: number, newName: string) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main" || !item.subItems) return item;

        const newSubItems = item.subItems.map((sub: any, sIdx: number) => {
          if (sIdx !== subIdx) return sub;
          return { ...sub, item: newName };
        });

        return { ...item, subItems: newSubItems };
      });
    });
  };

  // Handler to update rate
  const handleRateChange = (itemIdx: number, subIdx?: number, newRate?: number) => {
    setInvoiceItems(prevItems => {
      const newItems = [...prevItems];
      if (subIdx !== undefined) {
        // Update subitem rate
        newItems[itemIdx].subItems[subIdx].rate = newRate || 0;
        newItems[itemIdx].subItems[subIdx].amount = calculateSubItemAmount(newItems[itemIdx].subItems[subIdx]);
      } else {
        // Update main item rate
        newItems[itemIdx].rate = newRate || 0;
        newItems[itemIdx].amount = calculateItemAmount(newItems[itemIdx]);
      }
      return newItems;
    });
  };

  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // CGHS pricing adjustment options
  const cghsAdjustmentOptions = [
    { value: 'none', label: 'No Adjustment', percentage: 0, type: 'none' },
    { value: 'ward10', label: 'Less 10% Gen. Ward Charges as per CGHS', percentage: 10, type: 'discount' },
    { value: 'guideline50', label: 'Less 50% as per CGHS Guideline', percentage: 50, type: 'discount' },
    { value: 'guideline25', label: 'Less 25% as per CGHS Guideline', percentage: 25, type: 'discount' },
    { value: 'special15', label: 'Add 15% Specialward Charges as per CGHS', percentage: 15, type: 'addition' }
  ];

  // List of available consultants - now dynamic from database
  const consultantOptions = doctorMasterList.map(doctor => ({
    value: doctor.id,
    label: `${doctor.name}${doctor.specialization ? ` (${doctor.specialization})` : ''}`
  }));

  // Handler to update consultant name
  const handleConsultantChange = (itemIdx: number, subIdx: number, doctorId: string) => {
    const selectedDoctor = consultantOptions.find(opt => opt.value === doctorId);
    setInvoiceItems(prevItems =>
      prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main" || !item.subItems) return item;
        const newSubItems = item.subItems.map((sub, sIdx) => {
          if (sIdx !== subIdx) return sub;
          return { ...sub, doctorId, item: selectedDoctor?.label || "" };
        });
        return { ...item, subItems: newSubItems };
      })
    );
  };

  // Handler to delete main items
  const handleDeleteMainItem = (itemIdx: number) => {
    setInvoiceItems(prevItems => {
      return prevItems.filter((_, idx) => idx !== itemIdx);
    });
  };

  // Handler to move main item up
  const handleMoveMainItemUp = (itemIdx: number) => {
    setInvoiceItems(prevItems => {
      if (itemIdx === 0) return prevItems; // Can't move first item up

      const newItems = [...prevItems];
      const temp = newItems[itemIdx];
      newItems[itemIdx] = newItems[itemIdx - 1];
      newItems[itemIdx - 1] = temp;

      return newItems;
    });
  };

  // Handler to move main item down
  const handleMoveMainItemDown = (itemIdx: number) => {
    setInvoiceItems(prevItems => {
      if (itemIdx === prevItems.length - 1) return prevItems; // Can't move last item down

      const newItems = [...prevItems];
      const temp = newItems[itemIdx];
      newItems[itemIdx] = newItems[itemIdx + 1];
      newItems[itemIdx + 1] = temp;

      return newItems;
    });
  };

  // Handler to edit main item
  const handleEditMainItem = (itemIdx: number, newName: string) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main") return item;
        return { ...item, item: newName };
      });
    });
  };

  // Handler to edit section title
  const handleEditSectionTitle = (itemIdx: number, newTitle: string) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "section") return item;
        return { ...item, title: newTitle };
      });
    });
  };

  // Handler to delete sub items
  const handleDeleteSubItem = (itemIdx: number, subIdx: number) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main" || !item.subItems) return item;

        const newSubItems = item.subItems.filter((_: any, sIdx: number) => sIdx !== subIdx);
        return { ...item, subItems: newSubItems };
      });
    });
  };

  // Handler to move sub items up
  const handleMoveSubItemUp = (itemIdx: number, subIdx: number) => {
    if (subIdx === 0) return; // Can't move first item up

    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main" || !item.subItems) return item;

        const newSubItems = [...item.subItems];
        // Swap with previous item
        [newSubItems[subIdx - 1], newSubItems[subIdx]] = [newSubItems[subIdx], newSubItems[subIdx - 1]];

        return { ...item, subItems: newSubItems };
      });
    });
  };

  // Handler to move sub items down
  const handleMoveSubItemDown = (itemIdx: number, subIdx: number) => {
    setInvoiceItems(prevItems => {
      return prevItems.map((item, idx) => {
        if (idx !== itemIdx || item.type !== "main" || !item.subItems) return item;

        if (subIdx === item.subItems.length - 1) return item; // Can't move last item down

        const newSubItems = [...item.subItems];
        // Swap with next item
        [newSubItems[subIdx], newSubItems[subIdx + 1]] = [newSubItems[subIdx + 1], newSubItems[subIdx]];

        return { ...item, subItems: newSubItems };
      });
    });
  };

  // Handler to update CGHS adjustment for surgical items
  const handleCGHSAdjustmentChange = (itemIdx: number, subIdx: number, adjustmentType: string, adjustmentValue: string) => {
    setInvoiceItems(prevItems => {
      const newItems = [...prevItems];
      const subItem = newItems[itemIdx].subItems[subIdx];
      
      if (!subItem.pricing) {
        subItem.pricing = {
          baseAmount: subItem.rate || 0,
          primaryAdjustment: '',
          discountAmount: 0,
          finalAmount: subItem.rate || 0
        };
      }

      if (adjustmentType === 'primary') {
        subItem.pricing.primaryAdjustment = adjustmentValue;
        // Calculate primary adjustment amount (e.g., 15% of base amount)
        const percentage = parseFloat(adjustmentValue.match(/\d+/)?.[0] || '0');
        subItem.pricing.adjustmentAmount = (subItem.pricing.baseAmount * percentage) / 100;
        subItem.pricing.finalAmount = subItem.pricing.baseAmount + (subItem.pricing.adjustmentAmount || 0);
      } else if (adjustmentType === 'secondary') {
        subItem.pricing.secondaryAdjustment = adjustmentValue;
        // Calculate secondary adjustment amount (e.g., 50% discount)
        const percentage = parseFloat(adjustmentValue.match(/\d+/)?.[0] || '0');
        subItem.pricing.secondaryAmount = (subItem.pricing.finalAmount * percentage) / 100;
        subItem.pricing.finalAmount = subItem.pricing.finalAmount - (subItem.pricing.secondaryAmount || 0);
      }

      return newItems;
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    try {
      // Generate a unique bill number using timestamp
      const timestamp = new Date().getTime();
      const uniqueBillNumber = `BL${timestamp}`;

      const { data, error } = await supabase
        .from('bills')
        .insert([
          {
            bill_number: uniqueBillNumber,
            patient_unique_id: patientData.unique_id,
            visit_id: currentVisit.visit_id,
            patient_name: patientData.name,
            total_amount: calculateTotal(),
            status: 'pending',
            payment_status: 'unpaid',
            notes: 'Generated from patient dashboard'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Bill saved!",
        description: `Bill #${uniqueBillNumber} has been stored in Supabase.`,
      });
    } catch (error: any) {
      console.error('Error saving bill:', error);
      toast({
        title: "Error saving bill",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="invoice-a4-page bg-white shadow-lg border" style={{ maxWidth: '210mm', margin: '0 auto', padding: '16px', fontFamily: 'Arial, sans-serif' }
    }>
      {/* Print Button */}
      < button
        onClick={handlePrint}
        className="print-button"
        title="Print Final Bill"
      >
        <Printer className="h-5 w-5" />
      </button>

      < style > {`
        .invoice-table { border-collapse: collapse; width: 100%; font-size: 12px; }
        .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
        .invoice-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .invoice-section { background-color: #f5f5f5; font-weight: bold; }
        .invoice-header { text-align: center; font-weight: bold; font-size: 16px; border: 2px solid #000; padding: 6px; margin-bottom: 2px; }
        .patient-info { font-size: 12px; margin: 8px 0; }
        .right-align { text-align: right; }
        .center-align { text-align: center; }
        .surgery-pricing { font-size: 11px; }
        
        /* Print Button Styles */
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .print-button:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-2px) scale(1.1);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        
        @media print {
          /* Hide everything except the invoice */
          body * { visibility: hidden; }
          .invoice-a4-page, .invoice-a4-page * { visibility: visible; }
          .invoice-a4-page { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important;
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            padding: 10mm !important;
          }
          
          /* Hide print button during printing */
          .print-button { display: none !important; }
          .no-print { display: none !important; }
          
          /* Ensure proper page setup */
          @page {
            size: A4;
            margin: 10mm;
          }
          
          /* Make sure interactive elements are hidden */
          button:not(.print-button) { display: none !important; }
          input[type="button"] { display: none !important; }
          select { border: none !important; background: transparent !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}</style>

      {/* Header */}
      <div className="invoice-header" > FINAL BILL </div>
      < div className="invoice-header" > {patientData.corporate || 'ECHS'} </div>
      < div className="invoice-header" > CLAIM ID - {formatClaimId()} </div>

      {/* Patient Information */}
      <div className="flex justify-between patient-info" style={{ marginTop: '8px', marginBottom: '8px' }}>
        <div style={{ width: '48%' }}>
          <div><strong>BILL NO</strong>: {"898768"}</div>
          {/* <div><strong>BILL NO</strong>: {formatBillNumber(currentVisit.visit_id)}</div> */}
          <div><strong>REGISTRATION NO</strong>: {patientData.unique_id || 'IH24D04003'}</div>
          <div><strong>NAME OF PATIENT</strong>: {patientData.name.toUpperCase()}</div>
          <div><strong>AGE</strong>: {patientData.age} YEARS</div>
          <div><strong>SEX</strong>: {patientData.gender.toUpperCase()}</div>
          <div><strong>NAME OF {patientData.corporate || 'ECHS'} BENEFICIARY</strong>: {patientData.name.toUpperCase()}</div>
          <div><strong>RELATION WITH {patientData.corporate || 'ECHS'} EMPLOYEE</strong>: SELF</div>
          <div><strong>RANK</strong>: Sep (RETD)</div>
          <div><strong>SERVICE NO</strong>: 1231207F</div>
          <div><strong>CATEGORY</strong>: <span style={{ backgroundColor: '#90EE90', padding: '2px' }}>GENERAL</span></div>
        </div>
        <div style={{ width: '48%' }}>
          <div style={{ textAlign: 'right' }}><strong>DATE: -</strong> {formatDateForDisplay(new Date().toISOString())}</div>
          <div style={{ marginTop: '20px' }}><strong>DIAGNOSIS</strong>:</div>
          <div style={{ margin: '8px 0' }}>
            <textarea
              placeholder="Enter diagnosis here..."
            />
          </div>
          <div><strong>DATE OF ADMISSION</strong>: {patientData.latestVisit?.visit_date ? formatDateForDisplay(patientData.latestVisit.visit_date) : 'Not admitted'}</div>
          <div><strong>DATE OF DISCHARGE</strong>: {patientData.date_of_discharge ? formatDateForDisplay(patientData.date_of_discharge) : 'Not discharged'}</div>
        </div>
      </div>

      {/* Main Invoice Table */}
      <table className="invoice-table" >
        <thead>
          <tr>
            <th style={{ width: '8%' }}> SR.NO </th>
            <th style={{ width: '35%' }}> ITEM </th>
            <th style={{ width: '12%' }}> {patientData.corporate || 'CGHS'} NABH CODE No.</th>
            <th style={{ width: '12%' }}> {patientData.corporate || 'CGHS'} NABH RATE </th>
            <th style={{ width: '8%' }}> QTY </th>
            <th style={{ width: '12%' }}> AMOUNT </th>
            <th style={{ width: '13%' }}> ACTIONS </th>
          </tr>
        </thead>
        <tbody>
          {
            invoiceItems.map((item, idx) => {
              if (item.type === "section") {
                return (
                  <tr key={`section-${idx}`} className={`invoice-section ${hiddenRows.includes(idx) ? 'hidden-for-print' : ''}`}>
                    <td colSpan={6}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleEditSectionTitle(idx, e.target.value)
                        }
                        className="w-full border-none bg-transparent text-sm font-bold p-1"
                        style={{ minHeight: '20px', backgroundColor: 'transparent', fontWeight: 'bold' }}
                      />
                      {item.dateRange && <br />}
                      {item.dateRange}
                    </td>
                    <td className="text-right" >
                      <button
                        onClick={() => toggleRowVisibility(idx)}
                        className="p-1 rounded hover:bg-gray-100"
                        title={hiddenRows.includes(idx) ? "Show in print" : "Hide from print"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${hiddenRows.includes(idx) ? 'text-gray-400' : 'text-gray-600'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {
                            hiddenRows.includes(idx) ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            )}
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              }

              if (item.type === "main") {
                if (item.subItems) {
                  const sectionType = item.sr === "1)" ? "consultation" :
                    item.sr === "2)" ? "accommodation" :
                      item.sr === "5)" ? "other" :
                        item.sr === "6)" ? "accommodation" :
                          item.sr === "7)" ? "implant" :
                            item.sr === "8)" ? "surgical" : "other";

                  return (
                    <React.Fragment key={`main-${idx}`}>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <td><strong>{item.sr}</strong></td>
                        <td colSpan={3}>
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleEditMainItem(idx, e.target.value)
                            }
                            className="w-full border-none bg-transparent text-sm font-bold p-1"
                            style={{ minHeight: '20px', backgroundColor: 'transparent' }
                            }
                          />
                          {item.details && <><br /><span style={{ fontSize: '11px', color: '#555' }}>{item.details}</span > </>}
                        </td>
                        <td>
                          <button
                            onClick={() => handleAddRow(idx, sectionType)}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                            style={{ fontSize: '10px' }}
                            title="Add new row to this section"
                          >
                            + Add More
                          </button>
                        </td>
                        <td> </td>
                        <td>
                          <div className="flex items-center justify-center gap-1" >
                            {/* Move Up Button */}
                            <button
                              onClick={() => handleMoveMainItemUp(idx)}
                              disabled={idx === 0}
                              className={`px-1 py-1 rounded transition-colors flex items-center justify-center ${idx === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              style={{ fontSize: '10px' }}
                              title="Move section up"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>

                            {/* Move Down Button */}
                            <button
                              onClick={() => handleMoveMainItemDown(idx)}
                              disabled={idx === invoiceItems.length - 1}
                              className={`px-1 py-1 rounded transition-colors flex items-center justify-center ${idx === invoiceItems.length - 1
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              style={{ fontSize: '10px' }}
                              title="Move section down"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteMainItem(idx)}
                              className="px-1 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                              style={{ fontSize: '10px' }}
                              title="Delete section"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {
                        item.subItems.map((sub: any, subIdx: number) => {
                          if (!sub.sr) throw new Error(`Missing key for subitem at index ${subIdx}`);
                          return (
                            <tr key={sub.sr}>
                              <td>{sub.sr}</td>
                              <td>
                                {(item.sr === "1)" || (item.item && item.item.toLowerCase().includes("consultation"))) && (
                              <select
                                value={sub.doctorId || ""}
                                onChange={e => handleConsultantChange(idx, subIdx, e.target.value)}
                                className="w-full border border-gray-300 rounded text-xs p-1 bg-white"
                                style={{ minHeight: '20px' }}
                              >
                                <option value="">Select Doctor</option>
                                    {doctorOptions.map((option, index) => (
                                      <option
                                        key={option.id || `doctor-${index}`}
                                        value={option.id || `doctor-${index}`}
                                      >
                                    {option.name}{option.specialization ? ` (${option.specialization})` : ""}
                                  </option>
                                ))}
                              </select>
                                )}
                                <input
                              type="text"
                              value={sub.item}
                              onChange={(e) => handleItemNameChange(idx, subIdx, e.target.value)}
                              className="w-full border-none bg-transparent text-xs p-1"
                              style={{ minHeight: '20px' }}
                            />
                                {sub.details !== undefined && (
                                  <div className="flex gap-2 items-center mt-1">
                                    <label className="text-xs">From:</label>
                                    <input
                                      type="date"
                                      value={sub.startDate || ""}
                                      onChange={e => {
                                        const newItems = [...invoiceItems];
                                        if (newItems[idx].subItems) {
                                          newItems[idx].subItems[subIdx].startDate = e.target.value;
                                          setInvoiceItems(newItems);
                                        }
                                      }}
                                      className="border rounded text-xs p-1"
                                    />
                                    <label className="text-xs">To:</label>
                                    <input
                                      type="date"
                                      value={sub.endDate || ""}
                                      onChange={e => {
                                        const newItems = [...invoiceItems];
                                        if (newItems[idx].subItems) {
                                          newItems[idx].subItems[subIdx].endDate = e.target.value;
                                          setInvoiceItems(newItems);
                                        }
                                      }}
                                      className="border rounded text-xs p-1"
                                    />
                                  </div>
                                )}

                                {/* Ward Type Selection for Accommodation */}
                                {item.sr === "2)" || item.sr === "6)" ? (
                                  <div className="mt-2">
                                    <select
                                      value={sub.wardType || "general"}
                                      onChange={(e) => {
                                        const newItems = [...invoiceItems];
                                        if (newItems[idx].subItems) {
                                          newItems[idx].subItems[subIdx].wardType = e.target.value;
                                          // Update rate based on ward type
                                          const rates = {
                                            general: 1500.00,
                                            shared: 2000.00,
                                            special: 3000.00
                                          };
                                          newItems[idx].subItems[subIdx].rate = rates[e.target.value as keyof typeof rates];
                                          newItems[idx].subItems[subIdx].amount = rates[e.target.value as keyof typeof rates] * (newItems[idx].subItems[subIdx].qty || 1);
                                          setInvoiceItems(newItems);
                                        }
                                      }}
                                      className="w-full border border-gray-300 rounded text-xs p-1 bg-white mt-1"
                                    >
                                      <option value="general">Select Ward Type</option>
                                      <option value="general">General Ward</option>
                                      <option value="shared">Semi-Private Ward</option>
                                      <option value="special">Private Ward</option>
                                    </select>
                                  </div>
                                ) : null}

                              {/* Complex pricing for surgical items */}
                              {
                                sub.pricing && (
                                  <SurgicalPricingAdjuster
                                    pricing={sub.pricing}
                                    cghsAdjustmentOptions={cghsAdjustmentOptions}
                                    onAdjustmentChange={handleCGHSAdjustmentChange}
                                    itemIdx={idx}
                                    subIdx={subIdx}
                                  />
                                )
                              }
                            </td>
                              <td className="center-align" >
                              <input
                                type="text"
                                value={sub.code || ''}
                                onChange={(sectionType === "implant" || sectionType === "other") ? (e) => {
                                  const newItems = [...invoiceItems];
                                  if (newItems[idx].subItems) {
                                    newItems[idx].subItems[subIdx].code = e.target.value;
                                    setInvoiceItems(newItems);
                                  }
                                } : undefined}
                                className="w-full border-none bg-transparent text-xs text-center p-1"
                                style={{ minHeight: '20px' }}
                                readOnly={sectionType !== "implant" && sectionType !== "other"}
                              />
                            </td>
                              <td className="right-align" >
                              {
                                sub.pricing ? (
                                  <div style={{ fontSize: '11px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                                      {sub.pricing.primaryAdjustment}
                                    </div>
                                      <div style={{ border: '1px solid #000', padding: '2px', margin: '1px 0' }}>
                                      {sub.pricing.baseAmount}
                                    </div>
                                      <div style={{ border: '1px solid #000', padding: '2px', margin: '1px 0' }}>
                                      {sub.pricing.adjustmentAmount || sub.pricing.discountAmount || 0}
                                    </div>
                                    {
                                      sub.pricing.secondaryAmount && (
                                        <div style={{ border: '1px solid #000', padding: '2px', margin: '1px 0' }}>
                                          {sub.pricing.secondaryAmount}
                                        </div>
                                      )
                                    }
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    value={sub.rate || 0}
                                    onChange={(e) => handleRateChange(idx, subIdx, parseFloat(e.target.value) || 0)}
                                    className="w-full border-none bg-transparent text-xs text-right p-1"
                                    style={{ minHeight: '20px' }}
                                    step="0.01"
                                  />
                                )}
                            </td>
                              <td className="center-align" >
                              {
                                sub.pricing ? (
                                  <div style={{ fontSize: '12px' }}> 1 </div>
                                ) : (
                                  <input
                                    type="number"
                                    value={sub.qty || 1}
                                    onChange={(e) => handleQtyChange(idx, subIdx, parseInt(e.target.value) || 1)}
                                    className="w-full border-none bg-transparent text-xs text-center p-1"
                                    style={{ minHeight: '20px' }}
                                    min="1"
                                  />
                                )}
                            </td>
                              <td className="right-align" >
                              <strong>{(sub.pricing ? sub.pricing.finalAmount : sub.amount)?.toFixed(2)}</strong>
                            </td>
                              <td className="center-align" >
                              <div className="flex items-center justify-center gap-1 flex-wrap" >
                                {/* Move Up Button */}
                                  <button
                                  onClick={() => handleMoveSubItemUp(idx, subIdx)}
                                  disabled={subIdx === 0}
                                  className={`px-1 py-1 rounded transition-colors flex items-center justify-center ${subIdx === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                  style={{ fontSize: '10px' }}
                                  title="Move up"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>

                                {/* Move Down Button */}
                                <button
                                  onClick={() => handleMoveSubItemDown(idx, subIdx)}
                                  disabled={item.subItems && subIdx === item.subItems.length - 1}
                                  className={`px-1 py-1 rounded transition-colors flex items-center justify-center ${item.subItems && subIdx === item.subItems.length - 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                  style={{ fontSize: '10px' }}
                                  title="Move down"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteSubItem(idx, subIdx)}
                                  className="px-1 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                                  style={{ fontSize: '10px' }}
                                  title="Delete row"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                } else {
                  return (
                    <tr key={`main-item-${idx}`}>
                      <td><strong>{item.sr}</strong></td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{item.item}</div>
                        {item.details && (
                          <div style={{ fontSize: '11px', color: '#555' }}>{item.details}</div>
                        )}
                        {item.note && (
                          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#555' }}>{item.note}</div>
                        )}
                      </td>
                      <td className="center-align" > {item.code || ''} </td>
                      <td className="right-align" >
                        <input
                          type="number"
                          value={item.rate || 0}
                          onChange={(e) => handleRateChange(idx, undefined, parseFloat(e.target.value) || 0)}
                          className="w-full border-none bg-transparent text-xs text-right p-1"
                          style={{ minHeight: '20px' }}
                          step="0.01"
                        />
                      </td>
                      <td className="center-align" >
                        <input
                          type="number"
                          value={item.qty || 1}
                          onChange={(e) => handleQtyChange(idx, undefined, parseInt(e.target.value) || 1)}
                          className="w-full border-none bg-transparent text-xs text-center p-1"
                          style={{ minHeight: '20px' }}
                          min="1"
                        />
                      </td>
                      <td className="right-align" > <strong>{item.amount?.toFixed(2) || ''}</strong></td>
                      <td className="center-align" >
                        <button
                          onClick={() => handleDeleteMainItem(idx)}
                          className="px-1 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                          style={{ fontSize: '10px' }}
                          title="Delete item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                }
              }

              return <React.Fragment key={`empty-${idx}`} />;
            })}

          {/* Total Row */}
          <tr style={{ backgroundColor: '#000', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
            <td colSpan={5} className="center-align"><strong>TOTAL BILL AMOUNT</strong></td>
            <td className="right-align"><strong>{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="flex justify-between" style={{ marginTop: '32px', fontSize: '12px' }}>
        <div style={{ textAlign: 'center', width: '18%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}> Bill Manager </div>
        </div>
        <div style={{ textAlign: 'center', width: '18%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}> Cashier </div>
        </div>
        <div style={{ textAlign: 'center', width: '18%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}> Patient / Attender Sign </div>
        </div>
        <div style={{ textAlign: 'center', width: '18%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}> Med.Supdt </div>
        </div>
        <div style={{ textAlign: 'center', width: '18%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}> Authorised Signatory </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '12px' }}>
        <button
          onClick={() => window.print()}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Print
        </button>
        <button
          onClick={handleSubmit}
          style={{
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

// Remove the mock patient data since we'll get it from props
interface Patient {
  id: string;
  patient_id: string;
  unique_id: string;  // Added this line
  patient_unique_id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  address?: string;
  insurance_status?: string;
  registration_date: string;
  last_visit_date?: string;
  date_of_admission?: string;
  date_of_discharge?: string;
  corporate?: string;  // Added corporate field
  latestVisit?: {
    visit_id: string;
    patient_unique_id: string;
    visit_date: string;
    visit_type?: string;
    reason?: string;
    department?: string;
    doctor_name?: string;
    notes?: string;
    created_at: string;
  } | null;
}

// Add Visit interface after the Patient interface
interface Visit {
  id: string;
  visit_id: string;
  patient_unique_id: string;
  visit_date: string;
  visit_type: string;
  appointment_with: string;
  visit_reason: string;
  referring_doctor: string;
  diagnosis: string;
  surgery: string;
  created_at: string;
  claim_id: string;
}

interface PatientDashboardProps {
  patient: Patient;
}

export function PatientDashboard({ patient }: PatientDashboardProps) {
  // Debug logging
  console.log('PatientDashboard - patient data:', patient);
  console.log('PatientDashboard - latestVisit:', patient?.latestVisit);

  // Add null check at the start of the component
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen" >
        <div className="text-center" >
          <h2 className="text-xl font-semibold text-gray-700" > Loading patient data...</h2>
        </div>
      </div>
    );
  }

  // Add state variables for treatment dates
  const [conservativeStart, setConservativeStart] = useState('2024-03-04');
  const [conservativeEnd, setConservativeEnd] = useState('2024-03-09');
  const [surgicalStart, setSurgicalStart] = useState('2024-03-10');
  const [surgicalEnd, setSurgicalEnd] = useState('2024-03-15');
  const [conservativeStart2, setConservativeStart2] = useState('2024-03-16');
  const [conservativeEnd2, setConservativeEnd2] = useState('2024-03-21');

  // Use patient data from props instead of mock data
  const patientData = {
    id: patient.id,
    patient_id: patient.patient_id,
    unique_id: patient.unique_id,
    patient_unique_id: patient.patient_unique_id,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone || '',
    address: patient.address || '',
    insuranceStatus: patient.insurance_status || 'Active',
    registrationDate: new Date(patient.registration_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    lastVisit: patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'No visits yet',
    dateOfAdmission: patient.date_of_admission ? new Date(patient.date_of_admission).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'Not admitted',
    dateOfDischarge: patient.date_of_discharge ? new Date(patient.date_of_discharge).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'Not discharged',
    corporate: patient.corporate || ''
  };

  // Initialize visit state with latest visit data if available
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [newVisit, setNewVisit] = useState({
    reason: patient.latestVisit?.reason || "",
    doctor: patient.latestVisit?.doctor_name || "",
    department: patient.latestVisit?.department || "",
    notes: patient.latestVisit?.notes || ""
  });

  // Fetch visits when component mounts
  useEffect(() => {
    async function fetchVisits() {
      try {
        const visitData = await getPatientVisits(patient.unique_id);
        setVisits(visitData);
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error fetching visits:', err.message);
        } else {
          console.error('Error fetching visits:', err);
        }
      }
    }

    fetchVisits();
  }, [patient.unique_id]);

  // Patient image state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patientImage, setPatientImage] = useState<string | null>(null);

  // State for diagnoses and selected diagnosis
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState('');
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [patientDiagnoses, setPatientDiagnoses] = useState<any[]>([]); // For DiagnosisManager data

  // State for surgeries and selected surgery
  const [surgerySearchTerm, setSurgerySearchTerm] = useState('')
  const [isSurgerySearchResultsVisible, setIsSurgerySearchResultsVisible] = useState(false)
  const [selectedSurgeries, setSelectedSurgeries] = useState<string[]>([])
  const [temporarySelectedSurgeries, setTemporarySelectedSurgeries] = useState<string[]>([])
  const [surgeryDetails, setSurgeryDetails] = useState({
    surgeonName: "",
    anesthetistName: "",
    anesthesiaType: "",
    notes: "",
    surgeryDate: "",
    surgeryTime: ""
  })
  const [showSurgerySelectionDialog, setShowSurgerySelectionDialog] = useState(false)
  const [showSurgeryDetailForm, setShowSurgeryDetailForm] = useState(false)
  const [currentSelectedSurgery, setCurrentSelectedSurgery] = useState<any>(null)

  // State for investigations, medications, etc.
  const [selectedInvTab, setSelectedInvTab] = useState('all')
  const [selectedInvDay, setSelectedInvDay] = useState('D1')
  const [selectedMedDay, setSelectedMedDay] = useState('D1')

  // UI state
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const surgerySearchContainerRef = useRef<HTMLDivElement>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(240); // Initial width reduced from 288px to 240px
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<{ startX: number, startWidth: number } | null>(null);

  const basicComplicationId = "BC1";

  // Filter diagnoses based on search term
  const filteredDiagnoses = diagnosisDatabase.filter(
    (diagnosis) =>
      diagnosis.name.toLowerCase().includes(diagnosisSearchTerm.toLowerCase()) ||
      diagnosis.icd.toLowerCase().includes(diagnosisSearchTerm.toLowerCase())
  );

  // State for surgeries from database
  const [surgeryDatabase, setSurgeryDatabase] = useState<Surgery[]>([]);

  // Filter surgeries based on search term
  const filteredSurgeries = surgeryDatabase.filter(
    (surgery) =>
      surgery.name.toLowerCase().includes(surgerySearchTerm.toLowerCase()) ||
      surgery.cghs_code.toLowerCase().includes(surgerySearchTerm.toLowerCase()) ||
      surgery.category.toLowerCase().includes(surgerySearchTerm.toLowerCase())
  );

  const router = useRouter();
  const params = useParams();
  const patientId = params?.id; // or whatever your param is called

  // Navigate to settings page
  const goToSettings = () => {
    router.push("/settings");
  };

  // Add effect for saving changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Effect for closing search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchResultsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveChanges = () => {
    // Here you would save all changes to backend
    toast({
      title: "Changes saved",
      description: "All changes have been saved successfully.",
    });
    setHasUnsavedChanges(false);
  };

  const handleGenerateCaseSheet = () => {
    // Create a window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Error opening print window",
        description: "Please disable pop-up blockers for this site.",
        variant: "destructive"
      });
      return;
    }

    // Get selected diagnoses
    const diagnosesText = diagnoses.map(d => `<li>${d.name}</li>`).join('');

    // Use this data to create the HTML content
    const content = `
      <html>
        <head>
          <title>Patient Case Sheet - ${patientData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0070f3; }
            .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; color: #0070f3; margin-bottom: 10px; }
            .investigation-item, .medication-item { margin-bottom: 8px; padding-left: 20px; position: relative; }
            .investigation-item:before, .medication-item:before { content: "•"; position: absolute; left: 0; color: #0070f3; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f0f7ff; color: #0070f3; font-weight: bold; }
            .complication { background-color: #fdf9eb; padding: 8px; border-left: 3px solid #f59e0b; margin-bottom: 5px; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { width: 200px; border-top: 1px solid #000; padding-top: 5px; text-align: center; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hope Hospital</h1>
            <h2>Patient Case Sheet</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
            <div class="patient-info">
            <div>
              <strong>Patient Name:</strong> ${patientData.name}
            </div>
            <div>
              <strong>Patient ID:</strong> ${patientData.unique_id}
          </div>
            <div>
              <strong>Age:</strong> ${patientData.age} years
            </div>
            <div>
              <strong>Gender:</strong> ${patientData.gender}
            </div>
            <div>
              <strong>Registration Date:</strong> ${patientData.registrationDate}
            </div>
            <div>
              <strong>Contact:</strong> ${patientData.phone}
            </div>
            <div>
              <strong>Date of Admission:</strong> ${patientData.dateOfAdmission}
            </div>
            <div>
              <strong>Date of Discharge:</strong> ${patientData.dateOfDischarge}
            </div>
          </div>
          
      <div class="section">
            <div class="section-title">Diagnoses</div>
            ${diagnoses.length > 0 ? `<ul>${diagnosesText}</ul>` : `<p>No diagnoses recorded.</p>`}
      </div>
    
        <div class="section">
            <div class="section-title">Investigations (${selectedInvDay})</div>
            <div>
              ${[
        // Fake investigations for the demo to show all possible complications
        { name: 'Complete Blood Count (CBC)', result: 'Normal', normal: true },
        { name: 'Erythrocyte Sedimentation Rate (ESR)', result: 'Elevated (30 mm/hr)', normal: false },
        { name: 'C-Reactive Protein (CRP)', result: 'Elevated (15 mg/L)', normal: false },
        { name: 'Blood Glucose', result: 'Normal fasting', normal: true },
        { name: 'Liver Function Tests', result: 'Within normal limits', normal: true },
        { name: 'Kidney Function Tests', result: 'Creatinine slightly elevated', normal: false },
        { name: 'X-Ray Chest', result: 'Clear lung fields', normal: true },
        { name: 'ECG', result: 'Normal sinus rhythm', normal: true },
        { name: 'Urinalysis', result: 'No abnormalities detected', normal: true }
      ].map(inv => `
                  <div class="investigation-item">
                    <strong>${inv.name}:</strong> 
                    <span style="color: ${inv.normal ? 'green' : 'red'}">${inv.result}</span>
        </div>
                `).join('')
      }
            </div>
          </div>
    
        <div class="section">
            <div class="section-title">Medications (${selectedMedDay})</div>
            <div>
              ${[
        // Fake medications for the demo
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' },
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'BID', duration: '5 days' },
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD', duration: '10 days' },
        { name: 'Hydrochlorothiazide', dosage: '25mg', frequency: 'OD', duration: 'Continuous' },
        { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Continuous' }
      ].map(med => `
                  <div class="medication-item">
                    <strong>${med.name}</strong> - ${med.dosage} ${med.frequency} for ${med.duration}
        </div>
                `).join('')
      }
            </div>
          </div>
    
        <div class="section">
            <div class="section-title">Clinical Notes</div>
            <p>
              Patient presented with symptoms of fever and productive cough for 5 days. Physical examination revealed normal vital signs except for temperature of 38.2°C. Chest auscultation showed clear breath sounds bilaterally. Patient was started on empiric antibiotics and supportive care.
            </p>
            <p>
              Patient has been responding well to the treatment. Fever subsided on day 2 of admission. Cough has decreased in frequency and severity. Plan for discharge with oral antibiotics to complete a 7-day course.
            </p>
        </div>
    
      <div class="section">
            <div class="section-title">Management Plan</div>
            <ol>
              <li>Complete antibiotic course as prescribed</li>
              <li>Follow-up in outpatient clinic in 1 week</li>
              <li>Continue regular medications for chronic conditions</li>
              <li>Return immediately if symptoms worsen or new symptoms develop</li>
              <li>Avoid strenuous activities for 1 week</li>
            </ol>
      </div>
          
          <div class="signature">
            <div>
              <div class="signature-line">Patient's Signature</div>
      </div>
            <div>
              <div class="signature-line">Doctor's Signature</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print();" style="padding: 10px 20px; background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Case Sheet
            </button>
        </div>
      </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    // Auto-print
    setTimeout(() => {
      printWindow.print();
      toast({
        title: "Case Sheet Generated",
        description: "The case sheet is ready for printing."
      });
    }, 500);
  };

  // Generate a unique visit ID
  const generateVisitId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VISIT-${year}-${random}`;
  };

  // Handle submitting a new visit
  const handleSubmitVisit = () => {
    if (!newVisit.reason || !newVisit.doctor || !newVisit.department) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const visitId = generateVisitId();

    const visit: Visit = {
      id: `visit-${Date.now()}`,
      visit_id: visitId,
      patient_unique_id: patient.unique_id || patient.patient_unique_id,
      visit_date: today.toISOString(),
      visit_type: newVisit.department,
      appointment_with: newVisit.doctor,
      visit_reason: newVisit.reason,
      referring_doctor: 'Self',
      diagnosis: newVisit.notes || 'General consultation',
      surgery: '',
      created_at: today.toISOString(),
      claim_id: `CLAIM-${Date.now()}`
    };

    setVisits([visit, ...visits]);
    setIsVisitFormOpen(false);
    setNewVisit({
      reason: "",
      doctor: "",
      department: "",
      notes: ""
    });

    toast({
      title: "Visit recorded",
      description: "The new visit has been added to the patient's record."
    });
  };

  const handleGenerateInvoice = () => {
    toast({
      title: "Invoice Generated",
      description: "Invoice is being prepared"
    });
  };

  // Add this handler for image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function (event) {
        setPatientImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setHasUnsavedChanges(true);
    }
  };

  // Function to add a diagnosis
  const handleAddDiagnosis = (diagnosis: { id: string, name: string, icd: string }) => {
    // Check if diagnosis already exists
    if (diagnoses.some(d => d.id === diagnosis.id)) {
      toast({
        title: "Diagnosis already added",
        description: "This diagnosis is already in the patient's record.",
        variant: "destructive"
      });
      return;
    }

    const newDiagnosis: Diagnosis = {
      id: diagnosis.id,
      name: diagnosis.name,
      approved: false
    };

    setDiagnoses([...diagnoses, newDiagnosis]);
    setDiagnosisSearchTerm("");
    setIsSearchResultsVisible(false);
    setHasUnsavedChanges(true);
  };

  // Function to remove a diagnosis
  const handleRemoveDiagnosis = (id: string) => {
    setDiagnoses(diagnoses.filter(d => d.id !== id));
    if (selectedDiagnosis === id) {
      setSelectedDiagnosis(null);
    }
    setHasUnsavedChanges(true);
  };

  // Function to handle surgery selection
  const handleAddSurgery = (surgeryId: string) => {
    if (selectedSurgeries.includes(surgeryId)) {
      toast({
        title: "Surgery already added",
        description: "This surgery is already in the patient's record.",
        variant: "destructive"
      });
      return;
    }

    setSelectedSurgeries([...selectedSurgeries, surgeryId]);
    setSurgerySearchTerm("");
    setIsSurgerySearchResultsVisible(false);
    setHasUnsavedChanges(true);
  };

  // Function to toggle surgery selection in the dialog
  const toggleSurgerySelection = (surgeryId: string) => {
    if (temporarySelectedSurgeries.includes(surgeryId)) {
      setTemporarySelectedSurgeries(temporarySelectedSurgeries.filter(id => id !== surgeryId));
    } else {
      setTemporarySelectedSurgeries([...temporarySelectedSurgeries, surgeryId]);
    }
  };

  // Function to remove a surgery
  const handleRemoveSurgery = (surgeryId: string) => {
    setSelectedSurgeries(selectedSurgeries.filter(id => id !== surgeryId));
    setHasUnsavedChanges(true);
  };

  // Handle diagnoses changes from DiagnosisManager
  const handleDiagnosesChange = (newDiagnoses: any[]) => {
    setPatientDiagnoses(newDiagnoses);
    setHasUnsavedChanges(true);
  };

  // Add resize event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizingRef.current) return;

      const { startX, startWidth } = resizingRef.current;
      const diffX = e.clientX - startX;
      const newWidth = Math.max(240, Math.min(800, startWidth + diffX)); // Allow expansion up to 800px

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizingRef.current = null;
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizingRef.current = {
      startX: e.clientX,
      startWidth: sidebarWidth
    };
  };

  const fetchVisits = async () => {
    if (!patient?.unique_id) return;
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('patient_unique_id', patient.unique_id) // filter by patient
      .order('created_at', { ascending: false });
    if (error) { /* handle error */ }
    setVisits(data || []);
  };

  // Fetch surgeries from cghs_surgery table
  const fetchSurgeries = async () => {
    try {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error fetching surgeries:', error.message || error);
        throw error;
      }

      setSurgeryDatabase(data || []);
    } catch (error: any) {
      console.error('Error fetching surgeries:', error?.message || error?.toString() || 'Unknown error occurred');
      // Set empty array as fallback
      setSurgeryDatabase([]);
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchSurgeries();
  }, [patient?.unique_id]);

  // Initialize comprehensive invoice items
  useEffect(() => {
    if (patientData && visits.length > 0) {
      const latestVisit = visits[0];
      const items = [
        // Conservative Treatment Section
        {
          type: "section",
          title: "Conservative Treatment",
          dateRange: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`
        },

        // Surgical Package Section
        {
          type: "section",
          title: "Surgical Package (5 Days)",
          dateRange: `Dt.(${surgicalStart?.split('-').reverse().join('/')} TO ${surgicalEnd?.split('-').reverse().join('/')})`
        },

        // 1) Consultation for Inpatients
        {
          type: "main",
          sr: "1)",
          item: "Consultation for Inpatients",
          code: "2",
          subItems: [
            {
              sr: "i)",
              item: "Dr. Pranal Sahare,(Urologist)",
              details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
              rate: 350.00,
              qty: 8,
              amount: 2800.00
            },
            {
              sr: "ii)",
              item: "Dr. Ashwin Chichkhede, MD (Medicine)",
              details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
              rate: 350.00,
              qty: 8,
              amount: 2800.00
            }
          ]
        },

        // 2) Accommodation Charges
        {
          type: "main",
          sr: "2)",
          item: "Accommodation Charges",
          subItems: [
            {
              sr: "i)",
              item: "Accommodation For General Ward",
              details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
              rate: 1500.00,
              qty: 8,
              amount: 12000.00
            }
          ]
        },

        // 3) Pathology Charges (First Period)
        {
          type: "main",
          sr: "3)",
          item: "Pathology Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 1674.00,
          qty: 1,
          amount: 1674.00,
          subItems: [
            {
              sr: "i)",
              item: "Biliary Stent",
              code: "UNLISTED",
              rate: 60400.00,
              qty: 1,
              amount: 60400.00
            }
          ]
        },

        // 4) Medicine Charges
        {
          type: "main",
          sr: "4)",
          item: "Medicine Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pharmacy Statement with Bills",
          rate: 21306.00,
          qty: 1,
          amount: 21306.00
        },

        // 5) Others Charges
        {
          type: "main",
          sr: "5)",
          item: "Other Charges",
          subItems: [
            { sr: "i)", item: "ECG", code: "590", rate: 58.00, qty: 1, amount: 58.00 },
            { sr: "vi)", item: "Chest PA view", code: "1608", rate: 63.00, qty: 1, amount: 63.00 },
            { sr: "viii)", item: "RBS", code: "1444", rate: 24.00, qty: 21, amount: 504.00 }
          ]
        },

        // 6) Surgical Treatment (25/04/2023)
        {
          type: "main",
          sr: "6)",
          item: `Surgical Treatment (${surgicalStart?.split('-').reverse().join('/')})`,
          subItems: [
            {
              sr: "i)",
              item: "Mechanical lithotripsy of CBD stones",
              code: "1309",
              pricing: {
                baseAmount: 9200,
                primaryAdjustment: "Add : 15% Gen. Ward Charges as per CGHS Guidline",
                adjustmentAmount: 1380,
                finalAmount: 10580.00
              }
            },
            {
              sr: "iv)",
              item: "CBD stone extraction",
              code: "1306",
              pricing: {
                baseAmount: 2777,
                primaryAdjustment: "Add : 15% Gen. Ward Charges as per CGHS Guidline",
                adjustmentAmount: 416,
                secondaryAdjustment: "Less : 50% as per CGHS Guidline",
                secondaryAmount: 3193,
                finalAmount: 1596.00
              }
            },
            {
              sr: "vi)",
              item: "Endoscopic sphincterotomy",
              code: "1305",
              pricing: {
                baseAmount: 2777,
                primaryAdjustment: "Add : 15% Gen. Ward Charges as per CGHS Guidline",
                adjustmentAmount: 416,
                secondaryAdjustment: "Less : 50% as per CGHS Guidline",
                secondaryAmount: 3193,
                finalAmount: 1596.00
              }
            }
          ]
        },

        // 7) Implant Charges
        {
          type: "main",
          sr: "7)",
          item: "Implant Charges",
          subItems: [
            {
              sr: "i)",
              item: "t",
              code: "UNLISTED",
              rate: 0.00,
              qty: 0,
              amount: 0.00
            }
          ]
        },

        {
          type: "main",
          sr: "8)",
          item: "Pathology Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 1674.00,
          qty: 1,
          amount: 1674.00,
          subItems: [
            {
              sr: "i)",
              item: "Biliary Stent",
              code: "UNLISTED",
              rate: 60400.00,
              qty: 1,
              amount: 60400.00
            }
          ]
        },

        {
          type: "main",
          sr: "9)",
          item: "Medicine Charges",
          details: `Dt.(${conservativeStart?.split('-').reverse().join('/')} TO ${conservativeEnd?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 1674.00,
          qty: 1,
          amount: 1674.00,
          subItems: [
            {
              sr: "i)",
              item: "Biliary Stent",
              code: "UNLISTED",
              rate: 60400.00,
              qty: 1,
              amount: 60400.00
            }
          ]
        },

        // Second Treatment Period Section
        {
          type: "section",
          title: "Post-Surgical Conservative Treatment",
          dateRange: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`
        },

        // 3) Pathology Charges (Second Period)
        {
          type: "main",
          sr: "3)",
          item: "Pathology Charges",
          details: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 41148.00,
          qty: 1,
          amount: 41148.00
        },


        {
          type: "main",
          sr: "4)",
          item: "Medicine Charges",
          details: `Dt.(${conservativeStart2?.split('-').reverse().join('/')} TO ${conservativeEnd2?.split('-').reverse().join('/')})`,
          note: "Note: Attached Pathology Break-up",
          rate: 41148.00,
          qty: 1,
          amount: 41148.00
        },

        // 5) Others Charges (Second Period)
        {
          type: "main",
          sr: "5)",
          item: "Others Charges",
          subItems: [
            { sr: "i)", item: "ECG", code: "590", rate: 58.00, qty: 1, amount: 58.00 },
            { sr: "ii)", item: "Extremities, bones & Joints AP & Lateral views (Two films)", code: "1611", rate: 270.00, qty: 1, amount: 270.00 },
            { sr: "iii)", item: "Chest PA view", code: "1608", rate: 63.00, qty: 1, amount: 63.00 },
            { sr: "vi)", item: "RBS", code: "1444", rate: 24.00, qty: 17, amount: 408.00 }
          ]
        },

        // 6) Surgical Treatment (Second Period)
        {
          type: "main",
          sr: "6)",
          item: `Surgical Treatment (${conservativeStart2?.split('-').reverse().join('/')})`,
          subItems: [
            {
              sr: "i)",
              item: "Other Major Surgery(Arthroscopic Shoulder)",
              code: "1238",
              pricing: {
                baseAmount: 40500,
                primaryAdjustment: "Less : 10% Gen. Ward Charges as per CGHS Guidline",
                adjustmentAmount: 4050,
                finalAmount: 36450.00
              }
            }
          ]
        }
      ];

      // setInvoiceItems(items);
    }
  }, [patientData, visits, conservativeStart, conservativeEnd, surgicalStart, surgicalEnd]);

  const handleDateChange = (field: string, value: string) => {
    switch (field) {
      case 'conservativeStart':
        setConservativeStart(value);
        break;
      case 'conservativeEnd':
        setConservativeEnd(value);
        break;
      case 'surgicalStart':
        setSurgicalStart(value);
        break;
      case 'surgicalEnd':
        setSurgicalEnd(value);
        break;
      case 'conservativeStart2':
        setConservativeStart2(value);
        break;
      case 'conservativeEnd2':
        setConservativeEnd2(value);
        break;
    }
  };

  // Add state for history and examination details at the top of the PatientDashboard component
  const [historyDetails, setHistoryDetails] = useState("");
  const [examinationFindings, setExaminationFindings] = useState("");

  const [radiologyOptions, setRadiologyOptions] = useState<any[]>([]);
  const [selectedRadiology, setSelectedRadiology] = useState<any[]>([]);
  const [radiologySearch, setRadiologySearch] = useState('');

  useEffect(() => {
    if (selectedInvTab === 'radiology') {
      const fetchRadiology = async () => {
        const { data, error } = await supabase
          .from('radiology')
          .select('*')
          .order('name');
        if (!error) setRadiologyOptions(data || []);
      };
      fetchRadiology();
    }
  }, [selectedInvTab]);

  const [labOptions, setLabOptions] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any[]>([]);
  const [labSearch, setLabSearch] = useState('');

  useEffect(() => {
    if (selectedInvTab === 'lab') {
      const fetchLab = async () => {
        const { data, error } = await supabase
          .from('lab')
          .select('*')
          .order('name');
        if (!error) setLabOptions(data || []);
      };
      fetchLab();
    }
  }, [selectedInvTab]);

  const [labTime, setLabTime] = useState('');
  const [radiologyTime, setRadiologyTime] = useState('');

  // 1. Add type and state at the top (with other states)
  type RadiologyInvestigation = {
    id: number;
    investigation_id: number;
    created_at: string;
    investigation?: { name: string } | null;
  };

  const [fetchedRadiologyData, setFetchedRadiologyData] = useState<RadiologyInvestigation[]>([]);
  console.log(fetchedRadiologyData);

  // 2. Fetch function
  const fetchStoredRadiology = async () => {
    if (!patient.unique_id || !visits[0]?.visit_id) return;
    const { data, error } = await supabase
      .from('patient_radiology_investigations')
      .select(`
        id, investigation_id, created_at,
        investigation:investigation_id(name)
      `)
      .eq('visit_id', visits[0]?.visit_id)
      .eq('unique_id', patient.unique_id)
      .eq('day', selectedInvDay)
      .order('created_at', { ascending: false });
    console.log(data);

    // Map investigation to object or null
    const mapped = (data || []).map(item => ({
      ...item,
      investigation: Array.isArray(item.investigation) ? item.investigation[0] : item.investigation
    }));
    setFetchedRadiologyData(mapped);
  };

  // 3. useEffect to fetch on tab/day change
  useEffect(() => {
    if (selectedInvTab === 'radiology' && patient.unique_id && visits[0]?.visit_id) {
      fetchStoredRadiology();
    }
  }, [selectedInvDay, selectedInvTab, patient.unique_id, visits]);

  type LabInvestigation = {
    id: number;
    investigation_id: number;
    created_at: string;
    investigation?: { name: string } | null;
  };

  const [fetchedLabData, setFetchedLabData] = useState<LabInvestigation[]>([]);

  // 2. Fetch function
  const fetchStoredLab = async () => {
    if (!patient.unique_id || !visits[0]?.visit_id) return;
    const { data, error } = await supabase
      .from('patient_lab_investigations')
      .select(`
        id, investigation_id, created_at,
        investigation:investigation_id(name)
      `)
      .eq('visit_id', visits[0]?.visit_id)
      .eq('unique_id', patient.unique_id)
      .eq('day', selectedInvDay)
      .order('created_at', { ascending: false });
    console.log(data);

    // Map investigation to object or null
    const mapped = (data || []).map(item => ({
      ...item,
      investigation: Array.isArray(item.investigation) ? item.investigation[0] : item.investigation
    }));
    setFetchedLabData(mapped);
  };

  // 3. useEffect to fetch on tab/day change
  useEffect(() => {
    if (selectedInvTab === 'lab' && patient.unique_id && visits[0]?.visit_id) {
      fetchStoredLab();
    }
  }, [selectedInvDay, selectedInvTab, patient.unique_id, visits]);

  // Add state for Add Prompt dropdown
  const [promptType, setPromptType] = useState('Discharge summary');

  // Add state for fetched details and generated summary
  const [fetchedDetails, setFetchedDetails] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');

  // Handler for Fetch button
  const handleFetchDetails = () => {
    // Gather demographic and clinical details
    let details = '';
    details += `Name: ${patient.name}\n`;
    details += `Patient ID: ${patient.unique_id}\n`;
    details += `Age: ${patient.age}\n`;
    details += `Gender: ${patient.gender}\n`;
    details += `Phone: ${patient.phone || ''}\n`;
    details += `Address: ${patient.address || ''}\n`;
    details += `Insurance Status: ${patient.insurance_status || ''}\n`;
    details += `Registration Date: ${patient.registration_date}\n`;
    details += `Date of Admission: ${patient.date_of_admission || ''}\n`;
    details += `Date of Discharge: ${patient.date_of_discharge || ''}\n`;
    details += `Diagnoses: ${(patientDiagnoses.length > 0 ? patientDiagnoses.map(d => d.diagnosis?.name || d.name).join(', ') : 'None')}\n`;
    details += `Surgeries: ${(selectedSurgeries.length > 0 ? selectedSurgeries.join(', ') : 'None')}\n`;
    details += `History: ${historyDetails}\n`;
    details += `Examination: ${examinationFindings}\n`;
    setFetchedDetails(details);
  };

  // Handler for Run Prompt button (AI integration)
  const handleRunPrompt = async () => {
    setGeneratedSummary('Generating summary...');
    try {
      const response = await fetch('/api/ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: fetchedDetails, promptType }),
      });
      const data = await response.json();
      if (response.ok && data.summary) {
        setGeneratedSummary(data.summary);
      } else {
        setGeneratedSummary('Error: ' + (data.error || 'Failed to generate summary.'));
      }
    } catch (err) {
      setGeneratedSummary('Error: Unable to connect to AI service.');
    }
  };

  // Find selected surgery details from surgeryDatabase
  const selectedSurgeryDetails = surgeryDatabase.filter(surgery =>
    selectedSurgeries.includes(surgery.id.toString())
  );

  // Collect all complications for selected surgeries
  const complications = selectedSurgeryDetails.flatMap(surgery =>
    [surgery.complication1, surgery.complication2, surgery.complication3, surgery.complication4].filter(Boolean)
  );

  // Prepare the string for display
  const complicationsString = complications.length > 0
    ? `Complication: ${complications.join(', ')}`
    : 'Complication: None';

  // Add state for CGHS complication search
  const [cghsComplicationSearch, setCghsComplicationSearch] = useState('');

  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase
        .from('doctor')
        .select('dr_id, name, specialization');
      if (!error && data) {
        setDoctorOptions(
          data.map((doc: any) => ({
            id: doc.dr_id,
            name: doc.name,
            specialization: doc.specialization
          }))
        );
      }
    }
    fetchDoctors();
  }, []);

  console.log('doctorOptions:', doctorOptions);

  // Example async function
  const getMedicationTotal = async (patient_id: string, visit_id: string) => {
    const { data, error } = await supabase
      .from('patient_medications')
      .select('amount')
      .eq('patient_id', patient_id)
      .eq('visit_id', visit_id);

    if (error) {
      console.error(error);
      return 0;
    }

    // Sum all amounts
    const total = (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
    return total;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
    }>
      {/* Resizable Secondary Sidebar */}
      <div
        className={`transition-all relative bg-white/85 backdrop-blur-lg border-r border-blue-100/60 shadow-2xl flex flex-col h-screen sticky top-0 z-20 ${isSidebarExpanded ? '' : 'w-12'} overflow-hidden`}
        style={{
          width: isSidebarExpanded ? `${sidebarWidth}px` : '3rem',
          minWidth: isSidebarExpanded ? '180px' : '3rem',
          margin: 0,
          padding: 0,
          transition: isResizing ? 'none' : 'all 0.3s ease'
        }}
      >
        {/* Resize handle - only visible when expanded */}
        {
          isSidebarExpanded && (
            <div
              className="absolute top-0 right-0 w-4 h-full cursor-col-resize z-30 flex items-center justify-center"
              onMouseDown={startResizing}
            >
              <div className="h-16 w-[3px] bg-gradient-to-b from-blue-400 to-purple-400 rounded-full opacity-50 hover:opacity-100 transition-all duration-300 hover:shadow-lg" />
            </div>
          )
        }

        {/* Expand button, only show when collapsed */}
        {
          !isSidebarExpanded && (
            <button
              className="w-full py-4 border-b border-blue-100/60 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 flex items-center justify-center group"
              onClick={() => setIsSidebarExpanded(true)
              }
            >
              <span className="sr-only" > Expand sidebar </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

        {/* Collapse button, only show when expanded */}
        {
          isSidebarExpanded && (
            <button
              className="w-full py-4 border-b border-blue-100/60 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 flex items-center justify-center group"
              onClick={() => setIsSidebarExpanded(false)
              }
            >
              <span className="sr-only" > Collapse sidebar </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

        <div className="flex-1 flex flex-col gap-0 p-0 m-0 overflow-y-auto" >
          {/* Merged Surgeries/Complications Card with Tabs */}
          <div className={isSidebarExpanded ? '' : 'hidden'} >
            <Card className="shadow-xl border border-blue-100/50 m-3 mt-6 bg-white/75 backdrop-blur-md rounded-2xl" >
              <CardHeader className="pb-4 px-6 pt-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-t-2xl" >
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight" > Patient Details </CardTitle>
                <CardDescription className="text-blue-600/70 text-sm mt-1 leading-relaxed" > Diagnoses and Complications </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6" >
                <Tabs defaultValue="diagnoses" className="w-full" >
                  <TabsList className="flex gap-1.5 mb-5 bg-blue-50/60 p-1.5 rounded-xl w-full border border-blue-100/50" >
                    <TabsTrigger
                      value="diagnoses"
                      className="flex-1 text-center rounded-lg px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:text-blue-700 text-xs tracking-wide transition-all duration-300"
                    >
                      Clinical Mgmt
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="flex-1 text-center rounded-lg px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:text-blue-700 text-xs tracking-wide transition-all duration-300"
                    >
                      History
                    </TabsTrigger>
                    <TabsTrigger
                      value="examination"
                      className="flex-1 text-center rounded-lg px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:text-blue-700 text-xs tracking-wide transition-all duration-300"
                    >
                      Examination
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="diagnoses" >
                    <DiagnosisManager
                      patientUniqueId={patient?.unique_id || ''}
                      visitId={visits[0]?.visit_id || undefined}
                      onDiagnosesChange={handleDiagnosesChange}
                    />
                  </TabsContent>

                  {/* Surgeries Tab */}
                  <TabsContent value="surgeries" >
                    <div className="mb-4" ref={surgerySearchContainerRef} >
                      <div className="relative" >
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" >
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          placeholder="Search by surgery name, CGHS code, or category..."
                          value={surgerySearchTerm}
                          onChange={(e) => {
                            setSurgerySearchTerm(e.target.value)
                            setIsSurgerySearchResultsVisible(true)
                          }}
                          onFocus={() => setIsSurgerySearchResultsVisible(true)}
                          className="pl-11 py-3 border-blue-200/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 bg-white/85 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 focus:shadow-md text-sm"
                        />
                      </div>

                      {/* Surgery Search Results */}
                      {
                        isSurgerySearchResultsVisible && surgerySearchTerm && (
                          <div className="mt-3 border rounded-xl max-h-[300px] overflow-y-auto shadow-lg bg-white/95 backdrop-blur-sm" >
                            {
                              filteredSurgeries.length > 0 ? (
                                <div className="divide-y" >
                                  {
                                    filteredSurgeries.map((surgery) => (
                                      <div
                                        key={surgery.id}
                                        className="flex items-center justify-between p-4 hover:bg-blue-50/50 cursor-pointer transition-colors"
                                      >
                                        <div className="flex-grow" >
                                          <p className="font-medium" > {surgery.name} </p>
                                          <div className="flex items-center gap-2 mt-1" >
                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700" >
                                              CGHS: {surgery.cghs_code}
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700" >
                                              {surgery.category}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="text-right" >
                                          <p className="text-lg font-semibold text-blue-700" >₹{surgery.amount.toLocaleString()} </p>
                                        </div>
                                        <div className="ml-4" >
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setShowSurgerySelectionDialog(true);
                                              setSurgerySearchTerm("");
                                              setIsSurgerySearchResultsVisible(false);
                                            }}
                                          >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Surgery
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              ) : (
                                <div className="p-6 text-center text-gray-500 text-sm" >
                                  No surgeries found.Try a different search term.
                                </div>
                              )}
                          </div>
                        )}

                      {/* Selected Surgeries List */}
                      {
                        selectedSurgeries.length > 0 && (
                          <div className="mt-4 border rounded-md overflow-hidden" >
                            <table className="min-w-full divide-y divide-gray-200" >
                              <thead className="bg-gray-50" >
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Surgery </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Date & Time </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Surgeon </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Action </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200" >
                                {
                                  selectedSurgeries.map((surgeryId) => {
                                    const surgery = surgeryDatabase.find(s => s.id.toString() === surgeryId);
                                    if (!surgery) return null;

                                    return (
                                      <tr key={surgeryId} className="hover:bg-gray-50" >
                                        <td className="px-4 py-3" >
                                          <div className="text-sm font-medium text-gray-900" > {surgery.name} </div>
                                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2" >
                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-1.5 py-0.5 text-[10px]" >
                                              CGHS: {surgery.cghs_code}
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-1.5 py-0.5 text-[10px]" >
                                              {surgery.category}
                                            </Badge>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3" >
                                          <div className="text-sm text-gray-900" > {surgeryDetails.surgeryDate || "Not scheduled"} </div>
                                          <div className="text-xs text-gray-500" > {surgeryDetails.surgeryTime || ""} </div>
                                        </td>
                                        <td className="px-4 py-3" >
                                          <div className="text-sm text-gray-900" > {surgeryDetails.surgeonName || "Not assigned"} </div>
                                          {
                                            surgeryDetails.anesthetistName && (
                                              <div className="text-xs text-gray-500 mt-1" >
                                                Anesthetist: {surgeryDetails.anesthetistName}
                                              </div>
                                            )
                                          }
                                          {
                                            surgeryDetails.anesthesiaType && (
                                              <div className="text-xs text-gray-500" >
                                                {surgeryDetails.anesthesiaType}
                                              </div>
                                            )
                                          }
                                        </td>
                                        <td className="px-4 py-3 text-right" >
                                          <div className="flex items-center gap-2" >
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                // Open edit form for this surgery
                                                setCurrentSelectedSurgery(surgery);
                                                setShowSurgeryDetailForm(true);
                                              }}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleRemoveSurgery(surgeryId)}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}

                      {/* Add Surgery Button */}
                      <div className="mt-4" >
                        <Button
                          variant="outline"
                          className="w-full bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md rounded-xl"
                          onClick={() => {
                            setTemporarySelectedSurgeries([]);
                            setShowSurgerySelectionDialog(true);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
                          Add Surgery
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="complications" >
                    <div className="mt-2" >
                      <SelectedComplicationsList
                        surgeryComplications={[]}
                        selectedSurgeries={[]}
                        diagnosisComplications={[]}
                        selectedDiagnoses={[]}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="history" >
                    <div className="mb-4" >
                      <Label className="block text-sm font-medium mb-2" > History Details </Label>
                      < Textarea
                        placeholder="Enter patient history details here..."
                        value={historyDetails}
                        onChange={e => setHistoryDetails(e.target.value)}
                        className="w-full min-h-[100px] text-sm border border-blue-200 rounded-lg p-2"
                      />
                    </div>
                  </TabsContent>
                  < TabsContent value="examination" >
                    <div className="mb-4" >
                      <Label className="block text-sm font-medium mb-2" > Examination Findings </Label>
                      < Textarea
                        placeholder="Enter examination findings here..."
                        value={examinationFindings}
                        onChange={e => setExaminationFindings(e.target.value)}
                        className="w-full min-h-[100px] text-sm border border-blue-200 rounded-lg p-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          {/* Show icons when collapsed */}
          <div className={`flex flex-col items-center gap-8 mt-6 ${isSidebarExpanded ? 'hidden' : ''}`}>
            <div className="flex flex-col items-center gap-1" >
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
              <span className="text-[9px] text-blue-700 text-center" > Diagnoses </span>
            </div>
            < div className="flex flex-col items-center gap-1" >
              <Scissors className="h-4 w-4 text-blue-600" />
              <span className="text-[9px] text-blue-700 text-center" > Surgeries </span>
            </div>
            < div className="flex flex-col items-center gap-1" >
              <ClipboardList className="h-4 w-4 text-blue-600" />
              <span className="text-[9px] text-blue-700 text-center whitespace-normal px-1" > Complications </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto" >
        {/* Patient Information Card at the very top, always visible and aligned to the right of the sidebar */}
        < div className="p-6" style={{ minWidth: 0 }}>
          <Card className="border-blue-200/40 transition-all duration-300 shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl overflow-hidden" >
            <CardHeader className="pb-6 px-8 pt-8 bg-gradient-to-r from-blue-50/60 via-indigo-50/60 to-purple-50/60 border-b border-blue-100/40" >
              <div className="flex justify-between items-start gap-6" >
                <div className="flex items-center gap-6" >
                  {/* Avatar with upload */}
                  < div className="relative group" >
                    <Avatar
                      className={`transition-all duration-300 border-4 border-white shadow-xl h-24 w-24 cursor-pointer group-hover:scale-105 group-hover:shadow-2xl`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {
                        patientImage ? (
                          <AvatarImage src={patientImage} alt={patientData.name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700 text-2xl font-bold">
                            {patientData.name.split(' ').map(n => n[0]).join('')
                            }
                          </AvatarFallback>
                        )}
                    </Avatar>
                    < input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-full px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg" > Edit </span>
                  </div>
                  < div >
                    <h2 className="font-bold text-4xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight leading-tight" >
                      {
                        patient.latestVisit && patient.latestVisit.department ? (
                          <span>
                            <span className="text-3xl font-semibold text-blue-600" > {patient.latestVisit.department} </span>
                            < span className="mx-2" > -</span>
                          </span>
                        ) : ''}{patient.name}
                    </h2>
                    < div className="flex items-center gap-4 mt-3" >
                      <Badge variant="outline" className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60 shadow-sm font-medium tracking-wide" >
                        ID: {patient.unique_id} , {patient.age} years, {patient.gender}
                      </Badge>
                      {/* <span className="text-sm text-muted-foreground">
                        {patientData.age} years, {patientData.gender}
                      </span> */}
                    </div>
                  </div>
                </div>
                < Badge className={(patient.insurance_status || 'Active') === "Active" ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg px-4 py-2 font-semibold tracking-wide" : "bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg px-4 py-2 font-semibold tracking-wide"}>
                  {patient.insurance_status || 'Active'}
                </Badge>
              </div>
            </CardHeader>
            < CardContent className="py-6 px-8 bg-white/60" >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" >
                <div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-blue-50" >
                  <Phone className="h-5 w-5 mr-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 tracking-wide" > {patient.phone} </span>
                </div>
                < div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-blue-50" >
                  <CalendarDays className="h-5 w-5 mr-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 tracking-wide" >
                    Last Visit: {
                      patient.latestVisit?.visit_date
                        ? `${new Date(patient.latestVisit.visit_date).toLocaleDateString()} (${patient.latestVisit.department || patient.latestVisit.visit_type || 'General'})`
                        : 'No visits yet'
                    }
                  </span>
                </div>
                < div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-blue-50" >
                  <UserRound className="h-5 w-5 mr-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 tracking-wide" >
                    Registered: {new Date(patient.registration_date).toLocaleDateString()}
                  </span>
                </div>
                < div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-blue-50" >
                  <CalendarDays className="h-5 w-5 mr-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 tracking-wide" >
                    Admission: {
                      patient.latestVisit?.visit_date
                        ? `${new Date(patient.latestVisit.visit_date).toLocaleDateString()} (${patient.latestVisit.department || patient.latestVisit.visit_type || 'General'})`
                        : 'Not admitted'
                    }
                  </span>
                </div>
                < div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-blue-50" >
                  <CalendarDays className="h-5 w-5 mr-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700 tracking-wide" >
                    Discharge: {
                      patient.date_of_discharge
                        ? new Date(patient.date_of_discharge).toLocaleDateString()
                        : 'Not discharged'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        < div className="px-6 grid gap-8 md:grid-cols-12" >
          {/* Investigations, Medications, and Action Buttons */}
          < div className="md:col-span-4 space-y-8" >
            {/* Investigations Section with Tabs */}
            < Card className="shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl border border-blue-100/40 overflow-hidden" >
              <CardHeader className="pb-4 px-6 pt-6 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-b border-blue-100/30" >
                <div>
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight" > Investigations </CardTitle>
                  < CardDescription className="text-blue-600/70 text-sm mt-1 leading-relaxed" > All investigations and reports </CardDescription>
                  {/* Show selected investigations for Lab or Radiology */}
                  {
                    selectedInvTab === 'lab' && selectedLab.length > 0 && (
                      <div className="mt-2 text-xs text-blue-700" >
                        <strong>Selected Lab: </strong> {labOptions.filter(opt => selectedLab.includes(opt.id)).map(opt => opt.name).join(', ')}
                      </div>
                    )
                  }
                  {
                    selectedInvTab === 'radiology' && selectedRadiology.length > 0 && (
                      <div className="mt-2 text-xs text-blue-700" >
                        <strong>Selected Radiology: </strong> {radiologyOptions.filter(opt => selectedRadiology.includes(opt.id)).map(opt => opt.name).join(', ')}
                      </div>
                    )
                  }
                </div>
                {/* Investigation Tabs */}
                <div className="flex gap-2 mt-4 flex-wrap" >
                  {
                    ['All', 'Radiology', 'Lab', 'Other'].map(tab => (
                      <button
                        key={tab}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${selectedInvTab === tab.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:shadow-sm'
                          }`}
                        style={{ minWidth: 48, minHeight: 28, lineHeight: '1.2' }}
                        onClick={() => setSelectedInvTab(tab.toLowerCase())}
                      >
                        {tab}
                      </button>
                    ))}
                </div>
              </CardHeader>
              < CardContent className="bg-white/60 px-6 py-5" >
                {/* Day Tabs (D1-D30) for all except 'all' tab */}
                {
                  selectedInvTab !== 'all' && (
                    <div className="flex gap-1 mb-6 flex-wrap" >
                      {
                        Array.from({ length: 30 }, (_, i) => `D${i + 1}`).map(day => (
                          <button
                            key={day}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${selectedInvDay === day
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:shadow-sm'
                              }`}
                            style={{ minWidth: 28, minHeight: 24, lineHeight: '1.1' }
                            }
                            onClick={() => setSelectedInvDay(day)}
                          >
                            {day}
                          </button>
                        ))}
                    </div>
                  )}
                {
                  selectedInvTab === 'all' && (
                    <InvestigationsList
                      complicationIds={[basicComplicationId]}
                    />
                  )
                }
                {
                  selectedInvTab === 'radiology' && (
                    <div className="mb-4" >
                      <Input
                        placeholder="Search radiology investigations..."
                        value={radiologySearch}
                        onChange={e => setRadiologySearch(e.target.value)}
                        className="mb-2"
                      />
                      {/* Show selected investigations and Store button */}
                      < div className="border rounded p-2 max-h-40 overflow-y-auto bg-white" >
                        {
                          radiologyOptions
                            .filter(opt => opt.name.toLowerCase().includes(radiologySearch.toLowerCase()))
                            .map(opt => (
                              <div key={opt.id} className="flex items-center" >
                                <input
                                  type="checkbox"
                                  checked={selectedRadiology.includes(opt.id)}
                                  onChange={() => {
                                    setSelectedRadiology(sel =>
                                      sel.includes(opt.id)
                                        ? sel.filter(id => id !== opt.id)
                                        : [...sel, opt.id]
                                    );
                                  }
                                  }
                                  className="mr-2"
                                />
                                <span>{opt.name} </span>
                              </div>
                            ))}
                      </div>
                      < Button
                        className="mt-3"
                        onClick={async () => {
                          if (!selectedRadiology.length) {
                            alert('Please select at least one investigation.');
                            return;
                          }
                          // Only insert visit_id, unique_id, investigation_id, day
                          const toStore = selectedRadiology.map(radioId => ({
                            visit_id: visits[0]?.visit_id, // or current visit
                            unique_id: patient.unique_id,
                            investigation_id: radioId,
                            day: selectedInvDay,
                          }));
                          // Store in your DB (example: 'patient_radiology_investigations' table)
                          const { error } = await supabase
                            .from('patient_radiology_investigations')
                            .insert(toStore);
                          if (!error) {
                            alert('Radiology investigations stored!');
                            setSelectedRadiology([]);
                            fetchStoredRadiology(); // fetch after storing
                          } else {
                            alert('Error storing investigations');
                          }
                        }}
                      >
                        Store
                      </Button>
                      {/* Render fetched data below the Store button */}
                      <div className="mt-3" >
                        <strong>Stored Investigations for {selectedInvDay}: </strong>
                        {
                          fetchedRadiologyData.length > 0 ? (
                            <ul>
                              {
                                fetchedRadiologyData.map(item => (
                                  <li key={item.id} >
                                    {/* If investigation is array and has at least one item, show name, else show investigation_id */}
                                    {
                                      Array.isArray(item.investigation) && item.investigation.length > 0
                                        ? item.investigation[0].name
                                        : (item.investigation?.name || item.investigation_id)
                                    }
                                    < span className="text-xs text-gray-500 ml-2" >
                                      {new Date(item.created_at).toLocaleDateString('en-GB')} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                  </li>
                                ))
                              }
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-500" > No investigations stored for {selectedInvDay} </div>
                          )}
                      </div>
                    </div>
                  )}
                {
                  selectedInvTab === 'lab' && (
                    <div className="mb-4" >
                      <Input
                        placeholder="Search lab investigations..."
                        value={labSearch}
                        onChange={e => setLabSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="border rounded p-2 max-h-40 overflow-y-auto bg-white" >
                        {
                          labOptions
                            .filter(opt => opt.name.toLowerCase().includes(labSearch.toLowerCase()))
                            .map(opt => (
                              <div key={opt.id} className="flex items-center" >
                                <input
                                  type="checkbox"
                                  checked={selectedLab.includes(opt.id)}
                                  onChange={() => {
                                    setSelectedLab(sel =>
                                      sel.includes(opt.id)
                                        ? sel.filter(id => id !== opt.id)
                                        : [...sel, opt.id]
                                    );
                                  }
                                  }
                                  className="mr-2"
                                />
                                <span>{opt.name} </span>
                              </div>
                            ))}
                      </div>
                      < Button
                        className="mt-3"
                        onClick={async () => {
                          if (!selectedLab.length) {
                            alert('Please select at least one investigation.');
                            return;
                          }
                          const toStore = selectedLab.map(labId => ({
                            visit_id: visits[0]?.visit_id,
                            unique_id: patient.unique_id,
                            investigation_id: labId,
                            day: selectedInvDay,
                          }));
                          const { error } = await supabase
                            .from('patient_lab_investigations')
                            .insert(toStore);
                          if (!error) {
                            alert('Investigations stored!');
                            setSelectedLab([]);
                            fetchStoredLab(); // Store ke baad fresh fetch
                          } else {
                            alert('Error storing investigations');
                          }
                        }}
                      >
                        Store
                      </Button>
                      {/* Yahan fetchedLabData dikhayein */}
                      <div className="mt-3" >
                        <strong>Stored Lab Investigations for {selectedInvDay}: </strong>
                        {
                          fetchedLabData.length > 0 ? (
                            <ul>
                              {
                                fetchedLabData.map(item => (
                                  <li key={item.id} >
                                    {
                                      Array.isArray(item.investigation) && item.investigation.length > 0
                                        ? item.investigation[0].name
                                        : (item.investigation?.name || item.investigation_id)
                                    }
                                    < span className="text-xs text-gray-500 ml-2" >
                                      {new Date(item.created_at).toLocaleDateString('en-GB')} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                  </li>
                                ))
                              }
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-500" > No investigations stored for {selectedInvDay} </div>
                          )}
                      </div>
                    </div>
                  )}
                {
                  selectedInvTab === 'other' && (
                    <InvestigationsList
                      complicationIds={[basicComplicationId]}
                      type="other"
                      day={selectedInvDay}
                    />
                  )
                }
              </CardContent>
            </Card>
            {/* Medications Section with Day Tabs */}
            <Card className="shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl border border-blue-100/40 overflow-hidden" >
              <CardHeader className="pb-4 px-6 pt-6 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-b border-blue-100/30" >
                <div className="flex items-center justify-between" >
                  <div>
                    <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight" > Medications </CardTitle>
                    < CardDescription className="text-blue-600/70 text-sm mt-1 leading-relaxed" > To be given </CardDescription>
                  </div>
                  {/* Day Tabs */}
                  <div className="flex gap-1 mb-4 flex-wrap" >
                    {
                      Array.from({ length: 30 }, (_, i) => `D${i + 1}`).map(day => (
                        <button
                          key={day}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${selectedMedDay === day
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:shadow-sm'
                            }`}
                          style={{ minWidth: 28, minHeight: 24, lineHeight: '1.1' }}
                          onClick={() => setSelectedMedDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                  </div>
                </div>
              </CardHeader>
              < CardContent className="bg-white/60 px-6 py-5" >

                <MedicationsList
                  complicationIds={[basicComplicationId]}
                  day={selectedMedDay}
                  patientId={patient.unique_id}
                  visitId={patient.latestVisit?.visit_id || ""}
                />



              </CardContent>
            </Card>
            < div className="flex justify-end gap-2 pt-2" >
              <Button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md font-semibold px-3 py-1 text-xs min-w-[90px]"
              >
                Save Changes
              </Button>
              < Button
                variant="outline"
                onClick={handleGenerateInvoice}
                className="bg-white/90 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-blue-200/60 hover:border-blue-300 transition-all duration-300 hover:shadow-md rounded-md font-medium px-3 py-1 text-xs min-w-[80px]"
              >
                Discharge
              </Button>
              < Button
                variant="outline"
                onClick={handleGenerateCaseSheet}
                className="bg-white/90 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-blue-200/60 hover:border-blue-300 transition-all duration-300 hover:shadow-md rounded-md font-medium px-3 py-1 text-xs min-w-[120px]"
              >
                Discharge Summary
              </Button>
            </div>
            {/* Fetch and Add Prompt UI below buttons */}
            <div className="mt-6" >
              <div className="mb-4" >
                <Button onClick={handleFetchDetails} className="mb-2" > Fetch </Button>
                < textarea
                  className="w-full border rounded p-2 min-h-[80px] mb-4 bg-gray-50"
                  placeholder="Fetched patient details will appear here..."
                  value={fetchedDetails}
                  readOnly
                />
              </div>
              < div className="mb-4" >
                <label className="block font-semibold mb-1" > Add prompt </label>
                < select
                  className="border rounded px-3 py-2 w-full max-w-xs mb-2"
                  value={promptType}
                  onChange={e => setPromptType(e.target.value)}
                >
                  <option>Discharge summary </option>
                  < option > Dama </option>
                  < option > Death summary </option>
                  < option > Death certificate </option>
                  < option > Injury report </option>
                  < option > Diet instructions </option>
                  < option > Physiotherapy instructions </option>
                </select>
                < Button onClick={handleRunPrompt} className="mt-2" > Run Prompt </Button>
                {/* Rendered summary box for review and printing */}
                <div
                  id="printable-summary"
                  className="w-full border-2 border-gray-300 rounded-lg min-h-[200px] max-h-[400px] overflow-auto bg-white shadow-md p-4 my-4 prose prose-sm max-w-none"
                  style={{ background: '#f8fafc', marginBottom: 0 }}
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(
                      (generatedSummary || '')
                        .replace(/```html[\r\n]+/g, '')
                        .replace(/```[\r\n]+/g, '')
                        .replace(/```/g, '')
                        .replace(/^[ \t]+<table>/gm, '<table>')
                        .replace(/<\/table>[ \t]*$/gm, '</table>')
                    )
                  }}
                />
                < Button onClick={() => {
                  const printable = document.getElementById('printable-summary');
                  if (printable) {
                    const html = printable.innerHTML;
                    const printWindow = window.open('', '_blank', 'width=600,height=800');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html><head><title>Print Summary</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 32px; }
                          pre, table { white-space: pre-wrap; word-break: break-word; font-size: 1.1rem; }
                          .prose { max-width: none; }
                          strong { font-weight: bold; }
                          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                          th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                          th { background: #f0f0f0; }
                        </style>
                        </head><body>
                        <div class='prose prose-sm'>${html}</div>
                        <script>window.onload = function() { window.print(); }<\/script>
                        </body></html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }} className="mt-4" > Print </Button>
              </div>
            </div>
          </div>
          {/* Invoice Page to the right */}
          <div className="md:col-span-8 space-y-6" >
            <TreatmentDates
              conservativeStart={conservativeStart}
              conservativeEnd={conservativeEnd}
              surgicalStart={surgicalStart}
              surgicalEnd={surgicalEnd}
              conservativeStart2={conservativeStart2}
              conservativeEnd2={conservativeEnd2}
              onDateChange={handleDateChange}
            />
            <InvoicePage
              patientData={patient}
              diagnoses={
                patientDiagnoses.length > 0 ? patientDiagnoses.map(pd => {
                  // Handle the nested structure from DiagnosisManager
                  if (pd && typeof pd === 'object' && pd.diagnosis) {
                    return {
                      id: pd.diagnosis.id || '',
                      name: pd.diagnosis.name || '',
                      approved: pd.diagnosis.approved || false
                    };
                  }
                  // Handle direct diagnosis objects
                  if (pd && typeof pd === 'object' && pd.name) {
                    return {
                      id: pd.id || '',
                      name: pd.name || '',
                      approved: pd.approved || false
                    };
                  }
                  // Fallback for any other structure
                  return {
                    id: '',
                    name: String(pd),
                    approved: false
                  };
                }) : diagnoses
              }
              conservativeStart={conservativeStart}
              conservativeEnd={conservativeEnd}
              surgicalStart={surgicalStart}
              surgicalEnd={surgicalEnd}
              conservativeStart2={conservativeStart2}
              conservativeEnd2={conservativeEnd2}
              visits={visits}
              doctorOptions={doctorOptions}
            />
          </div>
        </div>

        {/* Visit History Section */}
        <div className="p-4 mt-6" >
          <Card>
            <CardHeader className="pb-3" >
              <div className="flex justify-between items-center" >
                <div>
                  <CardTitle className="text-base" > Visit History </CardTitle>
                  < CardDescription > Record of hospital visits </CardDescription>
                </div>
                {/* Removed Register New Visit button as requested */}
              </div>
            </CardHeader>
            < CardContent >
              <div className="rounded-md border" >
                <div className="relative overflow-auto max-h-[400px]" >
                  <table className="w-full caption-bottom text-sm" >
                    <thead className="bg-blue-50" >
                      <tr className="border-b transition-colors" >
                        <th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Visit ID </th>
                        < th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Date </th>
                        < th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Reason </th>
                        < th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Doctor </th>
                        < th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Department </th>
                        < th className="h-12 px-4 text-left align-middle font-medium text-blue-700" > Notes </th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        visits.map((visit, index) => (
                          <tr
                            key={visit.id}
                            className={index % 2 === 0
                              ? "bg-white hover:bg-blue-50/50 transition-colors"
                              : "bg-blue-50/20 hover:bg-blue-50/50 transition-colors"}
                          >
                            <td className="p-4 align-middle font-medium" > {visit.visit_id} </td>
                            < td className="p-4 align-middle" > {new Date(visit.visit_date).toLocaleDateString('en-GB')} </td>
                            < td className="p-4 align-middle" > {visit.visit_reason} </td>
                            < td className="p-4 align-middle" > {visit.appointment_with} </td>
                            < td className="p-4 align-middle" > {visit.visit_type} </td>
                            < td className="p-4 align-middle text-muted-foreground" > {Array.isArray(visit.diagnosis) ? visit.diagnosis.join(', ') : String(visit.diagnosis || '')} </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* All Dialogs (Visit Registration, Clinical Notes, etc.) */}
        <Dialog open={isVisitFormOpen} onOpenChange={setIsVisitFormOpen} >
          <DialogContent className="sm:max-w-[500px]" >
            <DialogHeader>
              <DialogTitle>Register New Visit </DialogTitle>
              <DialogDescription>
                Fill in the details for the new hospital visit.
              </DialogDescription>
            </DialogHeader>
            < form
              onSubmit={e => {
                e.preventDefault();
                handleSubmitVisit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1" > Reason for Visit < span className="text-red-500" >* </span></label >
                <Input
                  required
                  placeholder="Reason for visit"
                  value={newVisit.reason}
                  onChange={e => setNewVisit({ ...newVisit, reason: e.target.value })}
                />
              </div>
              < div >
                <label className="block text-sm font-medium mb-1" > Doctor < span className="text-red-500" >* </span></label >
                <Input
                  required
                  placeholder="Doctor's name"
                  value={newVisit.doctor}
                  onChange={e => setNewVisit({ ...newVisit, doctor: e.target.value })}
                />
              </div>
              < div >
                <label className="block text-sm font-medium mb-1" > Department < span className="text-red-500" >* </span></label >
                <Input
                  required
                  placeholder="Department"
                  value={newVisit.department}
                  onChange={e => setNewVisit({ ...newVisit, department: e.target.value })}
                />
              </div>
              < div >
                <label className="block text-sm font-medium mb-1" > Notes </label>
                < Textarea
                  placeholder="Any additional notes"
                  value={newVisit.notes}
                  onChange={e => setNewVisit({ ...newVisit, notes: e.target.value })}
                />
              </div>
              < DialogFooter className="mt-4" >
                <Button type="submit" > Save Visit </Button>
                < Button type="button" variant="outline" onClick={() => setIsVisitFormOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Surgery Selection Dialog */}
        <Dialog open={showSurgerySelectionDialog} onOpenChange={setShowSurgerySelectionDialog} >
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" >
            <DialogHeader>
              <DialogTitle>Add New Surgery </DialogTitle>
              <DialogDescription>
                Enter details for a new surgery to add to the patient's record.
              </DialogDescription>
            </DialogHeader>

            < div className="relative mb-4" >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" >
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              < Input
                placeholder="Search by surgery name, CGHS code, or category..."
                value={surgerySearchTerm}
                onChange={(e) => {
                  setSurgerySearchTerm(e.target.value)
                  setIsSurgerySearchResultsVisible(true)
                }}
                onFocus={() => setIsSurgerySearchResultsVisible(true)}
                className="pl-11 py-3 border-blue-200/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 bg-white/85 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 focus:shadow-md text-sm"
              />
            </div>

            < div className="mt-2 border rounded-md overflow-y-auto" style={{ maxHeight: "400px" }}>
              {
                filteredSurgeries.length > 0 ? (
                  <div className="divide-y" >
                    {
                      filteredSurgeries.map((surgery) => (
                        <div
                          key={surgery.id}
                          className="flex items-center p-4 hover:bg-blue-50/50 cursor-pointer transition-colors"
                          onClick={() => toggleSurgerySelection(surgery.id.toString())}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={temporarySelectedSurgeries.includes(surgery.id.toString())}
                              onChange={() => toggleSurgerySelection(surgery.id.toString())
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          < div className="flex-grow ml-3" >
                            <p className="font-medium" > {surgery.name} </p>
                            < div className="flex items-center gap-2 mt-1" >
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700" >
                                CGHS: {surgery.cghs_code}
                              </Badge>
                              < Badge variant="outline" className="bg-green-50 border-green-200 text-green-700" >
                                {surgery.category}
                              </Badge>
                            </div>
                          </div>
                          < div className="text-right" >
                            <p className="text-lg font-semibold text-blue-700" >₹{surgery.amount.toLocaleString()} </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm" >
                    No surgeries found.Try a different search term.
                  </div>
                )}
            </div>

            < div className="mt-4 flex justify-between items-center" >
              <p className="text-sm text-muted-foreground" >
                {temporarySelectedSurgeries.length} surgery / surgeries selected
              </p>
            </div>

            < DialogFooter className="mt-6" >
              <Button variant="outline" onClick={() => setShowSurgerySelectionDialog(false)}>
                Cancel
              </Button>
              < Button
                onClick={() => {
                  if (temporarySelectedSurgeries.length > 0) {
                    setShowSurgerySelectionDialog(false);
                    setShowSurgeryDetailForm(true);
                  } else {
                    toast({
                      title: "No surgeries selected",
                      description: "Please select at least one surgery to continue.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={temporarySelectedSurgeries.length === 0}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Surgery Details Form Dialog */}
        <Dialog open={showSurgeryDetailForm} onOpenChange={setShowSurgeryDetailForm} >
          <DialogContent className="sm:max-w-[600px]" >
            <DialogHeader>
              <DialogTitle>Add details for {temporarySelectedSurgeries.length} selected surgery / surgeries </DialogTitle>
              <DialogDescription>
                {
                  temporarySelectedSurgeries.map((surgeryId) => {
                    const surgery = surgeryDatabase.find(s => s.id.toString() === surgeryId);
                    return surgery ? surgery.name : "";
                  }).join(", ")
                }
              </DialogDescription>
            </DialogHeader>

            < form
              onSubmit={(e) => {
                e.preventDefault();
                // Add all selected surgeries with the same details
                temporarySelectedSurgeries.forEach(surgeryId => {
                  if (!selectedSurgeries.includes(surgeryId)) {
                    setSelectedSurgeries(prev => [...prev, surgeryId]);
                  }
                });
                setShowSurgeryDetailForm(false);
                setHasUnsavedChanges(true);
                toast({
                  title: "Surgeries added",
                  description: `Added ${temporarySelectedSurgeries.length} surgeries to the patient's record.`
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4" >
                <div>
                  <label className="block text-sm font-medium mb-1" > Surgery Date < span className="text-red-500" >* </span></label >
                  <Input
                    type="date"
                    required
                    value={surgeryDetails.surgeryDate}
                    onChange={(e) => setSurgeryDetails({ ...surgeryDetails, surgeryDate: e.target.value })}
                  />
                </div>
                < div >
                  <label className="block text-sm font-medium mb-1" > Surgery Time < span className="text-red-500" >* </span></label >
                  <Input
                    type="time"
                    required
                    value={surgeryDetails.surgeryTime}
                    onChange={(e) => setSurgeryDetails({ ...surgeryDetails, surgeryTime: e.target.value })}
                  />
                </div>
              </div>

              < div >
                <label className="block text-sm font-medium mb-1" > Surgeon < span className="text-red-500" >* </span></label >
                <Select
                  onValueChange={(value) => setSurgeryDetails({ ...surgeryDetails, surgeonName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select surgeon" />
                  </SelectTrigger>
                  < SelectContent >
                    <SelectItem value="Dr. A. Kumar" > Dr.A.Kumar </SelectItem>
                    < SelectItem value="Dr. S. Mehta" > Dr.S.Mehta </SelectItem>
                    < SelectItem value="Dr. R. Singh" > Dr.R.Singh </SelectItem>
                    < SelectItem value="Dr. P. Gupta" > Dr.P.Gupta </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              < div >
                <label className="block text-sm font-medium mb-1" > Anesthetist </label>
                < Select
                  onValueChange={(value) => setSurgeryDetails({ ...surgeryDetails, anesthetistName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select anesthetist" />
                  </SelectTrigger>
                  < SelectContent >
                    <SelectItem value="Dr. M. Verma" > Dr.M.Verma </SelectItem>
                    < SelectItem value="Dr. S. Agarwal" > Dr.S.Agarwal </SelectItem>
                    < SelectItem value="Dr. K. Das" > Dr.K.Das </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              < div >
                <label className="block text-sm font-medium mb-1" > Anesthesia Type </label>
                < Select
                  onValueChange={(value) => setSurgeryDetails({ ...surgeryDetails, anesthesiaType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select anesthesia type" />
                  </SelectTrigger>
                  < SelectContent >
                    <SelectItem value="General Anesthesia" > General Anesthesia </SelectItem>
                    < SelectItem value="Spinal Anesthesia" > Spinal Anesthesia </SelectItem>
                    < SelectItem value="Local Anesthesia" > Local Anesthesia </SelectItem>
                    < SelectItem value="Regional Anesthesia" > Regional Anesthesia </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              < div >
                <label className="block text-sm font-medium mb-1" > OT Notes </label>
                < Textarea
                  placeholder="Enter operation theater notes..."
                  value={surgeryDetails.notes}
                  onChange={(e) => setSurgeryDetails({ ...surgeryDetails, notes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              < DialogFooter className="mt-6" >
                <Button type="button" variant="outline" onClick={() => {
                  setShowSurgeryDetailForm(false);
                  setShowSurgerySelectionDialog(true);
                }}>
                  Back
                </Button>
                < Button type="submit" >
                  Add Surgeries
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Complications mapped to CGHS surgery Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-blue-700 tracking-tight mb-1" >
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Complications mapped to CGHS surgery
            </CardTitle>
            <CardDescription>
              Monitor and manage potential complications related to selected surgeries
            </CardDescription>
          </CardHeader>
          < CardContent className="space-y-4" >
            <Input
              placeholder="Search complications mapped to CGHS surgery..."
              value={cghsComplicationSearch}
              onChange={e => setCghsComplicationSearch(e.target.value)}
              className="mb-2"
            />
            <div className="p-3 border rounded mb-3 bg-white" >
              <div>
                <strong>{complicationsString} </strong>
              </div>
              {/* Investigations and Medications sections remain unchanged below */}
              {/* ... existing code for investigations and medications ... */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
