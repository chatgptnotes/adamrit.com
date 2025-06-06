"use client";
import { useEffect, useState } from 'react';
import { getAllVisits } from '@/lib/supabase/api/visits';

interface Visit {
  id: string;
  visit_id: string;
  patient_unique_id: string;
  visit_date: string;
  visit_type: string;
  department: string;
  doctor_name: string;
  reason: string;
  patients: {
    id: string;
    unique_id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
  };
}

export default function VisitsTable() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisits() {
      try {
        const data = await getAllVisits();
        setVisits(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching visits');
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
  }, []);

  if (loading) {
    return <div className="p-4">Loading visits...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900">All Visits</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Visit ID</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Patient</th>
                <th className="p-2 text-left">Department</th>
                <th className="p-2 text-left">Doctor</th>
                <th className="p-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="p-2">{visit.visit_id}</td>
                  <td className="p-2">{new Date(visit.visit_date).toLocaleDateString()}</td>
                  <td className="p-2">
                    {visit.patients.name} ({visit.patients.unique_id})
                  </td>
                  <td className="p-2">{visit.department}</td>
                  <td className="p-2">{visit.doctor_name || 'N/A'}</td>
                  <td className="p-2">{visit.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 