// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';
import { AddItemDialog } from '@/components/AddItemDialog';
import { useAyushmanConsultants } from '@/components/AyushmanConsultants/useAyushmanConsultants';
import { AyushmanConsultantsHeader } from '@/components/AyushmanConsultants/AyushmanConsultantsHeader';
import { AyushmanConsultantsControls } from '@/components/AyushmanConsultants/AyushmanConsultantsControls';
import { AyushmanConsultantsList } from '@/components/AyushmanConsultants/AyushmanConsultantsList';
import { ayushmanConsultantFields } from '@/components/AyushmanConsultants/formFields';

const AyushmanConsultants = () => {
  const {
    searchTerm,
    setSearchTerm,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isLoading,
    paginatedConsultants,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    handleAdd,
    handleEdit,
    handleDelete,
    handleExport,
    handleImport
  } = useAyushmanConsultants();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading Ayushman consultants...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <AyushmanConsultantsHeader />

        <AyushmanConsultantsControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={() => setIsAddDialogOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
        />

        <AyushmanConsultantsList
          consultants={paginatedConsultants}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
        />

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAdd}
          title="Add Ayushman Consultant"
          fields={ayushmanConsultantFields}
        />
      </div>
    </div>
  );
};

export default AyushmanConsultants;