import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

const DetailedInvoice = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const printRef = useRef(null);

  // Close function that goes back or to a specific page
  const handleClose = () => {
    // Try to go back first, if no history then go to financial summary
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/financial-summary');
    }
  };

  // Alternative print function using window.print()
  const handlePrint = () => {
    console.log('🖨️ Print button clicked');
    console.log('📋 Patient data available:', !!patientData);
    console.log('🖼️ Print ref available:', !!printRef.current);

    if (!patientData) {
      alert('Patient data is not loaded yet. Please wait for the data to load before printing.');
      return;
    }

    if (!printRef.current) {
      alert('Print content is not ready. Please try again.');
      return;
    }

    try {
      // Create a new window with just the invoice content
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
        return;
      }

      const printContent = printRef.current.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detailed Invoice - ${patientData?.claimId || visitId}</title>
            <style>
              @page {
                size: A4;
                margin: 0.5in;
              }

              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .border-gray-400 {
                border: 1px solid #000 !important;
              }

              .border-gray-300 {
                border: 1px solid #666 !important;
              }

              .bg-gray-100 {
                background-color: #f5f5f5 !important;
              }

              .bg-gray-200 {
                background-color: #e5e5e5 !important;
              }

              table {
                border-collapse: collapse;
                width: 100%;
                break-inside: avoid;
              }

              th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }

              .text-center {
                text-align: center;
              }

              .text-right {
                text-align: right;
              }

              .font-bold {
                font-weight: bold;
              }

              .text-lg {
                font-size: 1.125rem;
              }

              .text-base {
                font-size: 1rem;
              }

              .text-sm {
                font-size: 0.875rem;
              }

              .text-xs {
                font-size: 0.75rem;
              }

              .py-3 {
                padding-top: 12px;
                padding-bottom: 12px;
              }

              .p-1 {
                padding: 4px;
              }

              .p-2 {
                padding: 8px;
              }

              .mb-4 {
                margin-bottom: 16px;
              }

              .mt-4 {
                margin-top: 16px;
              }

              .mt-8 {
                margin-top: 32px;
              }

              .pt-4 {
                padding-top: 16px;
              }

              .flex {
                display: flex;
              }

              .justify-between {
                justify-content: space-between;
              }

              .items-end {
                align-items: flex-end;
              }

              .gap-1 {
                gap: 4px;
              }

              .w-12 {
                width: 48px;
              }

              .w-16 {
                width: 64px;
              }

              .w-24 {
                width: 96px;
              }

              .w-32 {
                width: 128px;
              }

              @media print {
                body {
                  margin: 0;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (error) {
      console.error('❌ Error during print:', error);
      alert('Failed to open print dialog. Please try again.');
    }
  };

  // Excel export function
  const handleExcelExport = () => {
    if (!patientData || !visitData) return;

    const workbook = XLSX.utils.book_new();

    // Patient Info Sheet
    const patientInfo = [
      ['DETAILED INVOICE REPORT', '', '', ''],
      ['', '', '', ''],
      ['Patient Information', '', '', ''],
      ['Bill No:', patientData.billNo, '', ''],
      ['Registration No:', patientData.registrationNo, '', ''],
      ['Patient Name:', patientData.patientName, '', ''],
      ['Age:', patientData.age, '', ''],
      ['Sex:', patientData.sex, '', ''],
      ['Address:', patientData.address, '', ''],
      ['Contact No:', patientData.contactNo, '', ''],
      ['Bed Category:', patientData.bedCategory, '', ''],
      ['Unit Name:', patientData.unitName, '', ''],
      ['Date of Admission:', patientData.dateOfAdmission, '', ''],
      ['Date of Discharge:', patientData.dateOfDischarge, '', ''],
      ['Primary Consultant:', patientData.primaryConsultant, '', ''],
      ['', '', '', ''],
    ];

    // Services breakdown
    const servicesData = [
      ['SERVICE BREAKDOWN', '', '', '', ''],
      ['Sr.No.', 'Item', 'Date & Time', 'Qty/Days', 'Rate'],
      ['', '', '', '', ''],
      ['ROOM TARIFF', '', '', '', ''],
    ];

    // Add room tariff data
    serviceData.roomTariff.forEach((item, index) => {
      servicesData.push([index + 1, item.item, item.dateTime, item.qty, item.rate]);
    });

    servicesData.push(['', '', '', '', '']);
    servicesData.push(['SERVICES', '', '', '', '']);

    // Add services data
    serviceData.services.forEach((item, index) => {
      servicesData.push([index + 1, item.item, item.dateTime, item.qty, item.rate]);
    });

    servicesData.push(['', '', '', '', '']);
    servicesData.push(['LABORATORY', '', '', '', '']);

    // Add laboratory data
    if (serviceData.laboratory.length > 0) {
      serviceData.laboratory.forEach((item, index) => {
        servicesData.push([index + 1, item.item, item.dateTime, item.qty, item.rate]);
      });
    } else {
      servicesData.push(['-', 'No laboratory tests ordered', '', '', '']);
    }

    servicesData.push(['', '', '', '', '']);
    servicesData.push(['RADIOLOGY', '', '', '', '']);

    // Add radiology data
    if (serviceData.radiology.length > 0) {
      serviceData.radiology.forEach((item, index) => {
        servicesData.push([index + 1, item.item, item.dateTime, item.qty, item.rate]);
      });
    } else {
      servicesData.push(['-', 'No radiology tests ordered', '', '', '']);
    }

    if (serviceData.pharmacy.length > 0) {
      servicesData.push(['', '', '', '', '']);
      servicesData.push(['PHARMACY', '', '', '', '']);
      serviceData.pharmacy.forEach((item, index) => {
        servicesData.push([index + 1, item.item, item.dateTime, item.qty, item.rate]);
      });
    }

    // Add totals
    servicesData.push(['', '', '', '', '']);
    servicesData.push(['TOTAL AMOUNT', '', '', '', serviceData.totalAmount]);
    servicesData.push(['Amount in Words:', patientData.amountInWords, '', '', '']);

    // Combine all data
    const allData = [...patientInfo, ...servicesData];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 },  // Column A
      { wch: 30 },  // Column B
      { wch: 20 },  // Column C
      { wch: 15 },  // Column D
      { wch: 15 },  // Column E
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Invoice');

    // Generate filename
    const fileName = `DetailedInvoice_${patientData.claimId}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
  };

  // Fetch patient data from database
  const { data: visitData, isLoading, error } = useQuery({
    queryKey: ['visit-details', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🔍 Fetching visit details for visitId:', visitId);

      // Function to check if string is valid UUID format
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      let visit = null;
      let visitError = null;

      // Try different approaches to find the visit
      if (isValidUUID(visitId)) {
        // If visitId is a UUID, search by id
        const result = await supabase
          .from('visits')
          .select(`
            *,
            patients (
              id,
              patients_id,
              name,
              age,
              gender,
              phone,
              address
            )
          `)
          .eq('id', visitId)
          .single();
        visit = result.data;
        visitError = result.error;
      } else {
        // If visitId is not a UUID, try searching by visit_id field
        const result = await supabase
          .from('visits')
          .select(`
            *,
            patients (
              id,
              patients_id,
              name,
              age,
              gender,
              phone,
              address
            )
          `)
          .eq('visit_id', visitId)
          .single();
        visit = result.data;
        visitError = result.error;

        // If still not found, try searching by patients_id in patients table
        if (visitError || !visit) {
          const patientResult = await supabase
            .from('patients')
            .select(`
              *,
              visits (
                *
              )
            `)
            .eq('patients_id', visitId)
            .single();

          if (patientResult.data && patientResult.data.visits && patientResult.data.visits.length > 0) {
            // Get the most recent visit
            const mostRecentVisit = patientResult.data.visits.sort((a, b) =>
              new Date(b.admission_date) - new Date(a.admission_date)
            )[0];

            visit = {
              ...mostRecentVisit,
              patients: patientResult.data
            };
            visitError = null;
          } else {
            visitError = patientResult.error || { message: 'No visits found for this patient' };
          }
        }
      }

      if (visitError) {
        console.error('❌ Error fetching visit:', visitError);
        throw visitError;
      }

      console.log('✅ Visit data fetched:', visit);

      // Use the actual visit ID (UUID) for related queries
      const actualVisitId = visit?.id;
      console.log('✅ Using actual visit ID for queries:', actualVisitId);

      // Fetch lab orders for this visit
      let labOrders = [];
      if (actualVisitId) {
        const { data: labData, error: labError } = await supabase
          .from('visit_labs')
          .select(`
            *,
            lab:lab_id (
              name,
              CGHS_code,
              NABH_rates_in_rupee
            )
          `)
          .eq('visit_id', actualVisitId);

        if (labError) {
          console.error('❌ Error fetching lab orders:', labError);
        } else {
          labOrders = labData || [];
        }
      }

      // Fetch radiology orders for this visit
      let radiologyOrders = [];
      if (actualVisitId) {
        const { data: radioData, error: radioError } = await supabase
          .from('visit_radiology')
          .select(`
            *,
            radiology:radiology_id (
              name,
              code,
              cost
            )
          `)
          .eq('visit_id', actualVisitId);

        if (radioError) {
          console.error('❌ Error fetching radiology orders:', radioError);
        } else {
          radiologyOrders = radioData || [];
        }
      }

      // Fetch pharmacy orders for this visit
      let pharmacyOrders = [];
      if (actualVisitId) {
        const { data: pharmaData, error: pharmaError } = await supabase
          .from('visit_medications')
          .select(`
            *,
            medications:medication_id (
              name,
              price
            )
          `)
          .eq('visit_id', actualVisitId);

        if (pharmaError) {
          console.error('❌ Error fetching pharmacy orders:', pharmaError);
        } else {
          pharmacyOrders = pharmaData || [];
        }
      }

      return {
        visit,
        labOrders,
        radiologyOrders,
        pharmacyOrders
      };
    },
    enabled: !!visitId
  });

  // Process the fetched data
  useEffect(() => {
    if (visitData?.visit) {
      console.log('🔄 Processing visit data:', visitData);
      const visit = visitData.visit;
      const patient = visit.patients;

      console.log('👤 Patient data:', patient);
      console.log('🏥 Visit data:', visit);
      console.log('🔬 Lab orders:', visitData.labOrders);
      console.log('📸 Radiology orders:', visitData.radiologyOrders);
      console.log('💊 Pharmacy orders:', visitData.pharmacyOrders);

      // Calculate total amount from all services
      const labTotal = visitData.labOrders.reduce((sum, order) => sum + (order.lab?.NABH_rates_in_rupee || 0), 0);
      const radioTotal = visitData.radiologyOrders.reduce((sum, order) => sum + (order.radiology?.cost || 0), 0);
      const pharmaTotal = visitData.pharmacyOrders.reduce((sum, order) => sum + (order.medications?.price || 0), 0);
      const totalAmount = labTotal + radioTotal + pharmaTotal + 100; // Add registration fee

      console.log('💰 Calculated totals - Lab:', labTotal, 'Radio:', radioTotal, 'Pharma:', pharmaTotal, 'Total:', totalAmount);

      const processedData = {
        claimId: visit.visit_id || visitId || 'N/A',
        billNo: `BL${visit.visit_id || visitId || 'N/A'}`,
        registrationNo: patient?.patients_id || 'N/A',
        patientName: patient?.name || 'Unknown Patient',
        age: patient?.age ? `${patient.age}Y` : 'N/A',
        sex: patient?.gender || 'N/A',
        address: patient?.address || 'N/A',
        contactNo: patient?.phone || 'NOT AVAILABLE',
        bedCategory: visit.bed_category || 'NOT AVAILABLE',
        unitName: visit.unit_name || 'NOT AVAILABLE',
        dateOfAdmission: visit.admission_date ? format(new Date(visit.admission_date), 'dd/MM/yyyy') : 'N/A',
        dateOfDischarge: visit.discharge_date ? format(new Date(visit.discharge_date), 'dd/MM/yyyy') : 'N/A',
        primaryConsultant: visit.consulting_doctor || visit.doctor_name || 'N/A',
        totalAmount: totalAmount,
        amountInWords: convertNumberToWords(totalAmount)
      };

      console.log('📋 Final processed patient data:', processedData);
      setPatientData(processedData);
    }
  }, [visitData, visitId]);

  // Function to convert number to words (simple implementation)
  const convertNumberToWords = (amount) => {
    if (amount === 0) return 'Zero Only';
    if (amount < 1000) return `${amount} Only`;
    if (amount < 100000) return `${Math.floor(amount/1000)} Thousand ${amount%1000} Only`;
    return `${Math.floor(amount/100000)} Lakh ${Math.floor((amount%100000)/1000)} Thousand ${amount%1000} Only`;
  };

  // Process fetched data into service categories
  const serviceData = {
    roomTariff: visitData?.visit ? [
      {
        item: visitData.visit.room_type || 'General Ward',
        dateTime: `${visitData.visit.admission_date ? format(new Date(visitData.visit.admission_date), 'dd/MM/yyyy') : ''} - ${visitData.visit.discharge_date ? format(new Date(visitData.visit.discharge_date), 'dd/MM/yyyy') : ''}`,
        qty: visitData.visit.room_days || 1,
        rate: visitData.visit.room_charges || 0
      }
    ] : [],
    services: [
      { item: 'Registration Charges', dateTime: visitData?.visit?.admission_date ? format(new Date(visitData.visit.admission_date), 'dd/MM/yyyy') : '', qty: 1, rate: 100 }
    ],
    laboratory: visitData?.labOrders?.map((lab, index) => ({
      item: lab.lab?.name || 'Lab Test',
      dateTime: lab.ordered_date ? format(new Date(lab.ordered_date), 'dd/MM/yyyy HH:mm:ss') : '',
      qty: 1,
      rate: lab.lab?.NABH_rates_in_rupee || 0
    })) || [],
    radiology: visitData?.radiologyOrders?.map((radio, index) => ({
      item: radio.radiology?.name || 'Radiology Test',
      dateTime: radio.ordered_date ? format(new Date(radio.ordered_date), 'dd/MM/yyyy HH:mm:ss') : '',
      qty: 1,
      rate: radio.radiology?.cost || 0
    })) || [],
    pharmacy: visitData?.pharmacyOrders?.map((med, index) => ({
      item: med.medications?.name || 'Medication',
      dateTime: med.prescribed_date ? format(new Date(med.prescribed_date), 'dd/MM/yyyy HH:mm:ss') : '',
      qty: med.quantity || 1,
      rate: med.medications?.price || 0
    })) || [],
    totalAmount: patientData?.totalAmount || 0,
    discount: 0,
    amountPaid: 0,
    balance: patientData?.totalAmount || 0
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading patient details: {error.message}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No patient data found for this visit.</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={!patientData}
              className={`px-4 py-2 text-white text-sm rounded flex items-center gap-2 ${
                patientData
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Printer className="h-4 w-4" />
              {patientData ? 'Print Detailed Invoice' : 'Loading...'}
            </button>
            <button
              onClick={handleExcelExport}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Generate Excel Report
            </button>
          </div>
        </div>

        {/* Invoice Document */}
        <div ref={printRef} className="border border-gray-400 bg-white">
          {/* Header */}
          <div className="text-center border-b border-gray-400 py-3">
            <h1 className="text-lg font-bold">Final Bill</h1>
            <h2 className="text-base font-semibold">Private</h2>
            <h3 className="text-sm">CLAIM ID: {patientData.claimId}</h3>
          </div>

          {/* Patient Information */}
          <div className="border-b border-gray-400">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 w-1/4 border-r border-gray-300">BILL NO:</td>
                  <td className="p-2 w-1/4 border-r border-gray-300">{patientData.billNo}</td>
                  <td className="p-2 w-1/2 text-right font-semibold">Details:</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">REGISTRATION NO:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.registrationNo}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">NAME OF PATIENT:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.patientName}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">AGE:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.age}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">SEX:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.sex}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">ADDRESS:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.address}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">DESIGNATION:</td>
                  <td className="p-2 border-r border-gray-300">-</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">CONTACT NO:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.contactNo}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">BED CATEGORY:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.bedCategory}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">UNITS NAME:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.unitName}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">DATE OF ADMISSION:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.dateOfAdmission}</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="font-semibold p-2 border-r border-gray-300">DATE OF DISCHARGE:</td>
                  <td className="p-2 border-r border-gray-300">{patientData.dateOfDischarge}</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="font-semibold p-2 border-r border-gray-300">Primary Consultant:</td>
                  <td className="p-2 border-r border-gray-300" colSpan={2}>{patientData.primaryConsultant}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Services Tables */}

          {/* Service Categories Headers */}
          <table className="w-full border-collapse border border-gray-400 text-xs mb-0">
            <thead>
              <tr>
                <th className="border border-gray-400 p-1 bg-gray-100 font-bold text-center w-12">SR.NO.</th>
                <th className="border border-gray-400 p-1 bg-gray-100 font-bold text-center">ITEM</th>
                <th className="border border-gray-400 p-1 bg-gray-100 font-bold text-center w-32">Date & Time</th>
                <th className="border border-gray-400 p-1 bg-gray-100 font-bold text-center w-16">QTY/DAYS</th>
                <th className="border border-gray-400 p-1 bg-gray-100 font-bold text-center w-24">CGHS NABH RATE</th>
              </tr>
            </thead>
          </table>

          {/* ROOM TARIFF */}
          <div className="mb-0">
            <div className="bg-gray-200 border border-gray-400 border-t-0 p-1">
              <strong className="text-xs">ROOM TARIFF</strong>
            </div>
            <table className="w-full border-collapse border border-gray-400 border-t-0 text-xs">
              <tbody>
                {serviceData.roomTariff.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-1 text-center w-12">{index + 1}</td>
                    <td className="border border-gray-400 p-1">{item.item}</td>
                    <td className="border border-gray-400 p-1 text-center w-32">{item.dateTime}</td>
                    <td className="border border-gray-400 p-1 text-center w-16">{item.qty}</td>
                    <td className="border border-gray-400 p-1 text-center w-24">{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SERVICES */}
          <div className="mb-0">
            <div className="bg-gray-200 border border-gray-400 border-t-0 p-1">
              <strong className="text-xs">SERVICES</strong>
            </div>
            <table className="w-full border-collapse border border-gray-400 border-t-0 text-xs">
              <tbody>
                {serviceData.services.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-1 text-center w-12">{index + 1}</td>
                    <td className="border border-gray-400 p-1">{item.item}</td>
                    <td className="border border-gray-400 p-1 text-center w-32">{item.dateTime}</td>
                    <td className="border border-gray-400 p-1 text-center w-16">{item.qty}</td>
                    <td className="border border-gray-400 p-1 text-center w-24">{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LABORATORY */}
          <div className="mb-0">
            <div className="bg-gray-200 border border-gray-400 border-t-0 p-1 flex justify-between items-center">
              <strong className="text-xs">LABORATORY</strong>
              <div className="flex gap-1">
                <span className="text-xs bg-green-100 px-1">📊</span>
                <span className="text-xs bg-blue-100 px-1">🖨️</span>
                <span className="text-xs bg-red-100 px-1">📋</span>
              </div>
            </div>
            <table className="w-full border-collapse border border-gray-400 border-t-0 text-xs">
              <tbody>
                {serviceData.laboratory.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-1 text-center w-12">{index + 1}</td>
                    <td className="border border-gray-400 p-1">{item.item}</td>
                    <td className="border border-gray-400 p-1 text-center w-32">{item.dateTime}</td>
                    <td className="border border-gray-400 p-1 text-center w-16">{item.qty}</td>
                    <td className="border border-gray-400 p-1 text-center w-24">{item.rate}</td>
                  </tr>
                ))}
                {serviceData.laboratory.length === 0 && (
                  <tr>
                    <td className="border border-gray-400 p-1 text-center" colSpan={5}>No laboratory tests ordered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* RADIOLOGY */}
          <div className="mb-4">
            <div className="bg-gray-200 border border-gray-400 border-t-0 p-1 flex justify-between items-center">
              <strong className="text-xs">RADIOLOGY</strong>
              <div className="flex gap-1">
                <span className="text-xs bg-green-100 px-1">📊</span>
                <span className="text-xs bg-blue-100 px-1">🖨️</span>
                <span className="text-xs bg-red-100 px-1">📋</span>
              </div>
            </div>
            <table className="w-full border-collapse border border-gray-400 border-t-0 text-xs">
              <tbody>
                {serviceData.radiology.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 p-1 text-center w-12">{index + 1}</td>
                    <td className="border border-gray-400 p-1">{item.item}</td>
                    <td className="border border-gray-400 p-1 text-center w-32">{item.dateTime}</td>
                    <td className="border border-gray-400 p-1 text-center w-16">{item.qty}</td>
                    <td className="border border-gray-400 p-1 text-center w-24">{item.rate}</td>
                  </tr>
                ))}
                {serviceData.radiology.length === 0 && (
                  <tr>
                    <td className="border border-gray-400 p-1 text-center" colSpan={5}>No radiology tests ordered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PHARMACY */}
          {serviceData.pharmacy.length > 0 && (
            <div className="mb-4">
              <div className="bg-gray-200 border border-gray-400 border-t-0 p-1 flex justify-between items-center">
                <strong className="text-xs">PHARMACY</strong>
                <div className="flex gap-1">
                  <span className="text-xs bg-green-100 px-1">📊</span>
                  <span className="text-xs bg-blue-100 px-1">🖨️</span>
                  <span className="text-xs bg-red-100 px-1">📋</span>
                </div>
              </div>
              <table className="w-full border-collapse border border-gray-400 border-t-0 text-xs">
                <tbody>
                  {serviceData.pharmacy.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-400 p-1 text-center w-12">{index + 1}</td>
                      <td className="border border-gray-400 p-1">{item.item}</td>
                      <td className="border border-gray-400 p-1 text-center w-32">{item.dateTime}</td>
                      <td className="border border-gray-400 p-1 text-center w-16">{item.qty}</td>
                      <td className="border border-gray-400 p-1 text-center w-24">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Amount Summary */}
          <div className="text-center mt-4 mb-4">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-bold text-right">Total Amount</td>
                  <td className="border border-gray-400 p-2 text-center font-bold">{serviceData.totalAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="text-xs mb-6">
            <strong>In Words:</strong> {patientData.amountInWords}
          </div>

          {/* Footer Signatures */}
          <div className="flex justify-between items-end text-xs mt-8 pt-4 border-t border-gray-400">
            <div className="text-center">
              <div className="mb-12"></div>
              <div className="border-t border-gray-400 pt-1">Bill Manager</div>
            </div>
            <div className="text-center">
              <div className="mb-12"></div>
              <div className="border-t border-gray-400 pt-1">Cashier</div>
            </div>
            <div className="text-center">
              <div className="mb-12"></div>
              <div className="border-t border-gray-400 pt-1">Med. Supdt.</div>
            </div>
            <div className="text-center">
              <div className="mb-12"></div>
              <div className="border-t border-gray-400 pt-1">Authorised Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedInvoice;
