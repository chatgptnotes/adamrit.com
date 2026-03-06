// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MessageSquare, Clock } from 'lucide-react';

interface ConferenceCallDialogProps {
  open: boolean;
  onClose: () => void;
  visitId?: string;
  patientName?: string;
  referringDoctorName?: string;
  referringDoctorPhone?: string;
}

export const ConferenceCallDialog: React.FC<ConferenceCallDialogProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  referringDoctorName: initialRefName = '',
  referringDoctorPhone: initialRefPhone = '',
}) => {
  const { hospitalConfig } = useAuth();

  // Referring doctor (from master_data)
  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefDoctor, setSelectedRefDoctor] = useState('');
  const [refPhone, setRefPhone] = useState(initialRefPhone);
  const [refName, setRefName] = useState(initialRefName);

  // Our doctor (from consultants table)
  const [ourDoctors, setOurDoctors] = useState<any[]>([]);
  const [selectedOurDoctor, setSelectedOurDoctor] = useState('');
  const [ourPhone, setOurPhone] = useState('');
  const [ourName, setOurName] = useState('');

  // Schedule
  const [delayMinutes, setDelayMinutes] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string; whatsappNotified?: boolean } | null>(null);

  // Fetch referring doctors from master_data
  useEffect(() => {
    if (!open) return;
    const fetchMasterDoctors = async () => {
      const { data } = await supabase
        .from('master_data')
        .select('id, full_name, mobile, specialization')
        .in('person_type', ['referring_doctor', 'both'])
        .eq('is_active', true)
        .order('full_name');
      setMasterDoctors(data || []);
    };
    fetchMasterDoctors();
  }, [open]);

  // Fetch our consultants
  useEffect(() => {
    if (!open) return;
    const fetchOurDoctors = async () => {
      const tableName = hospitalConfig?.name === 'ayushman' ? 'ayushman_consultants' : 'hope_consultants';
      const { data } = await supabase
        .from(tableName)
        .select('id, name, specialty, phone, contact_info')
        .order('name');
      setOurDoctors(data || []);
    };
    fetchOurDoctors();
  }, [open, hospitalConfig?.name]);

  const handleRefDoctorSelect = (doctorId: string) => {
    setSelectedRefDoctor(doctorId);
    const doc = masterDoctors.find(d => d.id === doctorId);
    if (doc) {
      setRefName(doc.full_name);
      setRefPhone(doc.mobile || '');
    }
  };

  const handleOurDoctorSelect = (doctorId: string) => {
    setSelectedOurDoctor(doctorId);
    const doc = ourDoctors.find(d => d.id === doctorId);
    if (doc) {
      setOurName(doc.name);
      setOurPhone(doc.phone || doc.contact_info || '');
    }
  };

  const handleInitiateCall = async () => {
    if (!refPhone || !ourPhone) {
      setResult({ error: 'Both doctor phone numbers are required. Please enter them manually if missing.' });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/twilio/conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          patientName,
          referringDoctorName: refName,
          referringDoctorPhone: refPhone,
          ourDoctorName: ourName,
          ourDoctorPhone: ourPhone,
          delayMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: data.message, whatsappNotified: data.whatsappNotified });
      } else {
        setResult({ error: data.error || 'Failed to initiate call' });
      }
    } catch (err: any) {
      setResult({ error: err.message || 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedRefDoctor('');
    setSelectedOurDoctor('');
    setRefPhone(initialRefPhone);
    setRefName(initialRefName);
    setOurPhone('');
    setOurName('');
    setDelayMinutes(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Phone className="w-5 h-5" />
            Schedule Conference Call
          </DialogTitle>
        </DialogHeader>

        {patientName && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            Patient: <span className="font-semibold">{patientName}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Referring Doctor */}
          <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Referring Doctor (External)</p>
            {masterDoctors.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Select from Master Data</Label>
                <Select value={selectedRefDoctor} onValueChange={handleRefDoctorSelect}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select referring doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterDoctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}{d.specialization ? ` (${d.specialization})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Name</Label>
              <Input
                value={refName}
                onChange={e => setRefName(e.target.value)}
                placeholder="Dr. Referring Doctor Name"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Phone Number</Label>
              <Input
                value={refPhone}
                onChange={e => setRefPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="text-sm"
              />
            </div>
          </div>

          {/* Our Doctor */}
          <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Our Doctor (Internal)</p>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Select Doctor</Label>
              <Select value={selectedOurDoctor} onValueChange={handleOurDoctorSelect}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select our doctor" />
                </SelectTrigger>
                <SelectContent>
                  {ourDoctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}{d.specialty ? ` (${d.specialty})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Phone Number</Label>
              <Input
                value={ourPhone}
                onChange={e => setOurPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="text-sm"
              />
            </div>
          </div>

          {/* Delay / Schedule */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-gray-500">Notify and call in how many minutes?</Label>
              <Select value={String(delayMinutes)} onValueChange={v => setDelayMinutes(Number(v))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Now (immediately)</SelectItem>
                  <SelectItem value="5">In 5 minutes</SelectItem>
                  <SelectItem value="10">In 10 minutes</SelectItem>
                  <SelectItem value="15">In 15 minutes</SelectItem>
                  <SelectItem value="30">In 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WhatsApp notice */}
          <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
            <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Our doctor (Dr. {ourName || '...'}) will receive a WhatsApp notification
              {delayMinutes > 0 ? ` ${delayMinutes} minute(s) before the call` : ' immediately'}.
            </span>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.success ? (
                <>
                  <p className="font-semibold">Call Initiated Successfully</p>
                  <p>{result.message}</p>
                  <p className="mt-1">
                    WhatsApp notification: {result.whatsappNotified ? 'Sent' : 'Could not send (check Twilio WhatsApp config)'}
                  </p>
                </>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleInitiateCall}
            disabled={isLoading || (!refPhone && !refName) || (!ourPhone && !ourName)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Connecting...' : (
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
