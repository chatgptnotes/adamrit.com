'use client';

import { useState } from 'react';
import { useMedicationData } from '@/hooks/useMedicationData';

export function MedicationDataDisplay() {
  const [searchQuery, setSearchQuery] = useState('');
  const { medications, loading, error } = useMedicationData(searchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  // Check if we have any data to determine which columns exist
  const hasCode = medications.some(med => med.code !== undefined);
  const hasDosage = medications.some(med => med.dosage !== undefined);
  const hasRoute = medications.some(med => med.route !== undefined);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Medications</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">Name</th>
              {hasCode && <th className="px-6 py-3 border-b text-left">Code</th>}
              {hasDosage && <th className="px-6 py-3 border-b text-left">Dosage</th>}
              {hasRoute && <th className="px-6 py-3 border-b text-left">Route</th>}
            </tr>
          </thead>
          <tbody>
            {medications.map((medication) => (
              <tr key={medication.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{medication.name}</td>
                {hasCode && <td className="px-6 py-4 border-b">{medication.code || '-'}</td>}
                {hasDosage && <td className="px-6 py-4 border-b">{medication.dosage || '-'}</td>}
                {hasRoute && <td className="px-6 py-4 border-b">{medication.route || '-'}</td>}
              </tr>
            ))}
            {medications.length === 0 && !loading && (
              <tr>
                <td colSpan={1 + (hasCode ? 1 : 0) + (hasDosage ? 1 : 0) + (hasRoute ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery ? 'No medications found matching your search' : 'No medications available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <p>Total medications: {medications.length}</p>
        {searchQuery && (
          <p>
            Showing results for: &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
    </div>
  );
} 