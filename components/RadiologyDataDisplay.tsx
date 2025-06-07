'use client';

import { useRadiologyData } from '@/hooks/useRadiologyData';

export function RadiologyDataDisplay() {
  const { radiologyTests, loading, error } = useRadiologyData();

  if (loading) {
    return <div>Loading radiology tests...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Radiology Tests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">ID</th>
              <th className="px-6 py-3 border-b text-left">Name</th>
            </tr>
          </thead>
          <tbody>
            {radiologyTests.map((test) => (
              <tr key={test.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{test.id}</td>
                <td className="px-6 py-4 border-b">{test.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <p>Total tests: {radiologyTests.length}</p>
      </div>
    </div>
  );
} 