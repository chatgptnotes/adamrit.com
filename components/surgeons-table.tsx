"use client";
import { useEffect, useState } from 'react';
import { getSurgeons, Doctor } from '@/lib/supabase/api/doctors';

export default function SurgeonsTable() {
  const [surgeons, setSurgeons] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSurgeons() {
      try {
        const data = await getSurgeons();
        setSurgeons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching surgeons');
      } finally {
        setLoading(false);
      }
    }

    fetchSurgeons();
  }, []);

  if (loading) {
    return <div className="p-4">Loading surgeons...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900">Surgeons List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Specialization</th>
                <th className="p-2 text-left">Department</th>
                <th className="p-2 text-left">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {surgeons.map((surgeon) => (
                <tr key={surgeon.id} className="hover:bg-gray-50">
                  <td className="p-2">{surgeon.name}</td>
                  <td className="p-2">{surgeon.specialization}</td>
                  <td className="p-2">{surgeon.department}</td>
                  <td className="p-2">
                    {surgeon.phone && <div>Phone: {surgeon.phone}</div>}
                    {surgeon.email && <div>Email: {surgeon.email}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 