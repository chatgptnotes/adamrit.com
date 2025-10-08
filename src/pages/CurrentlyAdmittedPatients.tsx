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
import { Loader2, Search, Users, Calendar, Clock, FileText, Building2, Shield } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { DischargeWorkflowPanel } from '@/components/discharge/DischargeWorkflowPanel';

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
  ward_allotted: string | null;
  room_allotted: string | null;
  room_management?: {
    ward_type: string;
  } | null;
  patients: {
    id: string;
    name: string;
    age: number;
    gender: string;
    patients_id: string;
    insurance_person_no: string | null;
    corporate: string | null;
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


const CurrentlyAdmittedPatients = () => {
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVisitForDischarge, setSelectedVisitForDischarge] = useState<Visit | null>(null);



  const { data: visits = [], isLoading, error } = useQuery({
    queryKey: ['currently-admitted-visits', hospitalConfig?.name],
    queryFn: async () => {
      console.log('🏥 CurrentlyAdmittedPatients: Fetching visits for hospital:', hospitalConfig?.name);


      // Get all IPD patients who are not discharged yet
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
            hospital_name,
            corporate
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
        .eq('patient_type', 'IPD') // Only get IPD patients
        .is('discharge_date', null) // Only get patients who are not discharged
        .order('visit_date', { ascending: false });
      
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

      // Fetch room_management data for ward types
      const wardIds = visitsData
        .map(visit => visit.ward_allotted)
        .filter((id): id is string => id !== null && id !== undefined);

      const uniqueWardIds = Array.from(new Set(wardIds));

      let wardMapping: Record<string, string> = {};

      if (uniqueWardIds.length > 0) {
        const { data: wardData, error: wardError } = await supabase
          .from('room_management')
          .select('ward_id, ward_type')
          .in('ward_id', uniqueWardIds);

        if (wardError) {
          console.error('Error fetching ward data:', wardError);
        } else if (wardData) {
          // Create a mapping of ward_id to ward_type
          wardMapping = wardData.reduce((acc, ward) => {
            acc[ward.ward_id] = ward.ward_type;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Merge ward data with visits
      const visitsWithRoomInfo = visitsData.map(visit => ({
        ...visit,
        room_management: visit.ward_allotted && wardMapping[visit.ward_allotted]
          ? { ward_type: wardMapping[visit.ward_allotted] }
          : null
      }));

      console.log('🔍 Total IPD visits (not discharged):', visitsWithRoomInfo?.length);
      console.log('🔍 Filter applied: patient_type=IPD AND discharge_date IS NULL');
      return visitsWithRoomInfo || [];
    },
  });


  const filteredVisits = (visits || []).filter((visit: Visit) => {
    const matchesSearch = !searchTerm ||
      visit.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patients?.patients_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visit_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visit.billing_status === statusFilter;

    return matchesSearch && matchesStatus;
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
                    <TableHead className="font-semibold">RM/BED</TableHead>
                    <TableHead className="font-semibold">Visit ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Corporate</TableHead>
                    <TableHead className="font-semibold">Discharge Workflow</TableHead>
                    <TableHead className="font-semibold">Bill</TableHead>
                    <TableHead className="font-semibold">Admission Date</TableHead>
                    <TableHead className="font-semibold">Days Admitted</TableHead>
                    <TableHead className="font-semibold">Visit Type</TableHead>
                    <TableHead className="font-semibold">Doctor</TableHead>
                    <TableHead className="font-semibold">Diagnosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.room_management?.ward_type && visit.room_allotted ? (
                          <div className="text-sm">
                            <div className="font-semibold text-blue-700">{visit.room_management.ward_type}</div>
                            <div className="text-gray-600">Room {visit.room_allotted}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
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
                        <span className="text-indigo-600 font-medium">
                          {visit.patients?.corporate || '-'}
                        </span>
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
                      <TableCell>{formatDate(visit.admission_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {getDaysAdmitted(visit.admission_date)}
                        </Badge>
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