// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Phone, Plus, Search, UserPlus, Stethoscope,
  Users, Edit, Trash2, PhoneCall, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Pencil, IndianRupee, Building2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useCorporateBulkPayments, useDeleteCorporateBulkPayment } from '@/hooks/useCorporateBulkPayments';
import BulkPaymentReceiptForm from '@/components/corporate-bulk-payment/BulkPaymentReceiptForm';
import { CorporateBulkPayment } from '@/types/corporateBulkPayment';
import { toast as sonnerToast } from 'sonner';

interface MasterPerson {
  id: string;
  person_type: 'referring_doctor' | 'relationship_manager' | 'both';
  full_name: string;
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  specialization?: string;
  hospital?: string;
  designation?: string;
  department?: string;
  address?: string;
  city?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  person_type: 'referring_doctor',
  full_name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  specialization: '',
  hospital: '',
  designation: '',
  department: '',
  city: '',
  notes: '',
  is_active: true,
};

export default function MasterDataPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<MasterPerson | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callStatuses, setCallStatuses] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['master_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_data')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch call logs
  const { data: callLogs = [] } = useQuery({
    queryKey: ['call_logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('call_logs')
        .select('*')
        .order('initiated_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (d: any) => {
      const { error } = await supabase.from('master_data').insert([d]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master_data'] }); setIsAddOpen(false); setForm(EMPTY_FORM); toast({ title: 'Person added' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...d }: any) => {
      const { error } = await supabase.from('master_data').update(d).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master_data'] }); setIsEditOpen(false); toast({ title: 'Updated' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('master_data').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master_data'] }); toast({ title: 'Deleted' }); },
  });

  // CALL function
  const handleCall = async (person: MasterPerson) => {
    const mobile = person.mobile || person.alternate_mobile;
    if (!mobile) { toast({ title: 'No mobile number', variant: 'destructive' }); return; }
    setCallingId(person.id);
    setCallStatuses(p => ({ ...p, [person.id]: 'calling' }));
    try {
      const res = await fetch('/api/twilio-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: mobile, person_id: person.id, person_name: person.full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCallStatuses(p => ({ ...p, [person.id]: 'queued' }));
      toast({ title: `Call initiated to ${person.full_name}`, description: `Calling ${mobile}` });
      qc.invalidateQueries({ queryKey: ['call_logs'] });
    } catch (e: any) {
      setCallStatuses(p => ({ ...p, [person.id]: 'failed' }));
      toast({ title: 'Call failed', description: e.message, variant: 'destructive' });
    } finally {
      setCallingId(null);
    }
  };

  const filtered = persons.filter(p => {
    const matchTab = tab === 'all' || p.person_type === tab || (tab === 'both' && p.person_type === 'both');
    const matchSearch = !search || p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile?.includes(search) || p.hospital?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch && p.is_active;
  });

  const callStatusIcon = (id: string) => {
    const s = callStatuses[id];
    if (s === 'calling') return <span className="animate-spin text-blue-500">⟳</span>;
    if (s === 'queued') return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (s === 'failed') return <XCircle className="h-3 w-3 text-red-500" />;
    return null;
  };

  const FormFields = ({ f, setF }: any) => (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-600">Type *</label>
        <Select value={f.person_type} onValueChange={v => setF((p: any) => ({ ...p, person_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="referring_doctor">Referring Doctor</SelectItem>
            <SelectItem value="relationship_manager">Relationship Manager</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {[
        ['full_name', 'Full Name *', 'col-span-2'],
        ['mobile', 'Mobile', ''],
        ['alternate_mobile', 'Alternate Mobile', ''],
        ['email', 'Email', 'col-span-2'],
        ['specialization', 'Specialization', ''],
        ['hospital', 'Hospital / Clinic', ''],
        ['designation', 'Designation', ''],
        ['department', 'Department', ''],
        ['city', 'City', ''],
        ['notes', 'Notes', 'col-span-2'],
      ].map(([key, label, cls]) => (
        <div key={key} className={cls || ''}>
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <Input value={f[key] || ''} onChange={e => setF((p: any) => ({ ...p, [key]: e.target.value }))} placeholder={label} />
        </div>
      ))}
    </div>
  );

  const typeColor: Record<string, string> = {
    referring_doctor: 'bg-blue-100 text-blue-700',
    relationship_manager: 'bg-purple-100 text-purple-700',
    both: 'bg-green-100 text-green-700',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />Master Data</h1>
          <p className="text-sm text-gray-500 mt-1">Referring Doctors and Relationship Managers — with Twilio call integration</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setIsAddOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Person
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({persons.length})</TabsTrigger>
          <TabsTrigger value="referring_doctor">Doctors ({persons.filter(p => p.person_type === 'referring_doctor' || p.person_type === 'both').length})</TabsTrigger>
          <TabsTrigger value="relationship_manager">Rel. Managers ({persons.filter(p => p.person_type === 'relationship_manager' || p.person_type === 'both').length})</TabsTrigger>
          <TabsTrigger value="call_logs">Call Logs ({callLogs.length})</TabsTrigger>
          <TabsTrigger value="corporate_receipts">Corporate Receipts</TabsTrigger>
        </TabsList>

        <div className="my-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search name, mobile, hospital..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <TabsContent value="all"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="referring_doctor"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="relationship_manager"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="call_logs">
          <CallLogsTable logs={callLogs} />
        </TabsContent>
        <TabsContent value="corporate_receipts">
          <CorporateReceiptsTable />
        </TabsContent>
      </Tabs>

      {/* ── PERSON CARDS ── */}
      {tab !== 'call_logs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {isLoading && <p className="text-gray-400 col-span-3">Loading...</p>}
          {filtered.length === 0 && !isLoading && (
            <p className="text-gray-400 col-span-3 text-center py-12">No records found. Add a person to get started.</p>
          )}
          {filtered.map(person => (
            <Card key={person.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{person.full_name}</CardTitle>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${typeColor[person.person_type]}`}>
                      {person.person_type === 'referring_doctor' ? 'Referring Doctor' : person.person_type === 'relationship_manager' ? 'Rel. Manager' : 'Both'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelected(person); setForm({ ...person }); setIsEditOpen(true); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => deleteMutation.mutate(person.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {person.specialization && <p className="text-sm text-gray-600 flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-blue-400" />{person.specialization}</p>}
                {person.hospital && <p className="text-sm text-gray-600 flex items-center gap-1.5"><span className="text-gray-400">🏥</span>{person.hospital}</p>}
                {person.city && <p className="text-xs text-gray-400">{person.city}</p>}
                {person.mobile && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm font-mono text-gray-700">{person.mobile}</span>
                    {callStatusIcon(person.id)}
                  </div>
                )}
                <Button
                  className="w-full mt-2 gap-2"
                  size="sm"
                  disabled={callingId === person.id || !person.mobile}
                  onClick={() => handleCall(person)}
                  variant={callStatuses[person.id] === 'queued' ? 'outline' : 'default'}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {callingId === person.id ? 'Calling...' : callStatuses[person.id] === 'queued' ? 'Called' : 'Call Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Person</DialogTitle></DialogHeader>
          <FormFields f={form} setF={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(form)} disabled={!form.full_name || addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit — {selected?.full_name}</DialogTitle></DialogHeader>
          <FormFields f={form} setF={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: selected?.id, ...form })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonGrid({ persons }: { persons: any[] }) {
  return null; // Cards rendered in parent for tab switching
}

function CorporateReceiptsTable() {
  const { hospitalConfig } = useAuth();
  const deleteMutation = useDeleteCorporateBulkPayment();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CorporateBulkPayment | null>(null);

  const { data: payments = [], isLoading } = useCorporateBulkPayments({
    hospital_name: hospitalConfig?.name,
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string, receiptNumber: string) => {
    if (!confirm(`Delete receipt ${receiptNumber}? This will remove all patient allocations.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      sonnerToast.success(`Receipt ${receiptNumber} deleted`);
      setExpandedRows(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch (error: any) {
      sonnerToast.error(`Failed to delete: ${error.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingPayment(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Receipt
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Payment Receipts</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No corporate bulk payment receipts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Corporate</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead className="text-right">Claim Amount</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Patients</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <React.Fragment key={payment.id}>
                      <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRow(payment.id)}>
                        <TableCell>
                          {expandedRows.has(payment.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{payment.corporate_name}</TableCell>
                        <TableCell>{payment.payment_mode}</TableCell>
                        <TableCell>{payment.reference_number || '-'}</TableCell>
                        <TableCell>{payment.bank_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {payment.claim_amount ? `Rs. ${Number(payment.claim_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rs. {Number(payment.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">{payment.allocations?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700"
                              onClick={(e) => { e.stopPropagation(); setEditingPayment(payment); setIsFormOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={(e) => { e.stopPropagation(); handleDelete(payment.id, payment.receipt_number); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(payment.id) && (
                        <TableRow>
                          <TableCell colSpan={11} className="bg-gray-50 p-0">
                            <div className="p-4">
                              {payment.narration && (
                                <p className="text-sm text-gray-600 mb-3"><span className="font-medium">Narration:</span> {payment.narration}</p>
                              )}
                              {payment.allocations && payment.allocations.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-10">#</TableHead>
                                      <TableHead>Patient Name</TableHead>
                                      <TableHead>Patient ID</TableHead>
                                      <TableHead>Visit ID</TableHead>
                                      <TableHead className="text-right">Bill Amount</TableHead>
                                      <TableHead className="text-right">Received Amt</TableHead>
                                      <TableHead className="text-right">Deduction</TableHead>
                                      <TableHead className="text-right">TDS</TableHead>
                                      <TableHead>Remarks</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {payment.allocations.map((alloc, idx) => (
                                      <TableRow key={alloc.id}>
                                        <TableCell className="text-center">{idx + 1}</TableCell>
                                        <TableCell className="font-medium">{alloc.patient_name}</TableCell>
                                        <TableCell>{alloc.patients_id || '-'}</TableCell>
                                        <TableCell>{alloc.visit_id || '-'}</TableCell>
                                        <TableCell className="text-right">{alloc.bill_amount ? `Rs. ${Number(alloc.bill_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                        <TableCell className="text-right">Rs. {Number(alloc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right">{alloc.deduction_amount ? `Rs. ${Number(alloc.deduction_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                        <TableCell className="text-right">{alloc.tds_amount ? `Rs. ${Number(alloc.tds_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                        <TableCell>{alloc.remarks || '-'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-sm text-gray-500">No allocations recorded.</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingPayment(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Edit Corporate Bulk Payment Receipt' : 'New Corporate Bulk Payment Receipt'}</DialogTitle>
          </DialogHeader>
          <BulkPaymentReceiptForm
            key={editingPayment?.id || 'new'}
            editData={editingPayment}
            onSuccess={() => { setIsFormOpen(false); setEditingPayment(null); }}
            onCancel={() => { setIsFormOpen(false); setEditingPayment(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CallLogsTable({ logs }: { logs: any[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-gray-600">Person</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">Phone</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-2 font-medium text-gray-600">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr><td colSpan={5} className="text-center py-8 text-gray-400">No calls yet</td></tr>
          )}
          {logs.map(log => (
            <tr key={log.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{log.person_name || '—'}</td>
              <td className="px-4 py-2 font-mono text-gray-600">{log.phone_number}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  log.call_status === 'queued' ? 'bg-blue-100 text-blue-700' :
                  log.call_status === 'completed' ? 'bg-green-100 text-green-700' :
                  log.call_status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{log.call_status}</span>
              </td>
              <td className="px-4 py-2 text-gray-500">{log.call_type}</td>
              <td className="px-4 py-2 text-gray-400 text-xs">
                {new Date(log.initiated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
