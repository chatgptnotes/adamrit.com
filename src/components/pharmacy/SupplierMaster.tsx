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
  id: number;
  supplier_name: string;
  supplier_code: string;
  supplier_type?: string;
  phone?: string;
  credit_limit?: number;
  email?: string;
  pin?: string;
  dl_no?: string;
  account_group?: string;
  cst?: string;
  s_tax_no?: string;
  address?: string;
  credit_day?: number;
  bank_or_branch?: string;
  mobile?: string;
  created_at?: string;
  updated_at?: string;
}

interface Manufacturer {
  id: number;
  name: string;
  created_at?: string;
}

// Accept an optional prop 'activeTab' to control which tab is shown
interface SupplierMasterProps {
  activeTab?: 'supplier' | 'manufacturer';
}

const SupplierMaster: React.FC<SupplierMasterProps> = ({ activeTab: propActiveTab }) => {
  const { toast } = useToast();
  const activeTab = propActiveTab ?? 'supplier';

  // Supplier states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    supplier_name: '',
    supplier_code: '',
    supplier_type: '',
    phone: '',
    credit_limit: 0,
    email: '',
    pin: '',
    dl_no: '',
    account_group: '',
    cst: '',
    s_tax_no: '',
    address: '',
    credit_day: 0,
    bank_or_branch: '',
    mobile: ''
  });
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);
  const [supplierTotalCount, setSupplierTotalCount] = useState(0);

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

  // Fetch suppliers from database
  useEffect(() => {
    if (activeTab === 'supplier') {
      fetchSuppliers();
    }
  }, [activeTab, supplierCurrentPage, supplierSearch]);

  // Fetch manufacturers from database
  useEffect(() => {
    if (activeTab === 'manufacturer') {
      fetchManufacturers();
    }
  }, [activeTab, currentPage, manufacturerSearch]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const offset = (supplierCurrentPage - 1) * itemsPerPage;

      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' });

      if (supplierSearch.trim()) {
        query = query.or(`supplier_name.ilike.%${supplierSearch.trim()}%,supplier_code.ilike.%${supplierSearch.trim()}%`);
      }

      query = query
        .order('supplier_name', { ascending: true })
        .range(offset, offset + itemsPerPage - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setSuppliers(data || []);
      setSupplierTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierFormChange = (field: keyof Supplier, value: any) => {
    setSupplierForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!supplierForm.supplier_name?.trim() || !supplierForm.supplier_code?.trim()) {
      toast({
        title: 'Error',
        description: 'Supplier Name and Code are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      if (editingSupplier) {
        // Update
        const { error } = await supabase
          .from('suppliers')
          .update(supplierForm)
          .eq('id', editingSupplier.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Supplier updated successfully'
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('suppliers')
          .insert([supplierForm]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Supplier added successfully'
        });
      }

      setShowSupplierForm(false);
      setEditingSupplier(null);
      setSupplierForm({
        supplier_name: '',
        supplier_code: '',
        supplier_type: '',
        phone: '',
        credit_limit: 0,
        email: '',
        pin: '',
        dl_no: '',
        account_group: '',
        cst: '',
        s_tax_no: '',
        address: '',
        credit_day: 0,
        bank_or_branch: '',
        mobile: ''
      });
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save supplier',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Supplier deleted successfully'
      });

      fetchSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete supplier',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const supplierTotalPages = Math.ceil(supplierTotalCount / itemsPerPage);

  const goToSupplierPage = (page: number) => {
    if (page >= 1 && page <= supplierTotalPages) {
      setSupplierCurrentPage(page);
    }
  };

  const handleSupplierSearch = () => {
    setSupplierCurrentPage(1); // Reset to first page when searching
    fetchSuppliers();
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      {/* Supplier section */}
      {activeTab === 'supplier' && (
        <div className="w-full">
          <h2 className="text-xl font-bold text-blue-800 mb-0">Store Management - Add Supplier</h2>
          <div className="h-1 w-full mb-6" style={{background: 'linear-gradient(90deg, #ff9800, #e91e63, #3f51b5, #4caf50)'}}></div>

          {/* Search Box */}
          <div className="flex items-center gap-4 mb-6">
            <label className="font-semibold text-gray-700 whitespace-nowrap">Search:</label>
            <input
              className="border border-gray-400 rounded px-4 py-2 text-lg flex-1 max-w-md"
              placeholder="Search by name or code..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSupplierSearch()}
            />
            <button
              type="button"
              onClick={handleSupplierSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
            >
              <Search size={20} />
            </button>
            {supplierSearch && (
              <button
                type="button"
                onClick={() => {
                  setSupplierSearch('');
                  setSupplierCurrentPage(1);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSupplierForm(true);
                setEditingSupplier(null);
                setSupplierForm({
                  supplier_name: '',
                  supplier_code: '',
                  supplier_type: '',
                  phone: '',
                  credit_limit: 0,
                  email: '',
                  pin: '',
                  dl_no: '',
                  account_group: '',
                  cst: '',
                  s_tax_no: '',
                  address: '',
                  credit_day: 0,
                  bank_or_branch: '',
                  mobile: ''
                });
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
            >
              Add Supplier
            </button>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}

          {/* Suppliers Table */}
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-base font-bold">
                  <th className="px-4 py-2 border">Supplier Name</th>
                  <th className="px-4 py-2 border">Supplier Code</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">DL No.</th>
                  <th className="px-4 py-2 border">Phone</th>
                  <th className="px-4 py-2 border">Mobile</th>
                  <th className="px-4 py-2 border">Edit</th>
                  <th className="px-4 py-2 border">Delete</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 border text-center text-gray-500">
                      No suppliers found. Add a new supplier above.
                    </td>
                  </tr>
                )}
                {suppliers.map((supplier, idx) => (
                  <tr key={supplier.id} className={idx % 2 === 0 ? "bg-gray-100 border-b" : "bg-white border-b"}>
                    <td className="px-4 py-2 border font-semibold">{supplier.supplier_name}</td>
                    <td className="px-4 py-2 border">{supplier.supplier_code}</td>
                    <td className="px-4 py-2 border">{supplier.supplier_type}</td>
                    <td className="px-4 py-2 border">{supplier.dl_no}</td>
                    <td className="px-4 py-2 border">{supplier.phone}</td>
                    <td className="px-4 py-2 border">{supplier.mobile}</td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="inline-block cursor-pointer text-blue-600 hover:text-blue-800"
                        disabled={loading}
                      >
                        <Pencil size={20} />
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id, supplier.supplier_name)}
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
          {!loading && supplierTotalCount > 0 && (
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {((supplierCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(supplierCurrentPage * itemsPerPage, supplierTotalCount)} of {supplierTotalCount} suppliers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToSupplierPage(1)}
                  disabled={supplierCurrentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => goToSupplierPage(supplierCurrentPage - 1)}
                  disabled={supplierCurrentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, supplierTotalPages) }, (_, i) => {
                    let pageNum;
                    if (supplierTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (supplierCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (supplierCurrentPage >= supplierTotalPages - 2) {
                      pageNum = supplierTotalPages - 4 + i;
                    } else {
                      pageNum = supplierCurrentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToSupplierPage(pageNum)}
                        className={`px-3 py-1 border rounded ${
                          supplierCurrentPage === pageNum
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
                  onClick={() => goToSupplierPage(supplierCurrentPage + 1)}
                  disabled={supplierCurrentPage === supplierTotalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => goToSupplierPage(supplierTotalPages)}
                  disabled={supplierCurrentPage === supplierTotalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Supplier Dialog */}
      {showSupplierForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-800">
                {editingSupplier ? 'Edit Supplier' : 'Store Management - Add Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
              >
                Back
              </button>
            </div>
            <form onSubmit={handleAddEditSupplier} className="grid grid-cols-2 gap-x-8 gap-y-4">
              {/* Left column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Supplier Name<span className="text-red-500">*</span></label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.supplier_name || ''}
                    onChange={(e) => handleSupplierFormChange('supplier_name', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Supplier Code<span className="text-red-500">*</span></label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.supplier_code || ''}
                    onChange={(e) => handleSupplierFormChange('supplier_code', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Supplier Type</label>
                  <select
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.supplier_type || ''}
                    onChange={(e) => handleSupplierFormChange('supplier_type', e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Phone</label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.phone || ''}
                    onChange={(e) => handleSupplierFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Credit Limit<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.credit_limit || 0}
                    onChange={(e) => handleSupplierFormChange('credit_limit', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.email || ''}
                    onChange={(e) => handleSupplierFormChange('email', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Pin</label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.pin || ''}
                    onChange={(e) => handleSupplierFormChange('pin', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">DL No.<span className="text-red-500">*</span></label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.dl_no || ''}
                    onChange={(e) => handleSupplierFormChange('dl_no', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Account Group<span className="text-red-500">*</span></label>
                  <select
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.account_group || ''}
                    onChange={(e) => handleSupplierFormChange('account_group', e.target.value)}
                    required
                  >
                    <option value="">Please Select</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">CST<span className="text-red-500">*</span></label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.cst || ''}
                    onChange={(e) => handleSupplierFormChange('cst', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">S. Tax No.<span className="text-red-500">*</span></label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.s_tax_no || ''}
                    onChange={(e) => handleSupplierFormChange('s_tax_no', e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-start gap-3">
                  <label className="w-40 text-sm font-medium mt-2">Address</label>
                  <textarea
                    className="border border-gray-300 rounded px-3 py-2 flex-1 min-h-[80px]"
                    value={supplierForm.address || ''}
                    onChange={(e) => handleSupplierFormChange('address', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Credit Day<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.credit_day || 0}
                    onChange={(e) => handleSupplierFormChange('credit_day', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Bank or Branch</label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.bank_or_branch || ''}
                    onChange={(e) => handleSupplierFormChange('bank_or_branch', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium">Mobile</label>
                  <input
                    className="border border-gray-300 rounded px-3 py-2 flex-1"
                    value={supplierForm.mobile || ''}
                    onChange={(e) => handleSupplierFormChange('mobile', e.target.value)}
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {editingSupplier ? 'Update' : 'Submit'}
                </button>
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