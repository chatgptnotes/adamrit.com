import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Edit, Users, Calendar, Clock, FileText, Building2, Shield, AlertTriangle, Filter } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { DischargeWorkflowPanel } from '@/components/discharge/DischargeWorkflowPanel';
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  admission_date: string | null;
  discharge_date: string | null;
  surgery_date: string | null;
  sr_no: string | null;
  bunch_no: string | null;
  status: string;
  sst_treatment: string | null;
  intimation_done: string | null;
  cghs_code: string | null;
  package_amount: number | null;
  billing_executive: string | null;
  extension_taken: string | null;
  delay_waiver_intimation: string | null;
  surgical_approval: string | null;
  remark1: string | null;
  remark2: string | null;
  created_at: string;
  visit_type: string;
  billing_status: string | null;
  file_status: string | null;
  condonation_delay_submission: string | null;
  condonation_delay_intimation: string | null;
  extension_of_stay: string | null;
  additional_approvals: string | null;
  patients: {
    id: string;
    name: string;
    age: number;
    gender: string;
    patients_id: string;
    insurance_person_no: string | null;
  };
  visit_diagnoses: Array<{
    diagnoses: {
      name: string;
    };
  }>;
  visit_hope_surgeons: Array<{
    hope_surgeons: {
      name: string;
    };
  }>;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString('en-GB');
  } catch {
    return "-";
  }
};

const formatTime = (dateString?: string): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
};

