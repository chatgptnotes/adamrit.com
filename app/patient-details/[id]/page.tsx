'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function PatientDetails() {
  const params = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [allDiagnoses, setAllDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', params.id)
          .single();

        if (patientError) throw patientError;
        console.log("Patient Data:", patientData);
        setPatient(patientData);

        // Fetch patient's visits with doctor names
        const { data: visitsData, error: visitsError } = await supabase
          .from('visits')
          .select('*')
          .eq('patient_unique_id', patientData.patient_id)
          .order('visit_date', { ascending: false });

        console.log("Visits Data:", visitsData);
        if (visitsError) {
          console.error("Visits Error:", visitsError);
          throw visitsError;
        }
        setVisits(visitsData || []);

        // Fetch patient's diagnoses
        const { data: diagnosesData, error: diagnosesError } = await supabase
          .from('patient_diagnosis')
          .select(`
            *,
            diagnosis:diagnosis(*),
            doctor:medical_staff(*)
          `)
          .eq('patient_unique_id', patientData.patient_id)
          .order('diagnosed_date', { ascending: false });

        console.log("Diagnoses Data:", diagnosesData);
        if (diagnosesError) {
          console.error("Diagnoses Error:", diagnosesError);
          throw diagnosesError;
        }
        setDiagnoses(diagnosesData || []);

        // Fetch all diagnoses for the sidebar
        const { data: allDiagnosesData, error: allDiagnosesError } = await supabase
          .from('diagnosis')
          .select('*')
          .order('name', { ascending: true });
        if (allDiagnosesError) throw allDiagnosesError;
        setAllDiagnoses(allDiagnosesData || []);

      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch patient data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [params.id]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-4">Patient not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex gap-6">
      {/* Sidebar for Diagnoses */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-xl shadow-md p-6 mb-6 h-fit">
        <h2 className="text-lg font-bold mb-4 text-blue-900">Diagnoses</h2>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search by diagnosis name"
            className="w-full p-2 border rounded mb-4"
            // You can add search logic if you want
            disabled
          />
        </div>
        {allDiagnoses.length > 0 ? (
          <ul className="space-y-2">
            {allDiagnoses.map((diag: any) => (
              <li key={diag.id} className="p-2 border rounded hover:bg-blue-50 cursor-pointer">
                {diag.name} {diag.diagnosis_id ? `(${String(diag.diagnosis_id)})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-center">No diagnoses found.</div>
        )}
      </div>
      {/* Main Content */}
      <div className="flex-1">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-blue-900">Patient Information</h1>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold">{patient.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Patient ID</p>
              <p className="font-semibold">{patient.patient_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Age/Gender</p>
              <p className="font-semibold">{patient.age} / {patient.gender}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-semibold">{patient.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Address</p>
              <p className="font-semibold">{patient.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Registration Date</p>
              <p className="font-semibold">{new Date(patient.registration_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Diagnoses Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Diagnoses</h2>
          {diagnoses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Diagnosis</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Doctor</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {diagnoses.map((diagnosis) => (
                    <tr key={diagnosis.id} className="hover:bg-gray-50">
                      <td className="p-2">{diagnosis.diagnosis?.name}</td>
                      <td className="p-2">{new Date(diagnosis.diagnosed_date).toLocaleDateString()}</td>
                      <td className="p-2">{diagnosis.doctor?.name || 'N/A'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          diagnosis.status === 'active'
                            ? 'bg-green-100 text-green-800' 
                            : diagnosis.status === 'resolved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {diagnosis.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-2">{diagnosis.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No diagnoses recorded yet.</p>
          )}
        </div>

        {/* Visits Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Visit History</h2>
          {visits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Visit ID</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Department</th>
                    <th className="p-2 text-left">Doctor</th>
                    <th className="p-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visits.map((visit) => (
                    <tr key={visit.id || visit.visit_id} className="hover:bg-gray-50">
                      <td className="p-2">{visit.visit_id}</td>
                      <td className="p-2">{new Date(visit.visit_date).toLocaleDateString()}</td>
                      <td className="p-2">{visit.department}</td>
                      <td className="p-2">{visit.doctor_name || 'N/A'}</td>
                      <td className="p-2">{visit.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No visits recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
} 