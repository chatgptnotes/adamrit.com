// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Phone, MessageSquare, Clock, User, PhoneCall, History, RefreshCw } from 'lucide-react';

export default function ConferenceCallPage() {
  const { hospitalConfig } = useAuth();

  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState<any>(null);

  const [ourDoctors, setOurDoctors] = useState<any[]>([]);
  const [selectedOurId, setSelectedOurId] = useState('');
  const [ourDoctor, setOurDoctor] = useState<any>(null);

  const [delayMinutes, setDelayMinutes] = useState(0);
  const [patientName, setPatientName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Fetch referring doctors
  useEffect(() => {
    supabase
      .from('master_data')
      .select('id, full_name, mobile, specialization')
      .in('person_type', ['referring_doctor', 'both'])
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => setMasterDoctors(data || []));
  }, []);

  // Fetch our consultants
  useEffect(() => {
    const tableName = hospitalConfig?.name === 'ayushman' ? 'ayushman_consultants' : 'hope_consultants';
    supabase
      .from(tableName)
      .select('id, name, specialty, phone')
      .order('name')
      .then(({ data }) => setOurDoctors(data || []));
  }, [hospitalConfig?.name]);

  // Fetch call logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setCallLogs(data || []);
    setLogsLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleRefSelect = (id: string) => {
    setSelectedRefId(id);
    const doc = masterDoctors.find(d => d.id === id);
    if (doc) setRefDoctor(doc);
  };

  const handleOurSelect = (id: string) => {
    setSelectedOurId(id);
    const doc = ourDoctors.find(d => d.id === id);
    if (doc) setOurDoctor(doc);
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
          patientName,
          referringDoctorName: refDoctor.full_name,
          referringDoctorPhone: refDoctor.mobile,
          ourDoctorName: ourDoctor.name,
          ourDoctorPhone: ourDoctor.phone,
          delayMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: data.message, whatsappNotified: data.whatsappNotified });
        fetchLogs();
      } else {
        setResult({ error: data.error || 'Failed to initiate call' });
      }
    } catch (err: any) {
      setResult({ error: err.message || 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <PhoneCall className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conference Call</h1>
          <p className="text-sm text-gray-500">Connect our doctor with a referring doctor on a 3-way call</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Setup Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Setup Call</h2>

          {/* Patient Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Patient Name (optional)</Label>
            <Input
              placeholder="Enter patient name for reference"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
            />
          </div>

          {/* Referring Doctor */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Referring Doctor
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
              <div className="text-xs bg-gray-50 rounded-lg p-2.5 border">
                <span className="font-medium text-gray-800">{refDoctor.full_name}</span>
                {refDoctor.specialization && <span className="text-gray-500"> | {refDoctor.specialization}</span>}
                <br />
                <span className="text-gray-500">Phone: </span>
                <span className={refDoctor.mobile ? 'text-green-600 font-medium' : 'text-red-500'}>
                  {refDoctor.mobile || 'No number — update in master_data'}
                </span>
              </div>
            )}
          </div>

          {/* Our Doctor */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Our Doctor
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
              <div className="text-xs bg-gray-50 rounded-lg p-2.5 border">
                <span className="font-medium text-gray-800">{ourDoctor.name}</span>
                {ourDoctor.specialty && <span className="text-gray-500"> | {ourDoctor.specialty}</span>}
                <br />
                <span className="text-gray-500">Phone: </span>
                <span className={ourDoctor.phone ? 'text-green-600 font-medium' : 'text-red-500'}>
                  {ourDoctor.phone || 'No phone — update in consultants table'}
                </span>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Schedule
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
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2.5 border border-green-100">
              <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                WhatsApp notification will be sent to Dr. {ourDoctor.name}
                {delayMinutes > 0 ? ` now (call in ${delayMinutes} min)` : ' before connecting'}.
              </span>
            </div>
          )}

          {/* Warnings */}
          {refDoctor && !refDoctor.mobile && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
              Referring doctor has no phone saved. Update in master_data first.
            </div>
          )}
          {ourDoctor && !ourDoctor.phone && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
              Our doctor has no phone saved. Add it in the consultants table.
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-3 text-sm border ${result.success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {result.success ? (
                <>
                  <p className="font-semibold">Call Initiated</p>
                  <p>{result.message}</p>
                  <p className="text-xs mt-1 opacity-75">WhatsApp: {result.whatsappNotified ? 'Sent' : 'Not sent'}</p>
                </>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}

          {/* Call Button */}
          <Button
            onClick={handleCall}
            disabled={isLoading || !canCall}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}
              </span>
            )}
          </Button>
        </div>

        {/* Call Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" /> Recent Calls
            </h2>
            <button onClick={fetchLogs} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="text-sm text-gray-400 text-center py-8">Loading...</div>
          ) : callLogs.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8">No calls made yet</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[480px]">
              {callLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-3 text-sm space-y-1 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{log.patient_name || 'Unknown Patient'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.status === 'completed' ? 'bg-green-100 text-green-700' :
                      log.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.status || 'initiated'}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    <span>Ref: {log.referring_doctor_name || '-'}</span>
                    <span className="mx-1">|</span>
                    <span>Our: {log.our_doctor_name || '-'}</span>
                  </div>
                  <div className="text-gray-400 text-xs">{log.created_at ? formatDate(log.created_at) : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
