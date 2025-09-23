import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Invoice = () => {
  const [showPharmacyCharges, setShowPharmacyCharges] = useState(false);
  const [discountRemoved, setDiscountRemoved] = useState(false);
  const [chargeFilter, setChargeFilter] = useState('all'); // 'all', 'lab', 'radiology'
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();

  // Fetch patient and visit data
  const { data: visitData, isLoading } = useQuery({
    queryKey: ['invoice-visit', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) {
        console.error('Error fetching visit data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch bill data for financial information
  const { data: billData } = useQuery({
    queryKey: ['invoice-bill', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_sections (
            *,
            bill_line_items (*)
          )
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bill data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch payment data
  const { data: paymentData } = useQuery({
    queryKey: ['invoice-payments', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitId)
        .eq('transaction_type', 'payment');

      if (error) {
        console.error('Error fetching payment data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch advance payments
  const { data: advanceData } = useQuery({
    queryKey: ['invoice-advances', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitId)
        .eq('transaction_type', 'advance');

      if (error) {
        console.error('Error fetching advance data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch lab tests from visit_labs table (Service Selection data)
  const { data: labOrdersData } = useQuery({
    queryKey: ['invoice-visit-labs', visitId],
    queryFn: async () => {
      console.log('=== VISIT LABS DEBUG ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      console.log('Getting visit UUID for visit_id:', visitId);
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID:', visitUUID);

      // Now fetch visit_labs using the UUID
      console.log('Fetching visit_labs for visit UUID:', visitUUID);

      const { data, error } = await supabase
        .from('visit_labs')
        .select(`
          *,
          lab:lab_id (
            id,
            name,
            NABH_rates_in_rupee,
            category,
            description
          )
        `)
        .eq('visit_id', visitUUID)
        .order('ordered_date', { ascending: false });

      console.log('Visit labs query result:', { data, error });

      if (error) {
        console.error('Error fetching visit labs:', error);
        return [];
      }

      console.log('Visit labs data fetched successfully:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch radiology tests from visit_radiology (service selection data)
  const { data: radiologyOrdersData } = useQuery({
    queryKey: ['invoice-visit-radiology', visitId],
    queryFn: async () => {
      if (!visitId) {
        console.log('No visit ID found for radiology tests');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      console.log('=== RADIOLOGY DEBUG ===');
      console.log('Getting visit UUID for radiology, visit_id:', visitId);
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query for radiology result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID for radiology:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID for radiology:', visitUUID);

      // Now fetch visit_radiology using the UUID
      console.log('Fetching visit radiology tests for visit UUID:', visitUUID);

      const { data, error } = await supabase
        .from('visit_radiology')
        .select(`
          *,
          radiology:radiology_id (
            id,
            name,
            category,
            description
          )
        `)
        .eq('visit_id', visitUUID)
        .order('ordered_date', { ascending: false });

      if (error) {
        console.error('Error fetching visit radiology tests:', error);
        return [];
      }

      console.log('Visit radiology tests data fetched successfully:', data);

      // Also try to fetch all visit_radiology records for debugging
      if (!data || data.length === 0) {
        console.log('No radiology data found, checking all visit_radiology records...');
        const { data: allRadiologyData, error: allRadiologyError } = await supabase
          .from('visit_radiology')
          .select('*')
          .limit(10);
        console.log('All visit_radiology records (sample):', { allRadiologyData, allRadiologyError });
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch mandatory services based on patient type
  const { data: mandatoryServicesData } = useQuery({
    queryKey: ['invoice-mandatory-services', visitData?.category, visitData?.patients?.category],
    queryFn: async () => {
      console.log('=== MANDATORY SERVICES DEBUG ===');
      console.log('Full visitData:', visitData);
      console.log('visitData.category:', visitData?.category);
      console.log('visitData.patients:', visitData?.patients);
      console.log('visitData.patients.category:', visitData?.patients?.category);

      // Try to get category from different possible fields
      const patientCategory = visitData?.category || visitData?.patients?.category || visitData?.patients?.patient_category || 'Private';
      console.log('Detected patient category:', patientCategory);

      if (!patientCategory) {
        console.log('No patient category found in any field');
        return [];
      }

      // Determine which services to fetch based on patient type
      let serviceNames = [];

      // Check if patient has admission_date (IPD) or not (OPD)
      const isIPD = visitData?.admission_date && visitData.admission_date !== null;
      console.log('Patient type - isIPD:', isIPD);

      if (isIPD) {
        // IPD patients get Nursing Charges and Doctor Charges
        serviceNames = ['Nursing Charges', 'Doctor Charges'];
        console.log('Fetching IPD mandatory services:', serviceNames);
      } else {
        // OPD patients get First Consultation and Registration Charges
        serviceNames = ['First Consultation', 'Registration Charges'];
        console.log('Fetching OPD mandatory services:', serviceNames);
      }

      const { data, error } = await supabase
        .from('mandatory_services')
        .select('*')
        .eq('status', 'Active')
        .in('service_name', serviceNames)
        .order('service_name', { ascending: true });

      console.log('Mandatory services query result:', { data, error });

      if (error) {
        console.error('Error fetching mandatory services:', error);
        return [];
      }

      console.log('Mandatory services data fetched successfully:', data);
      return data || [];
    },
    enabled: !!visitData // Enable when visitData is available, regardless of category
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  // Show error if no data found
  if (!visitData) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load invoice data for visit ID: {visitId}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const patient = visitData.patients;

  // Calculate age string
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();

    let ageYears = years;
    let ageMonths = months;

    if (days < 0) {
      ageMonths--;
    }
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    return `${ageYears}Y ${ageMonths}M 0D`;
  };

  // Create services array from actual bill data and lab/radiology orders
  // Helper function to get rate based on patient type
  const getMandatoryServiceRate = (service, patientCategory) => {
    if (!service) {
      console.log('getMandatoryServiceRate: No service provided');
      return 0;
    }

    console.log('getMandatoryServiceRate: service rates:', {
      service_name: service.service_name,
      private_rate: service.private_rate,
      tpa_rate: service.tpa_rate,
      cghs_rate: service.cghs_rate,
      non_cghs_rate: service.non_cghs_rate,
      patientCategory: patientCategory
    });

    let rate = 0;
    switch (patientCategory?.toLowerCase()) {
      case 'private':
        rate = parseFloat(service.private_rate) || 0;
        console.log('Using private_rate:', rate);
        break;
      case 'tpa':
      case 'corporate':
        rate = parseFloat(service.tpa_rate) || 0;
        console.log('Using tpa_rate:', rate);
        break;
      case 'cghs':
        rate = parseFloat(service.cghs_rate) || 0;
        console.log('Using cghs_rate:', rate);
        break;
      case 'non_cghs':
        rate = parseFloat(service.non_cghs_rate) || 0;
        console.log('Using non_cghs_rate:', rate);
        break;
      default:
        rate = parseFloat(service.private_rate) || 0; // Default to private rate
        console.log('Using default private_rate:', rate);
        break;
    }

    return rate;
  };

  const createServicesFromBillData = () => {
    const services = [];
    let srNo = 1;

    // If filter is set to lab or radiology, show only that data
    if (chargeFilter === 'lab') {
      console.log('Creating lab services, labOrdersData:', labOrdersData);
      // Show visit labs data (Service Selection)
      if (labOrdersData && labOrdersData.length > 0) {
        labOrdersData.forEach((visitLab) => {
          console.log('Processing visit lab:', visitLab);
          // Ensure amounts are numbers, not strings
          const rate = parseFloat(visitLab.lab?.NABH_rates_in_rupee) || 0;
          services.push({
            srNo: srNo++,
            item: visitLab.lab?.name || 'Lab Test',
            rate: rate,
            qty: 1,
            amount: rate
          });
        });
      } else {
        console.log('No visit labs data found');
      }
      console.log('Lab services created:', services);
      return services;
    }

    if (chargeFilter === 'radiology') {
      console.log('=== CREATING RADIOLOGY SERVICES ===');
      console.log('radiologyOrdersData:', radiologyOrdersData);
      console.log('radiologyOrdersData length:', radiologyOrdersData?.length);

      // Show visit radiology tests data
      if (radiologyOrdersData && radiologyOrdersData.length > 0) {
        radiologyOrdersData.forEach((visitRadiology) => {
          console.log('Processing visit radiology test:', visitRadiology);
          // Use default amount since radiology table doesn't have amount field yet
          const defaultAmount = visitRadiology.radiology?.name?.includes('CT Brain') ? 4000 : 1000;

          console.log('Radiology test details:', {
            name: visitRadiology.radiology?.name,
            defaultAmount: defaultAmount,
            id: visitRadiology.radiology?.id
          });
          services.push({
            srNo: srNo++,
            item: visitRadiology.radiology?.name || 'Radiology Procedure',
            rate: defaultAmount,
            qty: 1,
            amount: defaultAmount
          });
        });
      } else {
        console.log('No visit radiology tests data found - empty or null array');
      }
      console.log('Radiology services created:', services);
      return services;
    }

    // Default: show all charges (bill data + lab + radiology + mandatory services)
    // Don't add static General Ward - let mandatory services be the primary charges
    if (!billData?.bill_sections) {
      // Start with empty services array - mandatory services will be added later
      console.log('No bill sections found, starting with empty services array');
    } else {
      // Add bill sections if they exist
      billData.bill_sections.forEach((section) => {
      if (section.bill_line_items && section.bill_line_items.length > 0) {
        section.bill_line_items.forEach((item) => {
          services.push({
            srNo: srNo++,
            item: item.description || section.section_name,
            rate: item.rate || 0,
            qty: item.quantity || 1,
            amount: item.amount || 0
          });
        });
      } else {
        // If no line items, use section data
        services.push({
          srNo: srNo++,
          item: section.section_name,
          rate: section.total_amount || 0,
          qty: 1,
          amount: section.total_amount || 0
        });
      }
      });
    }

    // Lab and radiology charges should only show when specifically selected from dropdown
    // They are NOT included in "All Charges" view anymore

    // Add mandatory services for Private/OPD and IPD patients
    console.log('=== MANDATORY SERVICES INTEGRATION ===');
    console.log('mandatoryServicesData:', mandatoryServicesData);
    console.log('mandatoryServicesData length:', mandatoryServicesData?.length);

    // Try to get category from different possible fields
    const patientCategory = visitData?.category || visitData?.patients?.category || visitData?.patients?.patient_category || 'Private';
    console.log('Using patient category for rate calculation:', patientCategory);

    if (mandatoryServicesData && mandatoryServicesData.length > 0) {
      console.log('Adding mandatory services for patient category:', patientCategory);
      mandatoryServicesData.forEach((mandatoryService) => {
        console.log('Processing mandatory service:', mandatoryService);
        const rate = getMandatoryServiceRate(mandatoryService, patientCategory);
        console.log('Calculated rate for', mandatoryService.service_name, ':', rate);

        if (rate > 0) { // Only add services with valid rates
          console.log('Adding mandatory service to invoice:', mandatoryService.service_name, 'Rate:', rate);
          services.push({
            srNo: srNo++,
            item: mandatoryService.service_name,
            rate: rate,
            qty: 1,
            amount: rate
          });
        } else {
          console.log('Skipping mandatory service (rate = 0):', mandatoryService.service_name);
        }
      });
    } else {
      console.log('No mandatory services data found or empty array');
    }

    return services;
  };

  // Calculate actual financial amounts from database
  const calculateActualAmounts = () => {
    const totalBillAmount = billData?.total_amount || 0;

    // Calculate total payments (including advances)
    const totalPayments = (paymentData || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalAdvances = (advanceData || []).reduce((sum, advance) => sum + (advance.amount || 0), 0);
    const totalAmountPaid = totalPayments + totalAdvances;

    // Get discount from bill data or calculate from accounting transactions
    const discountAmount = billData?.discount || 0;

    // Calculate balance
    const balance = totalBillAmount - totalAmountPaid - discountAmount;

    return {
      total: totalBillAmount,
      amountPaid: totalAmountPaid,
      discount: discountAmount,
      balance: balance
    };
  };

  const actualAmounts = calculateActualAmounts();

  // Create invoice data from fetched data
  const invoiceData = {
    patientName: patient?.name || 'N/A',
    age: patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (patient?.age ? `${patient.age}Y 0M 0D` : 'N/A'),
    sex: patient?.gender || 'N/A',
    address: patient?.address || 'N/A',
    registrationDate: visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy HH:mm:ss') : 'N/A',
    dischargeDate: visitData.discharge_date ? format(new Date(visitData.discharge_date), 'dd/MM/yyyy HH:mm:ss') : '',
    invoiceNo: billData?.bill_no || visitData.visit_id || 'N/A',
    registrationNo: patient?.patients_id || visitData.visit_id || 'N/A',
    category: billData?.category || 'Private',
    primaryConsultant: visitData.consultant || 'N/A',
    hospitalServiceTaxNo: 'ABUPK3997PSD001',
    hospitalPan: 'AAECD9144P',
    services: createServicesFromBillData(),
    total: actualAmounts.total,
    amountPaid: actualAmounts.amountPaid,
    discount: actualAmounts.discount,
    balance: actualAmounts.balance,
    amountInWords: 'Rupee Thirteen Thousand Nine Hundred Three Only' // TODO: Implement number to words conversion
  };

  // Calculate dynamic total based on filter selection
  const calculateVisibleTotal = () => {
    return invoiceData.services.reduce((total, service) => {
      // Ensure amount is converted to number to avoid string concatenation
      const amount = typeof service.amount === 'string' ? parseFloat(service.amount) || 0 : service.amount || 0;
      return total + amount;
    }, 0);
  };

  const visibleTotal = calculateVisibleTotal();

  // Calculate current discount and balance using actual data
  const currentDiscount = discountRemoved ? 0 : actualAmounts.discount;
  const currentBalance = visibleTotal - actualAmounts.amountPaid - currentDiscount;

  // Print functionality - matches exact screenshot format
  const handlePrint = () => {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Failed to open print window. Please check popup blockers.');
      return;
    }

    // Create the exact print document matching the screenshot
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${new Date().toLocaleDateString('en-IN')}</title>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: white;
              font-size: 12px;
            }

            .print-header {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 30px;
            }

            .invoice-container {
              border: 2px solid #000;
              padding: 15px;
            }

            .patient-info {
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 10px;
            }

            .patient-info table {
              width: 100%;
              border-collapse: collapse;
            }

            .patient-info td {
              border: none;
              padding: 3px 0;
              font-size: 12px;
              vertical-align: top;
            }

            .patient-info .label {
              width: 20%;
              font-weight: bold;
            }

            .patient-info .colon {
              width: 2%;
            }

            .patient-info .value {
              width: 78%;
            }

            .services-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            .services-table th, .services-table td {
              border: 1px solid #000;
              padding: 6px;
              text-align: center;
              font-size: 11px;
            }

            .services-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }

            .services-table .item-column {
              text-align: left;
            }

            .amount-section {
              display: flex;
              margin-top: 20px;
            }

            .amount-words {
              flex: 1;
              padding-right: 20px;
              font-size: 11px;
            }

            .amount-table {
              width: 300px;
            }

            .amount-table table {
              width: 100%;
              border-collapse: collapse;
            }

            .amount-table td {
              border: 1px solid #000;
              padding: 6px;
              font-size: 11px;
            }

            .amount-table .label-cell {
              background-color: #f0f0f0;
              font-weight: bold;
              width: 50%;
            }

            .footer-info {
              margin-top: 20px;
              font-size: 11px;
            }

            .hospital-footer {
              text-align: center;
              margin-top: 30px;
            }

            .hospital-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }

            .signature-item {
              text-align: center;
              font-size: 10px;
            }

            .note {
              margin-top: 20px;
              font-size: 10px;
            }

            @page {
              size: A4;
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="print-header">Hospital Management System Billing</div>

          <div class="invoice-container">
            <!-- Patient Information -->
            <div class="patient-info">
              <table>
                <tr>
                  <td class="label">Name Of Patient</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.patientName}</td>
                </tr>
                <tr>
                  <td class="label">Age/Sex</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.age}/${invoiceData.sex}</td>
                </tr>
                <tr>
                  <td class="label">Address</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.address}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Registration</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationDate}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Discharge</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.dischargeDate}</td>
                </tr>
                <tr>
                  <td class="label">Invoice No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.invoiceNo}</td>
                </tr>
                <tr>
                  <td class="label">Registration No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationNo}</td>
                </tr>
                <tr>
                  <td class="label">Category</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.category}</td>
                </tr>
                <tr>
                  <td class="label">Primary Consultant</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.primaryConsultant}</td>
                </tr>
              </table>
            </div>

            <!-- Services Table -->
            <table class="services-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Item</th>
                  <th>Rate</th>
                  <th>Qty.</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.services.map((service) => {
                  return `
                    <tr>
                      <td>${service.srNo}</td>
                      <td class="item-column">${service.item}</td>
                      <td>${service.rate}</td>
                      <td>${service.qty}</td>
                      <td>${service.amount}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td colspan="4" style="font-weight: bold;">Total</td>
                  <td style="font-weight: bold;">Rs ${visibleTotal.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <!-- Amount Section -->
            <div class="amount-section">
              <div class="amount-words">
                <strong>Amount Chargeable (in words)</strong><br>
                ${invoiceData.amountInWords}
              </div>

              <div class="amount-table">
                <table>
                  <tr>
                    <td class="label-cell">Amount Paid</td>
                    <td style="text-align: right;">Rs ${invoiceData.amountPaid.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Discount</td>
                    <td style="text-align: right;">Rs ${currentDiscount.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Balance</td>
                    <td style="text-align: right;">Rs ${currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Footer Information -->
            <div class="footer-info">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Hospital Service Tax No. : ${invoiceData.hospitalServiceTaxNo}</span>
                <span>Hospitals PAN : ${invoiceData.hospitalPan}</span>
              </div>
              <div style="margin-bottom: 20px;">
                <strong>Signature of Patient :</strong>
              </div>
            </div>

            <!-- Hospital Footer -->
            <div class="hospital-footer">
              <div class="hospital-name">Ayushman Hospital</div>
              <div class="signatures">
                <div class="signature-item">Bill Manager</div>
                <div class="signature-item">Cashier</div>
                <div class="signature-item">Med.Supdt.</div>
                <div class="signature-item">Authorised<br>Signatory</div>
              </div>
            </div>

            <!-- Note -->
            <div class="note">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Print and Close Buttons */}
        <div className="flex justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Print
            </button>
          </div>

          {/* Invoice Form */}
          <div className="border border-gray-300 p-4 invoice-content">
          {/* Patient Information Table */}
          <table className="w-full mb-4 text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium">Name Of Patient</td>
                <td className="py-1">: {invoiceData.patientName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Age/Sex</td>
                <td className="py-1">: {invoiceData.age}/{invoiceData.sex}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Address</td>
                <td className="py-1">: {invoiceData.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Registration</td>
                <td className="py-1">: {invoiceData.registrationDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Discharge</td>
                <td className="py-1">: {invoiceData.dischargeDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Invoice No.</td>
                <td className="py-1">: {invoiceData.invoiceNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Registration No.</td>
                <td className="py-1">: {invoiceData.registrationNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Category</td>
                <td className="py-1">: {invoiceData.category}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Primary Consultant</td>
                <td className="py-1">: {invoiceData.primaryConsultant}</td>
              </tr>
            </tbody>
          </table>

          {/* Control Buttons and Dropdown */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap items-center">
            <button
              onClick={() => setShowPharmacyCharges(!showPharmacyCharges)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Show Pharmacy Charge
            </button>
            <select
              value={chargeFilter}
              onChange={(e) => setChargeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Charges</option>
              <option value="lab">Lab Charges Only</option>
              <option value="radiology">Radiology Charges Only</option>
            </select>
          </div>

          {/* Services Table */}
          <table className="w-full border border-gray-400 text-sm mb-4">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2 text-center">Sr. No.</th>
                <th className="border border-gray-400 p-2 text-center">Item</th>
                <th className="border border-gray-400 p-2 text-center">Rate</th>
                <th className="border border-gray-400 p-2 text-center">Qty.</th>
                <th className="border border-gray-400 p-2 text-center">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.services.map((service) => {
                return (
                  <tr key={service.srNo}>
                    <td className="border border-gray-400 p-2 text-center">{service.srNo}</td>
                    <td className="border border-gray-400 p-2">{service.item}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.rate}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.qty}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.amount}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="border border-gray-400 p-2 text-center font-bold" colSpan={4}>Total</td>
                <td className="border border-gray-400 p-2 text-center font-bold">Rs {visibleTotal.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>

          {/* Amount Details */}
          <div className="flex">
            <div className="w-1/2 pr-4">
              <div className="text-sm">
                <strong>Amount Chargeable (in words)</strong><br />
                {invoiceData.amountInWords}
              </div>
            </div>
            <div className="w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Amount Paid</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {invoiceData.amountPaid.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Discount</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {currentDiscount.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Balance</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Remove Discount Button */}
              <div className="mt-2">
                <button
                  onClick={() => setDiscountRemoved(!discountRemoved)}
                  className={`px-3 py-1 text-white rounded text-xs transition-colors ${
                    discountRemoved
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {discountRemoved ? 'Add Discount' : 'Remove Discount'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-6 text-sm">
            <div className="flex justify-between mb-2">
              <span>Hospital Service Tax No. : {invoiceData.hospitalServiceTaxNo}</span>
              <span>Hospitals PAN : {invoiceData.hospitalPan}</span>
            </div>
            <div className="mb-4">
              <strong>Signature of Patient :</strong>
            </div>

            {/* Hospital Name and Signatures */}
            <div className="text-center border-t border-gray-300 pt-4">
              <h2 className="text-lg font-bold mb-4">Ayushman Hospital</h2>
              <div className="flex justify-between text-center">
                <div>
                  <div className="mb-2">Bill Manager</div>
                </div>
                <div>
                  <div className="mb-2">Cashier</div>
                </div>
                <div>
                  <div className="mb-2">Med.Supdt.</div>
                </div>
                <div>
                  <div className="mb-2">Authorised<br />Signatory</div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 text-xs">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
