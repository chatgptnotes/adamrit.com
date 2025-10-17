// Supplier Master Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  accountNumber: string;
  dlNo: string;
  cstNo: string;
  sTaxNo: string;
  phone: string;
}

interface Manufacturer {
  id: number;
  name: string;
  created_at?: string;
}

const dummySuppliers: Supplier[] = [
  { id: '1', name: 'A.R MEDICAL & SURGICALS', accountNumber: 'PHDQ7J3YH', dlNo: '20B-MH-NAG-68619,21B-MH-NAG-68620', cstNo: '27011458794P', sTaxNo: '27011458794C', phone: '9923272868 9371987473' },
  { id: '2', name: 'ABHAYANKAR AUSHADI VYAVASAI.', accountNumber: 'ABH001', dlNo: 'B 10315', cstNo: '', sTaxNo: '440002/S/1654', phone: '' },
  { id: '3', name: 'ADARSH SALES WHOLESALE DEALER IN MEDICINES', accountNumber: 'PHDSYR19C', dlNo: '20B-10394 21B-3274', cstNo: '', sTaxNo: '', phone: '0712-2768330,2764330' },
  { id: '4', name: 'ADVANTAGE SURGICALS CO.', accountNumber: 'ASC002', dlNo: '', cstNo: '', sTaxNo: '', phone: '9422122658' },
  { id: '5', name: 'AGRAWAL AGENCIES', accountNumber: 'PHF24LH69', dlNo: '20-136/09,21-136/09', cstNo: '', sTaxNo: '', phone: '07122763246,2766886' },
  { id: '6', name: 'ajay medical stors', accountNumber: 'PH1XYUE2S', dlNo: '20/nag/1203/2002 21/nag/1203/2002', cstNo: '', sTaxNo: '', phone: '2634310' },
  { id: '7', name: 'AJIT PHARMATICS', accountNumber: 'PH4Y3PFSQ', dlNo: '20/MH/NAG/136/2009 21/MH/NAG/136/2009', cstNo: '', sTaxNo: '', phone: '9028058600,8087087360' },
];

// Accept an optional prop 'activeTab' to control which tab is shown
interface SupplierMasterProps {
  activeTab?: 'supplier' | 'manufacturer';
}