const getDaysAdmitted = (admissionDate?: string): string => {
  if (!admissionDate) return "-";
  try {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch {
    return "-";
  }
};

// Input component for billing executive
const BillingExecutiveInput = ({ visit }: { visit: Visit }) => {
  const [value, setValue] = useState(visit.billing_executive || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from('visits')
        .update({ billing_executive: newValue })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Billing executive updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update billing executive",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleBlur = () => {
    if (value !== (visit.billing_executive || '')) {
      setIsUpdating(true);
      updateMutation.mutate(value);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        className="min-w-[150px]"
        placeholder="Enter billing executive"
        disabled={isUpdating}
      />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

// Dropdown component for billing status - now using shared cascading dropdown
const BillingStatusDropdown = ({ visit }: { visit: Visit }) => {
  return (
    <CascadingBillingStatusDropdown
      visit={visit}
      queryKey={['currently-admitted-visits']}
    />
  );
};

// Generic 3-state toggle component

// Generic 3-state toggle component
const ThreeStateToggle = ({
  visit,
  field,
  onUpdate
}: {
  visit: Visit;
  field: keyof Visit;
  onUpdate: (visitId: string, field: string, value: string) => void;
}) => {
  const value = visit[field] as string;

  const getNextState = (current: string | null) => {
    switch (current) {
      case 'taken': return 'not_taken';
      case 'not_taken': return 'not_required';
      case 'not_required': return 'taken';
      default: return 'taken';
    }
  };

  const getStateDisplay = (state: string | null) => {
    switch (state) {
      case 'taken': return { text: 'Taken', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'not_taken': return { text: 'Not Taken', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'not_required': return { text: 'Not Required', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
      default: return { text: 'Not Set', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const handleClick = () => {
    const nextState = getNextState(value);
    onUpdate(visit.id, field as string, nextState);
  };

  const display = getStateDisplay(value);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`px-3 py-1 rounded-full text-xs font-medium ${display.className}`}
    >
      {display.text}
    </Button>
  );
};

// Reusable multi-select column filter using DropdownMenu
const ColumnFilter = ({
  options,
  selected,
  onChange,
  buttonLabel = 'Filter'
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  buttonLabel?: string;
}) => {
  const toggleValue = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2">
          <Filter className="h-3 w-3 mr-1" />
          {selected.length ? `${selected.length} selected` : 'All'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onChange([])}>Clear</DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt}
            checked={selected.includes(opt)}
            onCheckedChange={() => onChange(toggleValue(selected, opt))}
          >
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


// Specific toggle components
const ReferralLetterToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      console.log('🔄 Updating referral letter:', { visitId, field, value });
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }
      console.log('✅ Database update successful');
    },
    onSuccess: () => {
      console.log('✅ Referral letter update successful');
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Referral letter status updated successfully",
      });
    },
    onError: (error) => {
      console.error('❌ Referral letter update failed:', error);
      console.error('❌ Error details:', error.message);
      toast({
        title: "Error",
        description: `Failed to update referral letter status: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    console.log('🔄 handleUpdate called with:', { visitId, field, value });
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  const getNextReferralState = (current: string | null) => {
    console.log('🔄 Current status:', current, 'Type:', typeof current);
    switch (current) {
      case 'available': return 'missing';
      case 'missing': return 'not_required';
      case 'not_required': return 'available';
      case null:
      case undefined:
      case '':
      default: 
        console.log('🔄 Default case - setting to available');
        return 'available';
    }
  };

  const getReferralStateDisplay = (state: string | null) => {
    switch (state) {
      case 'available': return { text: 'Sanctioned', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'missing': return { text: 'Not Sanction', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'not_required': return { text: 'Initiated Sanction', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' };
      default: return { text: 'Not Set', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const handleReferralClick = () => {
    console.log('🔄 Referral Letter button clicked!');
    console.log('🔄 Current visit.file_status:', visit.file_status);
    console.log('🔄 Visit ID:', visit.id);
    
    const nextState = getNextReferralState(visit.file_status);
    console.log('🔄 Next state will be:', nextState);
    console.log('🔄 Expected display:', getReferralStateDisplay(nextState));
    
    handleUpdate(visit.id, 'file_status', nextState);
  };

  const display = getReferralStateDisplay(visit.file_status);

  return (
    <div className="relative">
      <Select
        value={visit.file_status || 'available'}
        onValueChange={(value) => {
          console.log('🔄 Dropdown value changed:', value);
          console.log('🔄 Visit ID:', visit.id);
          console.log('🔄 Field: file_status');
          console.log('🔄 New value:', value);
          handleUpdate(visit.id, 'file_status', value);
        }}
        disabled={isUpdating}
      >
        <SelectTrigger className={`w-32 h-8 text-xs ${isUpdating ? 'opacity-50' : ''}`}>
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="available">Sanctioned</SelectItem>
          <SelectItem value="missing">Not Sanction</SelectItem>
          <SelectItem value="pending">Initiated Sanction</SelectItem>
        </SelectContent>
      </Select>
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CondonationDelayToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Condonation delay submission status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update condonation delay submission status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  const getNextCondonationState = (current: string | null) => {
    switch (current) {
      case 'taken': return 'not_taken';
      case 'not_taken': return 'not_required';
      case 'not_required': return 'taken';
      default: return 'taken';
    }
  };

  const getCondonationStateDisplay = (state: string | null) => {
    switch (state) {
      case 'taken': return { text: 'Submitted', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'not_taken': return { text: 'Not Submitted', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'not_required': return { text: 'Not Required', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
      default: return { text: 'Not Set', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const handleCondonationClick = () => {
    const nextState = getNextCondonationState(visit.condonation_delay_submission);
    handleUpdate(visit.id, 'condonation_delay_submission', nextState);
  };

  const display = getCondonationStateDisplay(visit.condonation_delay_submission);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCondonationClick}
        className={`px-3 py-1 rounded-full text-xs font-medium ${display.className}`}
      >
        {display.text}
      </Button>
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CondonationDelayIntimationToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Condonation delay intimation status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update condonation delay intimation status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  const getNextIntimationState = (current: string | null) => {
    switch (current) {
      case 'taken': return 'not_taken';
      case 'not_taken': return 'not_required';
      case 'not_required': return 'taken';
      default: return 'taken';
    }
  };

  const getIntimationStateDisplay = (state: string | null) => {
    switch (state) {
      case 'taken': return { text: 'Intimated', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'not_taken': return { text: 'Not Intimated', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'not_required': return { text: 'Not Required', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
      default: return { text: 'Not Set', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const handleIntimationClick = () => {
    const nextState = getNextIntimationState(visit.condonation_delay_intimation);
    handleUpdate(visit.id, 'condonation_delay_intimation', nextState);
  };

  const display = getIntimationStateDisplay(visit.condonation_delay_intimation);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleIntimationClick}
        className={`px-3 py-1 rounded-full text-xs font-medium ${display.className}`}
      >
        {display.text}
      </Button>
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const ExtensionOfStayToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Extension of stay updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update extension of stay",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="extension_of_stay" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const AdditionalApprovalsToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);


      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Additional approvals updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update additional approvals",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="additional_approvals" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CurrentlyAdmittedPatients = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVisitForDischarge, setSelectedVisitForDischarge] = useState<Visit | null>(null);
  


  // Column filters state (multi-select)
  const [referralLetterFilter, setReferralLetterFilter] = useState<string[]>([]);
  const [condonationSubmissionFilter, setCondonationSubmissionFilter] = useState<string[]>([]);
  const [condonationIntimationFilter, setCondonationIntimationFilter] = useState<string[]>([]);
  const [extensionOfStayFilter, setExtensionOfStayFilter] = useState<string[]>([]);
  const [additionalApprovalsFilter, setAdditionalApprovalsFilter] = useState<string[]>([]);



  const { data: visits = [], isLoading, error } = useQuery({
    queryKey: ['currently-admitted-visits', hospitalConfig?.name],
    queryFn: async () => {
      console.log('🏥 CurrentlyAdmittedPatients: Fetching visits for hospital:', hospitalConfig?.name);


      // First get all visits with admission but that are not fully discharged
      let query = supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            name,
            age,
            gender,
            patients_id,
            insurance_person_no,
            hospital_name
          ),
          visit_diagnoses(
            diagnoses(
              name
            )
          ),
          visit_hope_surgeons(
            hope_surgeons(
              name
            )
          )
        `)
        .not('admission_date', 'is', null) // Only get visits with admission date
        .order('admission_date', { ascending: false });
      
      // Apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        query = query.eq('patients.hospital_name', hospitalConfig.name);
        console.log('🏥 CurrentlyAdmittedPatients: Applied hospital filter for:', hospitalConfig.name);
      }
      
      const { data: visitsData, error } = await query;

      if (error) {
        console.error('Error fetching visits:', error);
        throw error;
      }

      console.log(`✅ CurrentlyAdmittedPatients: Found ${visitsData?.length || 0} visits for ${hospitalConfig?.name}`);
      
      if (!visitsData || visitsData.length === 0) {
        console.log('No visits found');
        return [];
      }

      // Get discharge checklists for all visits
      const visitIds = visitsData.map(visit => visit.id);
      const { data: checklists, error: checklistError } = await supabase
        .from('discharge_checklist')
        .select('*')
        .in('visit_id', visitIds);

      if (checklistError) {
        console.error('Error fetching discharge checklists:', checklistError);
        // Continue without checklists if there's an error
      }

      // Filter visits to show only truly undischarged patients
      const currentlyAdmittedVisits = visitsData.filter(visit => {
        // Only show patients who don't have a discharge date
        // This means they are still admitted and not discharged
        return !visit.discharge_date;
      });

      console.log('🔍 Total visits with admission date:', visitsData?.length);
      console.log('🔍 Undischarged patients (no discharge_date):', currentlyAdmittedVisits?.length);
      console.log('🔍 Filter applied: discharge_date is null');
      return currentlyAdmittedVisits || [];
    },
  });

  // Compute unique option lists for filters from current data (no hooks)
  const getDistinct = (arr: (string | null)[]) => Array.from(new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0)));
  const referralLetterOptions = ['Sanctioned', 'Not Sanction', 'Initiated Sanction'];
  const condonationSubmissionOptions = ['Submitted', 'Not Submitted', 'Not Required'];
  const condonationIntimationOptions = ['Intimated', 'Not Intimated', 'Not Required'];
  const extensionOfStayOptions = getDistinct((visits || []).map((v: Visit) => v.extension_of_stay));
  const additionalApprovalsOptions = getDistinct((visits || []).map((v: Visit) => v.additional_approvals));

  const filteredVisits = (visits || []).filter((visit: Visit) => {
    const matchesSearch = !searchTerm ||
      visit.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patients?.patients_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visit_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visit.billing_status === statusFilter;

    const includeBy = (selected: string[], value?: string | null) =>
      selected.length === 0 || (value ? selected.includes(value) : false);

    // Map file_status to display text for filtering
    const getReferralLetterDisplay = (status: string | null) => {
      switch (status) {
        case 'available': return 'Sanctioned';
        case 'missing': return 'Not Sanction';
        case 'pending': return 'Initiated Sanction';
        default: return 'Not Set';
      }
    };
    
    const matchesReferralLetter = includeBy(referralLetterFilter, getReferralLetterDisplay(visit.file_status));
    
    // Map condonation submission status to display text for filtering
    const getCondonationSubmissionDisplay = (status: string | null) => {
      switch (status) {
        case 'taken': return 'Submitted';
        case 'not_taken': return 'Not Submitted';
        case 'not_required': return 'Not Required';
        default: return 'Not Set';
      }
    };
    
    // Map condonation intimation status to display text for filtering
    const getCondonationIntimationDisplay = (status: string | null) => {
      switch (status) {
        case 'taken': return 'Intimated';
        case 'not_taken': return 'Not Intimated';
        case 'not_required': return 'Not Required';
        default: return 'Not Set';
      }
    };
    
    const matchesCondSub = includeBy(condonationSubmissionFilter, getCondonationSubmissionDisplay(visit.condonation_delay_submission));
    const matchesCondInt = includeBy(condonationIntimationFilter, getCondonationIntimationDisplay(visit.condonation_delay_intimation));
    const matchesExtStay = includeBy(extensionOfStayFilter, visit.extension_of_stay);
    const matchesAddAppr = includeBy(additionalApprovalsFilter, visit.additional_approvals);

    return matchesSearch && matchesStatus && matchesReferralLetter && matchesCondSub && matchesCondInt && matchesExtStay && matchesAddAppr;
  });

  const stats = (() => {
    const total = filteredVisits.length;
    const pending = filteredVisits.filter(v => v.billing_status === 'pending').length;
    const completed = filteredVisits.filter(v => v.billing_status === 'completed').length;
    const avgStay = filteredVisits.reduce((acc, visit) => {
      if (visit.admission_date) {
        const days = Math.ceil((Date.now() - new Date(visit.admission_date).getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }
      return acc;
    }, 0) / (total || 1);

    return { total, pending, completed, avgStay: Math.round(avgStay) };
  })();

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading currently admitted patients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Currently Admitted Patients</h1>
          <p className="text-gray-600 mt-1">Patients currently in the hospital (undischarged only)</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            onClick={() => navigate('/advance-statement-report')}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <FileText className="h-4 w-4" />
            <span>Advance Statement Report</span>
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admitted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Undischarged patients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Billing</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Billing incomplete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Ready for discharge
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgStay}</div>
            <p className="text-xs text-muted-foreground">
              Days in hospital
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name, ID, or visit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>


            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading currently admitted patients...</span>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center p-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No undischarged patients</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No patients match your current filters.'
                  : 'There are no undischarged patients in the hospital.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Visit ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Discharge Workflow</TableHead>
                    <TableHead className="font-semibold">Bill</TableHead>
                    <TableHead className="font-semibold">Billing Executive</TableHead>
                    <TableHead className="font-semibold">Billing Status</TableHead>
                    <TableHead className="font-semibold">Referral Letter</TableHead>
                    <TableHead className="font-semibold">Condonation Delay -submission</TableHead>
                    <TableHead className="font-semibold">Condonation Delay -intimation</TableHead>
                    <TableHead className="font-semibold">Extension of Stay</TableHead>
                    <TableHead className="font-semibold">Additional Approvals</TableHead>
                    <TableHead className="font-semibold">Admission Date</TableHead>
                    <TableHead className="font-semibold">Days Admitted</TableHead>
                    <TableHead className="font-semibold">Discharge Date</TableHead>
                    <TableHead className="font-semibold">Visit Type</TableHead>
                    <TableHead className="font-semibold">Doctor</TableHead>
                    <TableHead className="font-semibold">Diagnosis</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead>
                      <ColumnFilter options={referralLetterOptions} selected={referralLetterFilter} onChange={setReferralLetterFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter options={condonationSubmissionOptions} selected={condonationSubmissionFilter} onChange={setCondonationSubmissionFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter options={condonationIntimationOptions} selected={condonationIntimationFilter} onChange={setCondonationIntimationFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter options={extensionOfStayOptions} selected={extensionOfStayFilter} onChange={setExtensionOfStayFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter options={additionalApprovalsOptions} selected={additionalApprovalsFilter} onChange={setAdditionalApprovalsFilter} />
                    </TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">{visit.visit_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{visit.patients?.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {visit.patients?.patients_id} | {visit.patients?.age}yrs | {visit.patients?.gender}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setSelectedVisitForDischarge(visit)}
                        >
                          <Shield className="h-4 w-4" />
                          {visit.discharge_date ? 'Manage Discharge' : 'Start Discharge'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/final-bill/${visit.visit_id}`)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Bill
                        </Button>
                      </TableCell>
                      <TableCell>
                        <BillingExecutiveInput visit={visit} />
                      </TableCell>
                      <TableCell>
                        <BillingStatusDropdown visit={visit} />
                      </TableCell>
                      <TableCell>
                        <ReferralLetterToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <CondonationDelayToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <CondonationDelayIntimationToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <ExtensionOfStayToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <AdditionalApprovalsToggle visit={visit} />
                      </TableCell>
                      <TableCell>{formatDate(visit.admission_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {getDaysAdmitted(visit.admission_date)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(visit.discharge_date || undefined)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {visit.visit_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {visit.visit_hope_surgeons?.map(vs => vs.hope_surgeons?.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {visit.visit_diagnoses?.map(vd => vd.diagnoses?.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {formatTime(visit.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/patient-profile?patientId=${visit.patients?.id}&visitId=${visit.visit_id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            View Patient
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discharge Workflow Modal */}
      <Dialog
        open={!!selectedVisitForDischarge}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVisitForDischarge(null);
          }
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent modal from closing when clicking outside
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent modal from closing on Escape key
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Discharge Workflow Management</DialogTitle>
          </DialogHeader>
          {selectedVisitForDischarge && (
            <DischargeWorkflowPanel
              visit={selectedVisitForDischarge}
              onClose={() => setSelectedVisitForDischarge(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrentlyAdmittedPatients;