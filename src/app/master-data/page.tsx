// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Phone, Plus, Search, UserPlus, Stethoscope,
  Users, Edit, Trash2, PhoneCall, Clock, CheckCircle, XCircle, Receipt
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCorporateBulkPayments } from '@/hooks/useCorporateBulkPayments';
import { useCorporateData } from '@/hooks/useCorporateData';

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

  // Corporate Receipts filters
  const [receiptFromDate, setReceiptFromDate] = useState('');
  const [receiptToDate, setReceiptToDate] = useState('');
  const [receiptCorporate, setReceiptCorporate] = useState('all');

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

  // Corporate Receipts data
  const { data: payments = [], isLoading: paymentsLoading } = useCorporateBulkPayments({
    from_date: receiptFromDate || undefined,
    to_date: receiptToDate || undefined,
    corporate_name: receiptCorporate !== 'all' ? receiptCorporate : undefined,
  });

  const { corporateOptions = [] } = useCorporateData();

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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatAmount = (val: any) =>
    val ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-';

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
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />Marketing Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Referring Doctors, Relationship Managers, Call Logs & Corporate Receipts</p>
        </div>
        {tab !== 'corporate_receipts' && tab !== 'call_logs' && (
          <Button onClick={() => { setForm(EMPTY_FORM); setIsAddOpen(true); }} className="gap-2">
            <UserPlus className="h-4 w-4" /> Add Person
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({persons.length})</TabsTrigger>
          <TabsTrigger value="referring_doctor">Doctors ({persons.filter(p => p.person_type === 'referring_doctor' || p.person_type === 'both').length})</TabsTrigger>
          <TabsTrigger value="relationship_manager">Rel. Managers ({persons.filter(p => p.person_type === 'relationship_manager' || p.person_type === 'both').length})</TabsTrigger>
          <TabsTrigger value="call_logs">Call Logs ({callLogs.length})</TabsTrigger>
          <TabsTrigger value="corporate_receipts" className="flex items-center gap-1">
            <Receipt className="h-3.5 w-3.5" />
            Corporate Receipts ({payments.length})
          </TabsTrigger>
        </TabsList>

        {/* Search — only for person tabs */}
        {tab !== 'call_logs' && tab !== 'corporate_receipts' && (
          <div className="my-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search name, mobile, hospital..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        )}

        <TabsContent value="all"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="referring_doctor"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="relationship_manager"><PersonGrid persons={filtered} /></TabsContent>
        <TabsContent value="call_logs">
          <CallLogsTable logs={callLogs} />
        </TabsContent>

        {/* ── CORPORATE RECEIPTS TAB ── */}
        <TabsContent value="corporate_receipts">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Corporate</label>
              <Select value={receiptCorporate} onValueChange={setReceiptCorporate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Corporates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Corporates</SelectItem>
                  {corporateOptions.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">From Date</label>
              <Input type="date" value={receiptFromDate} onChange={e => setReceiptFromDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">To Date</label>
              <Input type="date" value={receiptToDate} onChange={e => setReceiptToDate(e.target.value)} className="w-40" />
            </div>
            {(receiptFromDate || receiptToDate || receiptCorporate !== 'all') && (
              <Button variant="outline" size="sm" onClick={() => { setReceiptFromDate(''); setReceiptToDate(''); setReceiptCorporate('all'); }}>
                Clear
              </Button>
            )}
          </div>

          {/* Summary */}
          <div className="flex gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-500">Total Receipts: </span>
              <span className="font-semibold text-blue-700">{payments.length}</span>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-500">Total Amount: </span>
              <span className="font-semibold text-green-700">
                ₹{payments.reduce((s, p) => s + Number(p.total_amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Receipt No.</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Corporate</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="font-semibold">Bank Name</TableHead>
                  <TableHead className="font-semibold text-right">Claim Amount</TableHead>
                  <TableHead className="font-semibold text-right">Total Amount</TableHead>
                  <TableHead className="font-semibold">Patient(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">Loading...</TableCell>
                  </TableRow>
                )}
                {!paymentsLoading && payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">No corporate receipts found.</TableCell>
                  </TableRow>
                )}
                {payments.map((payment: any) => {
                  const patientNames = (payment.allocations || [])
                    .map((a: any) => a.patient_name)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium text-blue-700">
                        {payment.receipt_number}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="font-medium">{payment.corporate_name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {payment.payment_mode}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{payment.reference_number || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{payment.bank_name || '-'}</TableCell>
                      <TableCell className="text-right text-sm">{formatAmount(payment.claim_amount)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-700">
                        {formatAmount(payment.total_amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={patientNames}>
                        {patientNames || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── PERSON CARDS ── */}
      {tab !== 'call_logs' && tab !== 'corporate_receipts' && (
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
