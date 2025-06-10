'use client';

import React, { useState } from 'react';
import { SearchSelect } from '@/components/SearchSelect';
import { useLabData } from '@/hooks/useLabData';
import { useRadiologyData } from '@/hooks/useRadiologyData';
import { useMedicationData } from '@/hooks/useMedicationData';
import { useComplications } from '@/hooks/useComplications';
import type { Complication } from '@/hooks/useComplications';

export function ComplicationMaster() {
  const { labTests, loading: labLoading } = useLabData();
  const { radiologyTests, loading: radiologyLoading } = useRadiologyData();
  const { medications, loading: medicationLoading } = useMedicationData();
  const {
    complications,
    loading: complicationsLoading,
    error,
    createComplication,
    updateComplication,
    deleteComplication,
    setComplications,
  } = useComplications();

  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: { [key: string]: any };
  }>({});

  // Add search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter and paginate complications
  const filteredComplications = complications.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRows = filteredComplications.length;
  const paginatedComplications = filteredComplications.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSelectChange = (complicationId: string, field: string, value: any) => {
    // Update the complication in the database
    const updates: { [key: string]: string | null } = {
      [field]: value?.id || null,
    };

    // Update local state immediately for better UX
    const updatedComplications = complications.map(comp =>
      comp.id === complicationId
        ? { ...comp, [field]: value?.id || null }
        : comp
    );
    setComplications(updatedComplications);

    // Call the API
    updateComplication(complicationId, updates)
      .then(() => {
        // Update was successful, no need to do anything as local state is already updated
      })
      .catch(error => {
        console.error('Error updating complication:', error);
        // Revert the change on error by restoring the original complications array
        setComplications(complications);
      });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this complication?')) {
      try {
        await deleteComplication(id);
      } catch (error) {
        console.error('Error deleting complication:', error);
      }
    }
  };

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Complication Master</h1>
        <div className="flex gap-2">
          <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Upload Excel/CSV
          </button>
          <button className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
            + Add More
          </button>
        </div>
      </div>
      {/* Search input */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search complication..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          className="ml-4 p-2 border rounded w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[150px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="w-[120px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Risk Level
                  </th>
                  <th className="w-[250px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="w-[120px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Foreign Key
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lab 1
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lab 2
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rad 1
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rad 2
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    MED1
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    MED2
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    MED3
                  </th>
                  <th className="w-[220px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    MED4
                  </th>
                  <th className="w-[100px] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedComplications.map((complication) => (
                  <tr key={complication.id}>
                    <td className="whitespace-nowrap px-6 py-4">{complication.name}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          complication.risk_level === 'Low'
                            ? 'bg-green-100 text-green-800'
                            : complication.risk_level === 'Moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {complication.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">{complication.description}</td>
                    <td className="whitespace-nowrap px-6 py-4">{complication.foreign_key}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={labTests}
                        value={labTests.find(lab => lab.id === complication.lab1_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'lab1_id', value)}
                        isLoading={labLoading}
                        placeholder="Select Lab Test"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={labTests}
                        value={labTests.find(lab => lab.id === complication.lab2_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'lab2_id', value)}
                        isLoading={labLoading}
                        placeholder="Select Lab Test"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={radiologyTests}
                        value={radiologyTests.find(rad => rad.id === complication.rad1_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'rad1_id', value)}
                        isLoading={radiologyLoading}
                        placeholder="Select Radiology Test"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={radiologyTests}
                        value={radiologyTests.find(rad => rad.id === complication.rad2_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'rad2_id', value)}
                        isLoading={radiologyLoading}
                        placeholder="Select Radiology Test"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={medications}
                        value={medications.find(med => med.id === complication.med1_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'med1_id', value)}
                        isLoading={medicationLoading}
                        placeholder="Select Medication"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={medications}
                        value={medications.find(med => med.id === complication.med2_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'med2_id', value)}
                        isLoading={medicationLoading}
                        placeholder="Select Medication"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={medications}
                        value={medications.find(med => med.id === complication.med3_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'med3_id', value)}
                        isLoading={medicationLoading}
                        placeholder="Select Medication"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <SearchSelect
                        options={medications}
                        value={medications.find(med => med.id === complication.med4_id) || null}
                        onChange={(value) => handleSelectChange(complication.id, 'med4_id', value)}
                        isLoading={medicationLoading}
                        placeholder="Select Medication"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleDelete(complication.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Results count and pagination controls */}
      <p className="mb-2 text-sm text-gray-500">
        Showing {paginatedComplications.length} of {totalRows} results
      </p>
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-3 py-1 border rounded"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page} of {Math.max(1, Math.ceil(totalRows / pageSize))}
        </span>
        <button
          className="px-3 py-1 border rounded"
          disabled={page >= Math.ceil(totalRows / pageSize)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 