// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MessageSquare, Clock, User } from 'lucide-react';

interface ConferenceCallDialogProps {
  open: boolean;
  onClose: () => void;
  visitId?: string;
  patientName?: string;
  referringDoctorName?: string; // pre-filled from visit
}

export const ConferenceCallDialog: React.FC<ConferenceCallDialogProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  referringDoctorName = '',
}) => {
  const { hospitalConfig } = useAuth();

  // Referring doctor from master_data
  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState<{ name: string; mobile: string; specialization?: string } | null>(null);

  // Our doctor from consultants (phone is constant in DB)
  const [ourDoctors, setOurDoctors] = useState<any[]>([]);
  const [selectedOurId, setSelectedOurId] = useState('');
  const [ourDoctor, setOurDoctor] = useState<{ name: string; phone: string } | null>(null);

  // Delay
  const [delayMinutes, setDelayMinutes] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch referring doctors from master_data
  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('master_data')
        .select('id, full_name, mobile, specialization')
        .in('person_type', ['referring_doctor', 'both'])
        .eq('is_active', true)
        .order('full_name');
      setMasterDoctors(data || []);

      // Auto-match referring doctor by name from visit
      if (referringDoctorName && data?.length) {
        const match = data.find(d =>
          d.full_name.toLowerCase().includes(referringDoctorName.toLowerCase()) ||
          referringDoctorName.toLowerCase().includes(d.full_name.toLowerCase())
        );
        if (match) {
          setSelectedRefId(match.id);
          setRefDoctor({ name: match.full_name, mobile: match.mobile || '', specialization: match.specialization });
        }
      }
    };
    fetch();
  }, [open, referringDoctorName]);

  // Fetch our consultants (phone is constant per doctor)
  useEffect(() => {
    if (!open) return;
    const fetchDoctors = async () => {
      const tableName = hospitalConfig?.name === 'ayushman' ? 'ayushman_consultants' : 'hope_consultants';
      const { data } = await supabase
        .from(tableName)
        .select('id, name, specialty, phone')
        .order('name');
      setOurDoctors(data || []);
    };
    fetchDoctors();
  }, [open, hospitalConfig?.name]);

  const handleRefSelect = (id: string) => {
    setSelectedRefId(id);
    const doc = masterDoctors.find(d => d.id === id);
    if (doc) setRefDoctor({ name: doc.full_name, mobile: doc.mobile || '', specialization: doc.specialization });
  };

  const handleOurSelect = (id: string) => {
    setSelectedOurId(id);
    const doc = ourDoctors.find(d => d.id === id);
    if (doc) setOurDoctor({ name: doc.name, phone: doc.phone || '' });
  };

  const canCall = refDoctor?.mobile && ourDoctor?.phone;

  const handleCall = async () => {
    if (!canCall) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/twilio/conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          patientName,
          referringDoctorName: refDoctor!.name,
          referringDoctorPhone: refDoctor!.mobile,
          ourDoctorName: ourDoctor!.name,
          ourDoctorPhone: ourDoctor!.phone,
          delayMinutes,
        }),
      });
      const data = await res.json();
      setResult(data.success
        ? { success: true, message: data.message, whatsappNotified: data.whatsappNotified }
        : { error: data.error || 'Failed to initiate call' }
      );
    } catch (err: any) {
      setResult({ error: err.message || 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedRefId('');
    setSelectedOurId('');
    setRefDoctor(null);
    setOurDoctor(null);
    setDelayMinutes(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Phone className="w-5 h-5" />
            Conference Call
          </DialogTitle>
        </DialogHeader>

        {patientName && (
          <div className="bg-blue-50 rounded-lg p-2 text-sm text-blue-700 font-medium">
            Patient: {patientName}
          </div>
        )}

        <div className="space-y-4">
          {/* Referring Doctor - from master_data */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Referring Doctor
            </Label>
            <Select value={selectedRefId} onValueChange={handleRefSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select referring doctor" />
              </SelectTrigger>
              <SelectContent>
                {masterDoctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}{d.specialization ? ` — ${d.specialization}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {refDoctor && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                <span className="font-medium">{refDoctor.name}</span>
                {refDoctor.specialization && <span> | {refDoctor.specialization}</span>}
                <br />
                Phone: <span className={refDoctor.mobile ? 'text-green-600 font-medium' : 'text-red-500'}>
                  {refDoctor.mobile || 'No number saved in master_data'}
                </span>
              </div>
            )}
          </div>

          {/* Our Doctor - phone constant from DB */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Our Doctor
            </Label>
            <Select value={selectedOurId} onValueChange={handleOurSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select our doctor" />
              </SelectTrigger>
              <SelectContent>
                {ourDoctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}{d.specialty ? ` — ${d.specialty}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ourDoctor && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                <span className="font-medium">{ourDoctor.name}</span><br />
                Phone: <span className={ourDoctor.phone ? 'text-green-600 font-medium' : 'text-red-500'}>
                  {ourDoctor.phone || 'No phone saved — update in consultants table'}
                </span>
              </div>
            )}
          </div>

          {/* Delay */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Schedule Call
            </Label>
            <Select value={String(delayMinutes)} onValueChange={v => setDelayMinutes(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Call Now</SelectItem>
                <SelectItem value="5">In 5 minutes</SelectItem>
                <SelectItem value="10">In 10 minutes</SelectItem>
                <SelectItem value="15">In 15 minutes</SelectItem>
                <SelectItem value="30">In 30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* WhatsApp notice */}
          {ourDoctor && (
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
              <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                WhatsApp notification will be sent to Dr. {ourDoctor.name}
                {delayMinutes > 0 ? ` now (call in ${delayMinutes} min)` : ' before connecting the call'}.
              </span>
            </div>
          )}

          {/* Missing phone warning */}
          {(refDoctor && !refDoctor.mobile) && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">
              Referring doctor has no phone in master_data. Please update the record first.
            </div>
          )}
          {(ourDoctor && !ourDoctor.phone) && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">
              Our doctor has no phone saved. Please add it in the consultants table.
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.success ? (
                <>
                  <p className="font-semibold">Call Initiated</p>
                  <p>{result.message}</p>
                  <p className="text-xs mt-1">WhatsApp: {result.whatsappNotified ? 'Sent' : 'Not sent (check Twilio WhatsApp setup)'}</p>
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
            onClick={handleCall}
            disabled={isLoading || !canCall}
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
