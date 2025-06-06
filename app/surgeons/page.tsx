import SurgeonsTable from '@/components/surgeons-table';

export default function SurgeonsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Hospital Surgeons</h1>
      <SurgeonsTable />
    </div>
  );
} 