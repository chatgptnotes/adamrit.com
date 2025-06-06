import VisitsTable from '@/components/visits-table';

export default function VisitsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Hospital Visits</h1>
      <VisitsTable />
    </div>
  );
} 