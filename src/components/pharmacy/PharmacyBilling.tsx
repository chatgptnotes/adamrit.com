// Pharmacy Billing and Dispensing Component
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Scan,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  FileText,
  Calculator,
  Trash2,
  Edit,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  Users,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/contexts/AuthContext';
import { savePharmacySale, SaleData } from '@/lib/pharmacy-billing-service';

interface CartItem {
  id: string;
  medicine_id: string;
  item_code?: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  pack?: string;
  administration_time?: string;
  batch_number: string;
  expiry_date: string;
  mrp: number;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  available_stock: number;
  prescription_required: boolean;
}

interface Sale {
  id: string;
  bill_number: string;
  patient_id?: string;
  patient_name?: string;
  prescription_id?: string;
  sale_date: string;
  sale_type: 'antibiotic' | 'other';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CREDIT';
  payment_reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  cashier_name?: string;
  items: CartItem[];
}

const PharmacyBilling: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saleType, setSaleType] = useState<'antibiotic' | 'other'>('other');
  const [patientInfo, setPatientInfo] = useState({ id: '', name: '', phone: '' });
  const [prescriptionId, setPrescriptionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CREDIT'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [debouncedPatientName] = useDebounce(patientInfo.name, 300);
  const [debouncedPatientId] = useDebounce(patientInfo.id, 300);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [visitId, setVisitId] = useState('');
  const [visitOptions, setVisitOptions] = useState<string[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [allEncounter, setAllEncounter] = useState(false);
  const [encounterType, setEncounterType] = useState('(Private) - OPD');

  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorResults, setShowDoctorResults] = useState(false);
  const [doctorSuggestions, setDoctorSuggestions] = useState<Array<{name: string}>>([]);

  // Sale type options for allowed values (as per DB constraint)
  const saleTypeOptions = [
    { value: 'antibiotic', label: 'Antibiotic' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const searchMedicines = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('medicine_master')
        .select('id, medicine_name, generic_name, type, batch_number, quantity, selling_price, mrp_price, expiry_date')
        .eq('is_deleted', false)
        .or(`medicine_name.ilike.%${debouncedSearchTerm}%,generic_name.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching for medicines:', error);
        setSearchResults([]);
      } else {
        // Map medicine_master fields to expected format
        const mappedData = (data || []).map(item => ({
          id: item.id,
          name: item.medicine_name,
          generic_name: item.generic_name || '',
          strength: '',
          dosage: item.type || '',
          stock: item.quantity || 0,
          price_per_strip: item.selling_price || 0,
          item_code: '',
          batch_number: item.batch_number || 'BATCH-001',
          expiry_date: item.expiry_date || ''
        }));
        setSearchResults(mappedData);
      }
      setIsSearching(false);
    };

    searchMedicines();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const searchPatientsByName = async () => {
      if (debouncedPatientName.length < 2) {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
        return;
      }
      
      const justSelected = patientSearchResults.find(p => p.name === debouncedPatientName);
      if (justSelected && justSelected.patients_id === patientInfo.id) {
          return;
      }

      setIsSearchingPatient(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .eq('hospital_name', hospitalConfig.name)
        .ilike('name', `%${debouncedPatientName}%`)
        .limit(5);

      if (!error) {
        setPatientSearchResults(data || []);
        setShowPatientDropdown(true);
      }
      setIsSearchingPatient(false);
    };

    searchPatientsByName();
  }, [debouncedPatientName]);

  useEffect(() => {
    const searchPatientsById = async () => {
      if (debouncedPatientId.length < 2) {
        return;
      }
      
      if (patientInfo.name && patientInfo.id === debouncedPatientId) {
          return;
      }

      setIsSearchingPatient(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .eq('hospital_name', hospitalConfig.name)
        .eq('patients_id', debouncedPatientId)
        .single();

      if (data) {
        setPatientInfo({ id: data.patients_id, name: data.name, phone: '' });
        setShowPatientDropdown(false);
      }
      setIsSearchingPatient(false);
    };

    searchPatientsById();
  }, [debouncedPatientId]);

  useEffect(() => {
    const fetchVisitsForPatient = async () => {
      if (!patientInfo.id || patientInfo.id.length < 2) {
        setVisitOptions([]);
        setVisitId('');
        setDoctorName('');
        return;
      }
      // 1. Get patient row from patients table using patients_id
      const { data: patientRows, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('hospital_name', hospitalConfig.name)
        .eq('patients_id', patientInfo.id)
        .limit(1);
      if (patientError || !patientRows || patientRows.length === 0) {
        setVisitOptions([]);
        setVisitId('');
        setDoctorName('');
        return;
      }
      const patientRow = patientRows[0];
      // 2. Use id to get visits with appointment_with, sorted by created_at DESC
      const { data: visits, error: visitError } = await supabase
        .from('visits')
        .select('visit_id, created_at, appointment_with')
        .eq('patient_id', patientRow.id)
        .order('created_at', { ascending: false });
      if (visitError || !visits || visits.length === 0) {
        setVisitOptions([]);
        setVisitId('');
        setDoctorName('');
        return;
      }
      setVisitOptions(visits.map(v => v.visit_id));
      setVisitId(visits[0].visit_id); // Auto-select latest
      setDoctorName(visits[0].appointment_with || ''); // Set doctor name from first visit
    };
    fetchVisitsForPatient();
  }, [patientInfo.id]);

  // Fetch doctor name when visit ID changes
  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!visitId) {
        setDoctorName('');
        return;
      }

      const { data, error } = await supabase
        .from('visits')
        .select('appointment_with')
        .eq('visit_id', visitId)
        .single();

      if (data && !error) {
        setDoctorName(data.appointment_with || '');
      }
    };

    fetchDoctorName();
  }, [visitId]);

  const handleSelectPatient = (patient: { name: string, patients_id: string }) => {
    setPatientInfo({ name: patient.name, id: patient.patients_id, phone: '' });
    setShowPatientDropdown(false);
  };

  // Fetch doctor names from ayushman_consultants table
  const searchDoctors = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setDoctorSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Remove duplicates based on name
      const uniqueDoctors = data?.reduce((acc: Array<{name: string}>, curr: any) => {
        if (curr.name && !acc.some(d => d.name === curr.name)) {
          acc.push({ name: curr.name });
        }
        return acc;
      }, []) || [];

      setDoctorSuggestions(uniqueDoctors);
    } catch (error: any) {
      console.error('Error searching doctors:', error);
    }
  };

  // Handle doctor name search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (doctorSearchTerm) {
        searchDoctors(doctorSearchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [doctorSearchTerm]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const addToCart = (medicine: any) => {
    console.log('🏥 Adding medicine to cart:', {
      id: medicine.id,
      name: medicine.name,
      generic_name: medicine.generic_name,
      full_medicine_object: medicine
    });

    const existingItem = cart.find(item => item.medicine_id === medicine.id && item.batch_number === medicine.batch_number);

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        medicine_id: medicine.id,
        item_code: medicine.item_code || '',
        medicine_name: medicine.name || 'Unknown Medicine',
        generic_name: medicine.generic_name || '',
        strength: medicine.strength || '',
        dosage_form: medicine.dosage || '',
        pack: '',
        administration_time: '',
        batch_number: medicine.batch_number || 'BATCH-001',
        expiry_date: medicine.expiry_date || '',
        mrp: medicine.price_per_strip || 0,
        unit_price: medicine.price_per_strip || 0,
        quantity: 1,
        discount_percentage: 0,
        discount_amount: 0,
        tax_percentage: medicine.tax_percentage || 12,
        tax_amount: 0,
        total_amount: 0,
        available_stock: medicine.stock || 0,
        prescription_required: medicine.prescription_required || false
      };

      console.log('✅ New cart item created:', {
        medicine_id: newItem.medicine_id,
        medicine_name: newItem.medicine_name,
        generic_name: newItem.generic_name
      });
      
      // Calculate amounts
      const subtotal = newItem.unit_price * newItem.quantity;
      const discountAmount = (subtotal * newItem.discount_percentage) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * newItem.tax_percentage) / 100;
      const totalAmount = taxableAmount + taxAmount;
      
      newItem.discount_amount = discountAmount;
      newItem.tax_amount = taxAmount;
      newItem.total_amount = totalAmount;
      
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unit_price * newQuantity;
        const discountAmount = (subtotal * item.discount_percentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax_percentage) / 100;
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          quantity: newQuantity,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount
        };
      }
      return item;
    }));
  };

  const updateDiscount = (itemId: string, discountPercentage: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unit_price * item.quantity;
        const discountAmount = (subtotal * discountPercentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax_percentage) / 100;
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setPatientInfo({ id: '', name: '', phone: '' });
    setPrescriptionId('');
    setDiscountPercentage(0);
    setPaymentReference('');
    setVisitId('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.total_amount, 0);
    
    return { subtotal, totalDiscount, totalTax, totalAmount };
  };

  const getVisitUUID = async (visitIdString: string) => {
    // Fetch the UUID (id) for the selected visit_id string
    const { data, error } = await supabase
      .from('visits')
      .select('id')
      .eq('visit_id', visitIdString)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].id;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (!visitId) {
      alert('Please enter Visit ID');
      return;
    }
    setIsProcessingPayment(true);
    // Get the UUID for the selected visit_id string
    const visitUUID = await getVisitUUID(visitId);
    if (!visitUUID) {
      alert('Could not find visit UUID for selected Visit ID.');
      setIsProcessingPayment(false);
      return;
    }
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const totals = calculateTotals();
    const billNumber = `BILL${Date.now()}`;
    const sale: Sale = {
      id: Date.now().toString(),
      bill_number: billNumber,
      patient_id: patientInfo.id || undefined,
      patient_name: patientInfo.name || undefined,
      prescription_id: prescriptionId || undefined,
      sale_date: new Date().toISOString(),
      sale_type: saleType,
      subtotal: totals.subtotal,
      discount_amount: totals.totalDiscount,
      tax_amount: totals.totalTax,
      total_amount: totals.totalAmount,
      paid_amount: totals.totalAmount,
      balance_amount: 0,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      status: 'COMPLETED',
      cashier_name: 'Current User',
      items: [...cart]
    };
    // Insert into visit_medications (one row per medicine)
    console.log('Saving medication_type:', saleType);
    const now = new Date().toISOString();
    const rowsToInsert = [];
    for (const item of cart) {
      // Skip duplicate check - allow multiple pharmacy bills for same medicine
      rowsToInsert.push({
        visit_id: visitUUID, // Use UUID
        medication_id: item.medicine_id,
        prescribed_date: now,
        start_date: null,
        end_date: null,
        created_at: now,
        updated_at: now,
        status: 'dispensed', // Use allowed value
        notes: `Pharmacy bill for patient ${patientInfo.name} (${patientInfo.id})`,
        medication_type: saleType,
        dosage: item.strength || null,
        frequency: null,
        duration: null,
        route: null,
      });
    }
    if (rowsToInsert.length === 0) {
      setIsProcessingPayment(false);
      return;
    }
    console.log('Rows to insert:', rowsToInsert);

    // Use upsert to handle duplicates - if medicine already exists, skip it
    const { error: insertError } = await supabase
      .from('visit_medications')
      .upsert(rowsToInsert, {
        onConflict: 'visit_id,medication_id,medication_type',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('Warning: visit_medications insert error:', insertError.message);
      // Don't stop - continue to pharmacy_sales save
      // alert('Error saving bill to visit_medications: ' + insertError.message);
      // setIsProcessingPayment(false);
      // return;
    }
    // Debug logging
    console.log('=== PHARMACY SALE DEBUG START ===');
    console.log('Cart items:', cart);
    console.log('Patient Info:', patientInfo);
    console.log('Visit ID:', visitId);
    console.log('Payment Method:', paymentMethod);
    console.log('Totals:', totals);

    // Save to pharmacy_sales and pharmacy_sale_items tables
    console.log('Patient ID:', patientInfo.id);
    console.log('Visit ID:', visitId);

    const saleData: SaleData = {
      sale_type: saleType,
      patient_id: patientInfo.id || undefined,  // Send as string
      visit_id: visitId || undefined,            // Send as string
      patient_name: patientInfo.name || undefined,
      prescription_number: prescriptionId || undefined,
      hospital_name: hospitalConfig?.name || undefined, // Add hospital name
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discount_percentage: discountPercentage,
      tax_gst: totals.totalTax,
      tax_percentage: 9,
      total_amount: totals.totalAmount,
      payment_method: paymentMethod,
      payment_status: 'COMPLETED',
      items: cart.map(item => {
        console.log('🔍 Cart item being mapped:', {
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          generic_name: item.generic_name
        });
        return {
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name, // Changed from medication_name to medicine_name
          generic_name: item.generic_name,
          batch_number: item.batch_number || 'N/A',
          expiry_date: item.expiry_date,
          quantity: item.quantity,
          pack_size: 1,
          loose_quantity: 0,
          unit_price: item.unit_price,
          mrp: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
          manufacturer: undefined,
          dosage_form: item.dosage_form,
          strength: item.strength,
          is_implant: false
        };
      })
    };

    console.log('Calling savePharmacySale with data:', saleData);

    const response = await savePharmacySale(saleData);

    console.log('=== PHARMACY SAVE RESPONSE ===');
    console.log('Response:', response);
    console.log('Success:', response.success);
    console.log('Sale ID:', response.sale_id);
    console.log('Error:', response.error);

    if (!response.success) {
      console.error('❌ Error saving to pharmacy_sales:', response.error);
      alert('Error saving sale: ' + response.error);
      setIsProcessingPayment(false);
      return;
    }

    console.log('✅ Sale saved successfully! Sale ID:', response.sale_id);

    // Deduct stock from medicine_master table
    console.log('=== UPDATING STOCK IN MEDICINE_MASTER ===');
    console.log('Cart items to process:', cart.length);
    console.log('Cart data:', JSON.stringify(cart.map(item => ({
      medicine_id: item.medicine_id,
      medicine_name: item.medicine_name,
      quantity: item.quantity
    })), null, 2));

    for (const item of cart) {
      try {
        console.log(`\n🔄 Processing medicine: ${item.medicine_name} (ID: ${item.medicine_id})`);

        // Get current stock first
        const { data: currentMedicine, error: fetchError } = await supabase
          .from('medicine_master')
          .select('quantity, medicine_name')
          .eq('id', item.medicine_id)
          .single();

        if (fetchError) {
          console.error(`❌ Error fetching stock for medicine ${item.medicine_id}:`, fetchError);
          alert(`Error: Could not fetch stock for ${item.medicine_name}. Error: ${fetchError.message}`);
          continue;
        }

        if (!currentMedicine) {
          console.error(`❌ Medicine not found in medicine_master table: ${item.medicine_id}`);
          alert(`Error: Medicine ${item.medicine_name} not found in medicine_master table`);
          continue;
        }

        const newQuantity = (currentMedicine.quantity || 0) - item.quantity;

        console.log(`📊 Stock Update Details:`);
        console.log(`  Medicine: ${currentMedicine.medicine_name}`);
        console.log(`  Current Stock: ${currentMedicine.quantity}`);
        console.log(`  Sold Quantity: ${item.quantity}`);
        console.log(`  New Stock: ${newQuantity}`);

        // Update the stock in medicine_master
        const { data: updateData, error: updateError } = await supabase
          .from('medicine_master')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.medicine_id)
          .select();

        if (updateError) {
          console.error(`❌ Error updating stock for medicine ${item.medicine_id}:`, updateError);
          alert(`Error updating stock for ${item.medicine_name}: ${updateError.message}`);
        } else {
          console.log(`✅ Stock updated successfully for ${currentMedicine.medicine_name}`);
          console.log(`Updated data:`, updateData);
        }
      } catch (error: any) {
        console.error('❌ Exception in stock update:', error);
        alert(`Exception during stock update for ${item.medicine_name}: ${error.message}`);
      }
    }
    console.log('=== STOCK UPDATE COMPLETE ===\n');

    setCompletedSale(sale);
    setIsProcessingPayment(false);
    clearCart();

    alert(`✅ Sale completed successfully! Sale ID: ${response.sale_id}`);
  };

  const filteredMedicines = searchResults.filter(medicine =>
    medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  const printReceipt = () => {
    if (!completedSale) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Receipt</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .bill-info {
            margin: 20px 0;
          }
          .bill-info table {
            width: 100%;
          }
          .bill-info td {
            padding: 5px 0;
          }
          .bill-info td:first-child {
            font-weight: bold;
            width: 150px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .items-table td:last-child,
          .items-table th:last-child {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            float: right;
            width: 300px;
          }
          .totals table {
            width: 100%;
          }
          .totals td {
            padding: 5px 0;
          }
          .totals td:first-child {
            text-align: left;
          }
          .totals td:last-child {
            text-align: right;
          }
          .totals .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .footer {
            clear: both;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${hospitalConfig?.name || 'Hospital Pharmacy'}</h1>
          <p>${hospitalConfig?.address || 'Hospital Address'}</p>
          <p>Phone: ${hospitalConfig?.phone || 'N/A'} | Email: ${hospitalConfig?.email || 'N/A'}</p>
        </div>

        <div class="bill-info">
          <table>
            <tr>
              <td>Bill Number:</td>
              <td>${completedSale.bill_number}</td>
            </tr>
            <tr>
              <td>Date & Time:</td>
              <td>${new Date(completedSale.sale_date).toLocaleString()}</td>
            </tr>
            ${completedSale.patient_name ? `
            <tr>
              <td>Patient Name:</td>
              <td>${completedSale.patient_name}</td>
            </tr>
            ` : ''}
            ${completedSale.patient_id ? `
            <tr>
              <td>Patient ID:</td>
              <td>${completedSale.patient_id}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Payment Method:</td>
              <td>${completedSale.payment_method}</td>
            </tr>
            ${completedSale.payment_reference ? `
            <tr>
              <td>Payment Ref:</td>
              <td>${completedSale.payment_reference}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Cashier:</td>
              <td>${completedSale.cashier_name}</td>
            </tr>
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Disc</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${completedSale.items.map(item => `
              <tr>
                <td>
                  <strong>${item.medicine_name}</strong><br>
                  <small>${item.generic_name || ''} ${item.strength ? '- ' + item.strength : ''}</small>
                </td>
                <td>${item.batch_number}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${item.discount_percentage > 0 ? item.discount_percentage + '%' : '-'}</td>
                <td>${formatCurrency(item.total_amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td>${formatCurrency(completedSale.subtotal)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td>-${formatCurrency(completedSale.discount_amount)}</td>
            </tr>
            <tr>
              <td>Tax (GST):</td>
              <td>${formatCurrency(completedSale.tax_amount)}</td>
            </tr>
            <tr class="grand-total">
              <td>TOTAL:</td>
              <td>${formatCurrency(completedSale.total_amount)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>For any queries, please contact the pharmacy</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            // window.close(); // Uncomment to auto-close after print
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <>
      <style>{`
        /* Hide number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Pharmacy Billing & Dispensing</h2>
            <p className="text-sm text-muted-foreground">
              Process sales, dispense medications, and manage payments
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button variant="outline">
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Search and Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Type and Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Patient Name / ID</label>
                  <div className="relative">
                    <Input
                      placeholder="Type To Search"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo(prev => ({...prev, name: e.target.value}))}
                      onFocus={() => { if (patientInfo.name) setShowPatientDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowPatientDropdown(false), 100)}
                    />
                    {showPatientDropdown && patientSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto">
                        {isSearchingPatient
                          ? <div className="p-2">Searching...</div>
                          : patientSearchResults.map(p => (
                              <div
                                key={p.patients_id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleSelectPatient(p)}
                              >
                                {p.name} ({p.patients_id})
                              </div>
                            ))
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      checked={allEncounter}
                      onChange={(e) => setAllEncounter(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">All Encounter</span>
                  </label>
                  <span className="text-sm pb-2">{encounterType}</span>
                </div>
                <div className="relative">
                  <label className="text-sm font-medium">Doctor Name</label>
                  <Input
                    placeholder="Type To Search"
                    value={doctorSearchTerm || doctorName}
                    onChange={(e) => {
                      setDoctorSearchTerm(e.target.value);
                      setDoctorName(e.target.value);
                      setShowDoctorResults(true);
                    }}
                    onFocus={() => {
                      if (doctorSearchTerm && doctorSuggestions.length > 0) {
                        setShowDoctorResults(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowDoctorResults(false), 200)}
                  />
                  {showDoctorResults && doctorSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {doctorSuggestions.map((doctor, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setDoctorName(doctor.name);
                            setDoctorSearchTerm('');
                            setShowDoctorResults(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Sale Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value as any)}
                  >
                    {saleTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <Input
                    placeholder="Enter patient ID"
                    value={patientInfo.id}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Visit ID</label>
                  {visitOptions.length > 0 ? (
                    <select
                      className="w-full p-2 border rounded"
                      value={visitId}
                      onChange={e => setVisitId(e.target.value)}
                    >
                      <option value="">Select visit ID</option>
                      {visitOptions.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Enter visit ID"
                      value={visitId}
                      onChange={e => setVisitId(e.target.value)}
                    />
                  )}
                </div>
              </div>
              {saleType === 'antibiotic' && (
                <div>
                  <label className="text-sm font-medium">Prescription ID</label>
                  <Input
                    placeholder="Enter prescription ID"
                    value={prescriptionId}
                    onChange={(e) => setPrescriptionId(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicine Search */}
          <Card>
            <CardHeader>
              <CardTitle>Add Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search medicines by name or generic name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchTerm && (
                  <div className="max-h-60 overflow-y-auto border rounded">
                    {isSearching && <div className="p-4 text-center">Searching...</div>}
                    {!isSearching && searchResults.map((medicine) => (
                      <div 
                        key={medicine.id}
                        className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => addToCart(medicine)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {medicine.strength} • {medicine.dosage}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {medicine.stock}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(medicine.price_per_strip || 0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!isSearching && searchResults.length === 0 && searchTerm.length > 1 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No medicines found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground">Search and add medicines to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <p className="text-xs text-red-500 mb-2">(MSU = Minimum Saleable Unit)</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Quantity (MSU)</TableHead>
                        <TableHead>Pack</TableHead>
                        <TableHead>Administration Time</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              className="w-20 text-xs"
                              value={item.item_code || ''}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, item_code: e.target.value } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[150px]">
                              <Input
                                className="w-full text-xs font-medium mb-1"
                                value={item.medicine_name}
                                onChange={(e) => {
                                  setCart(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, medicine_name: e.target.value } : i
                                  ));
                                }}
                              />
                              <Input
                                className="w-full text-xs text-muted-foreground"
                                value={item.generic_name || ''}
                                onChange={(e) => {
                                  setCart(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, generic_name: e.target.value } : i
                                  ));
                                }}
                                placeholder="Generic name"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                className="w-16 text-center text-xs h-6"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.available_stock}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="w-20 text-xs"
                              value={item.pack || ''}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, pack: e.target.value } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-32 p-1 border rounded text-xs"
                              value={item.administration_time || ''}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, administration_time: e.target.value } : i
                                ));
                              }}
                            >
                              <option value="">Please Select</option>
                              <option value="BREAKFAST TIME">BREAKFAST TIME</option>
                              <option value="LUNCH TIME">LUNCH TIME</option>
                              <option value="HS">HS</option>
                              <option value="SOS">SOS</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-32 p-1 border rounded text-xs"
                              value={item.batch_number || ''}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, batch_number: e.target.value } : i
                                ));
                              }}
                            >
                              <option value="">Select</option>
                              <option value={item.batch_number}>{item.batch_number}</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-20 text-xs"
                              value={item.available_stock}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, available_stock: parseFloat(e.target.value) || 0 } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              className="w-32 text-xs"
                              value={item.expiry_date || ''}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, expiry_date: e.target.value } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-24 text-xs"
                              value={item.mrp || 0}
                              onChange={(e) => {
                                const newMrp = parseFloat(e.target.value) || 0;
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, mrp: newMrp } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-24 text-xs"
                              value={item.unit_price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setCart(prev => prev.map(i => {
                                  if (i.id === item.id) {
                                    const subtotal = newPrice * i.quantity;
                                    const discountAmount = (subtotal * i.discount_percentage) / 100;
                                    const taxableAmount = subtotal - discountAmount;
                                    const taxAmount = (taxableAmount * i.tax_percentage) / 100;
                                    const totalAmount = taxableAmount + taxAmount;
                                    return {
                                      ...i,
                                      unit_price: newPrice,
                                      discount_amount: discountAmount,
                                      tax_amount: taxAmount,
                                      total_amount: totalAmount
                                    };
                                  }
                                  return i;
                                }));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-24 text-xs font-medium"
                              value={item.total_amount}
                              onChange={(e) => {
                                setCart(prev => prev.map(i =>
                                  i.id === item.id ? { ...i, total_amount: parseFloat(e.target.value) || 0 } : i
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0 text-red-500"
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button className="mt-4" variant="outline">
                    Add More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary and Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(totals.totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>{formatCurrency(totals.totalTax)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['CASH', 'CARD', 'UPI', 'INSURANCE'].map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method as any)}
                    className="h-12"
                  >
                    {method === 'CASH' && <DollarSign className="h-4 w-4 mr-2" />}
                    {method === 'CARD' && <CreditCard className="h-4 w-4 mr-2" />}
                    {method}
                  </Button>
                ))}
              </div>
              
              {paymentMethod !== 'CASH' && (
                <Input
                  placeholder="Payment reference/transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          {/* Process Payment */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full h-12 text-lg"
                onClick={processSale}
                disabled={cart.length === 0 || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Sale - {formatCurrency(totals.totalAmount)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sales:</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue:</span>
                <span className="font-medium">{formatCurrency(125750)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Bill:</span>
                <span className="font-medium">{formatCurrency(2794)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sale Completion Dialog */}
      <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              Sale Completed Successfully!
            </DialogTitle>
          </DialogHeader>
          {completedSale && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedSale.bill_number}</div>
                <div className="text-muted-foreground">
                  {new Date(completedSale.sale_date).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">{formatCurrency(completedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{completedSale.payment_method}</span>
                </div>
                {completedSale.patient_name && (
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span>{completedSale.patient_name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1" onClick={printReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Email Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default PharmacyBilling;