const SupplierMaster: React.FC<SupplierMasterProps> = ({ activeTab: propActiveTab }) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [suppliers] = useState(dummySuppliers);
  const [search, setSearch] = useState('');
  const activeTab = propActiveTab ?? 'supplier';

  // Manufacturer states
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [manufacturerName, setManufacturerName] = useState('');
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination and search states
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 15;

  // Fetch manufacturers from database
  useEffect(() => {
    if (activeTab === 'manufacturer') {
      fetchManufacturers();
    }
  }, [activeTab, currentPage, manufacturerSearch]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);

      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage;

      // Build query
      let query = supabase
        .from('manufacturer_companies')
        .select('*', { count: 'exact' });

      // Add search filter if search term exists
      if (manufacturerSearch.trim()) {
        query = query.ilike('name', `%${manufacturerSearch.trim()}%`);
      }

      // Add pagination and ordering
      query = query
        .order('name', { ascending: true })
        .range(offset, offset + itemsPerPage - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setManufacturers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching manufacturers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load manufacturers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchManufacturers();
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter manufacturer name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manufacturer_companies')
        .insert([{ name: manufacturerName.trim() }])
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Manufacturer added successfully'
      });

      setManufacturerName('');
      fetchManufacturers();
    } catch (error: any) {
      console.error('Error adding manufacturer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add manufacturer',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditManufacturer = async () => {
    if (!editingManufacturer || !manufacturerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter manufacturer name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('manufacturer_companies')
        .update({ name: manufacturerName.trim() })
        .eq('id', editingManufacturer.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Manufacturer updated successfully'
      });

      setManufacturerName('');
      setEditingManufacturer(null);
      fetchManufacturers();
    } catch (error: any) {
      console.error('Error updating manufacturer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update manufacturer',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManufacturer = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('manufacturer_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Manufacturer deleted successfully'
      });

      fetchManufacturers();
    } catch (error: any) {
      console.error('Error deleting manufacturer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete manufacturer',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditManufacturer = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setManufacturerName(manufacturer.name);
  };

  const cancelEdit = () => {
    setEditingManufacturer(null);
    setManufacturerName('');
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      {/* Only show supplier table if activeTab is supplier */}
      {activeTab === 'supplier' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 items-center">
                  <input
                className="border rounded px-2 py-1 w-64"
                placeholder="Types to Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Search</Button>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowDialog(true)}>Add Supplier</Button>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-100 border border-gray-300">
              <thead>
                <tr className="bg-gray-400 text-white text-sm">
                  <th className="px-2 py-1 border">Supplier Name</th>
                  <th className="px-2 py-1 border">Account Number</th>
                  <th className="px-2 py-1 border">DL No.</th>
                  <th className="px-2 py-1 border">CST No.</th>
                  <th className="px-2 py-1 border">S.Tax No.</th>
                  <th className="px-2 py-1 border">Phone</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-gray-200' : 'bg-white'}>
                    <td className="px-2 py-1 border font-semibold">{s.name}</td>
                    <td className="px-2 py-1 border">{s.accountNumber}</td>
                    <td className="px-2 py-1 border">{s.dlNo}</td>
                    <td className="px-2 py-1 border">{s.cstNo}</td>
                    <td className="px-2 py-1 border">{s.sTaxNo}</td>
                    <td className="px-2 py-1 border">{s.phone}</td>
                    <td className="px-2 py-1 border text-center">
                      <button className="inline-block mx-1 text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button className="inline-block mx-1 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Add Supplier Dialog (full form as per screenshot) */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-5xl">
            <h3 className="text-lg font-bold mb-4">Add Supplier</h3>
            <form className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Left column */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <span>Supplier Name<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Supplier Code<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Supplier Type</span>
                  <select className="border rounded px-2 py-1 flex-1">
                    <option>Please select</option>
                    <option>Distributor</option>
                    <option>Wholesaler</option>
                    <option>Retailer</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span>Phone</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Credit Limit<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Email</span>
                  <input className="border rounded px-2 py-1 flex-1" type="email" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Pin</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>DL No.<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Account Group<span className="text-red-500">*</span></span>
                  <select className="border rounded px-2 py-1 flex-1" required>
                    <option>Please Select</option>
                    <option>Pharmacy</option>
                    <option>General</option>
                  </select>
                </label>
              </div>
              {/* Right column */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <span>CST<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>S. Tax No.<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2 items-start">
                  <span>Address</span>
                  <textarea className="border rounded px-2 py-1 flex-1 min-h-[60px]" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Credit Day<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Bank or Branch</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Mobile</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
              </div>
              {/* Submit button */}
              <div className="col-span-2 flex justify-end mt-4">
                <Button type="button" className="bg-gray-300 text-black mr-2" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">Submit</Button>
              </div>
            </form>
              </div>
            </div>
      )}
      {/* Manufacturer section */}
      {activeTab === 'manufacturer' && (
        <div className="w-full">
          <h2 className="text-xl font-bold text-green-800 mb-0">Manufacturing Company</h2>
          <div className="h-1 w-full mb-6" style={{background: 'linear-gradient(90deg, #ff9800, #e91e63, #3f51b5, #4caf50)'}}></div>

          {/* Search Box */}
          <div className="flex items-center gap-4 mb-6">
            <label className="font-semibold text-gray-700 whitespace-nowrap">Search:</label>
            <input
              className="border border-gray-400 rounded px-4 py-2 text-lg flex-1 max-w-md"
              placeholder="Search by manufacturer name..."
              value={manufacturerSearch}
              onChange={(e) => setManufacturerSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
            >
              <Search size={20} />
            </button>
            {manufacturerSearch && (
              <button
                type="button"
                onClick={() => {
                  setManufacturerSearch('');
                  setCurrentPage(1);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <form onSubmit={editingManufacturer ? (e) => { e.preventDefault(); handleEditManufacturer(); } : handleAddManufacturer} className="flex items-center justify-end gap-4 mb-6">
            <label className="font-semibold text-gray-700 mr-2 whitespace-nowrap">
              Manufacture Company Name<span className="text-red-500">*</span>
            </label>
            <input
              className="border border-gray-400 rounded px-4 py-2 text-lg flex-1 max-w-2xl"
              placeholder="add new manufacturer company name"
              value={manufacturerName}
              onChange={(e) => setManufacturerName(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {editingManufacturer ? 'Update' : 'Submit'}
            </button>
            {editingManufacturer && (
              <button
                type="button"
                className="bg-gray-600 text-white px-6 py-2 rounded font-bold hover:bg-gray-700"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </form>

          {loading && <div className="text-center py-4">Loading...</div>}

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-base font-bold">
                  <th className="px-4 py-2 border">Manufacture Company Name</th>
                  <th className="px-4 py-2 border">Edit</th>
                  <th className="px-4 py-2 border">Delete</th>
                </tr>
              </thead>
              <tbody>
                {manufacturers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 border text-center text-gray-500">
                      No manufacturers found. Add a new manufacturer above.
                    </td>
                  </tr>
                )}
                {manufacturers.map((manufacturer, idx) => (
                  <tr key={manufacturer.id} className={idx % 2 === 0 ? "bg-gray-100 border-b" : "bg-white border-b"}>
                    <td className="px-4 py-2 border font-semibold">{manufacturer.name}</td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => startEditManufacturer(manufacturer)}
                        className="inline-block cursor-pointer text-blue-600 hover:text-blue-800"
                        disabled={loading}
                      >
                        <Pencil size={20} />
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleDeleteManufacturer(manufacturer.id, manufacturer.name)}
                        className="inline-block cursor-pointer text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalCount > 0 && (
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} manufacturers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierMaster; 