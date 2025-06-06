import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { CalendarPlus, Plus, X, Search, Eye } from "lucide-react";
import { PatientRegistration } from "./patient-registration";
import { supabase } from "@/lib/supabase/client";
import { createVisit, getPatientVisits, Visit } from '@/lib/supabase/api/visits';
import { APIError } from '@/lib/utils/error-handler';

export function PatientRegistryList() {
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<{ dr_id: string, name: string }[]>([]);
  const [referringDoctors, setReferringDoctors] = useState<{ dr_id: string, name: string }[]>([]);
  const [diagnosesList, setDiagnosesList] = useState<{ id: string, name: string, diagnosis_id: string }[]>([]);
  const [surgeons, setSurgeons] = useState<{ dr_id: string }[]>([]);
  const [surgeryList, setSurgeryList] = useState<{ dr_id: string, name: string, code?: string, amount?: string }[]>([]);
  const [selectedSurgeonId, setSelectedSurgeonId] = useState("");
  const [latestVisit, setLatestVisit] = useState(null);

  // Fetch patients from Supabase
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctor')
      .select('dr_id, name');
    if (data) setDoctors(data);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchSurgeons = async () => {
      const { data, error } = await supabase
        .from('doctor')
        .select('dr_id')
        .eq('is_surgeon', true);
      if (data) setSurgeons(data);
    };
    fetchSurgeons();
  }, []);

  useEffect(() => {
    const fetchSurgeries = async () => {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .select('id, name, code, amount')
        .order('name');
      if (data) {
        // Transform data to match the expected format
        const surgeryData = data.map(surgery => ({
          dr_id: surgery.id, // Use id as dr_id for compatibility
          name: surgery.name,
          code: surgery.code,
          amount: surgery.amount
        }));
        setSurgeryList(surgeryData);
      }
    };
    fetchSurgeries();
  }, []);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      const { data, error } = await supabase.from('diagnosis').select('id, name, diagnosis_id');
      if (data) setDiagnosesList(data);
    };
    fetchDiagnoses();
  }, []);

  useEffect(() => {
    fetchReferringDoctors();
  }, []);

  const fetchReferringDoctors = async () => {
    const { data, error } = await supabase
      .from('doctor')
      .select('dr_id, name')
      .eq('is_referring', true);
    if (data) setReferringDoctors(data);
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive"
      });
    } else {
      setPatients(data || []);
    }
  };

  // Add new patient
  const handleAddPatient = async (patientData: any) => {
    try {
      console.log("Submitting patient data:", patientData);

      // Clean the data to match database schema
      const cleanedData = {
        ...patientData,
        // Ensure required fields are present
        patient_id: patientData.patient_id,
        unique_id: patientData.unique_id,
        patient_unique_id: patientData.patient_unique_id,
        name: patientData.name,
        age: parseInt(patientData.age),
        gender: patientData.gender,
        registration_date: patientData.registration_date,
        // Optional fields with defaults
        phone: patientData.phone || null,
        address: patientData.address || null,
        insurance_status: patientData.insurance_status || 'Active',
        last_visit_date: patientData.last_visit_date || null,
        date_of_admission: patientData.date_of_admission || null,
        date_of_discharge: patientData.date_of_discharge || null,
        corporate: patientData.corporate || null,
        // Additional fields
        dob: patientData.dob && patientData.dob.trim() !== '' ? patientData.dob : null,
        temp_reg: patientData.temp_reg || false,
        consultant_own: patientData.consultant_own || false,
        photo_url: patientData.photo_url instanceof File ? null : patientData.photo_url,
        referral_letter_url: patientData.referral_letter_url instanceof File ? null : patientData.referral_letter_url,
      };
      
      console.log("Cleaned data for database:", cleanedData);
      
      const { data, error } = await supabase
        .from('patients')
        .insert([cleanedData])
        .select();

      if (error) {
        console.error("Database error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        toast({
          title: "Error",
          description: `Failed to add patient: ${error.message || error.details || 'Unknown database error'}`,
          variant: "destructive"
        });
      } else {
        console.log("Patient added successfully:", data);
        toast({
          title: "Success",
          description: "Patient added successfully"
        });
        fetchPatients();
        setShowAddPatient(false);
      }
    } catch (err) {
      console.error("Error adding patient:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding the patient",
        variant: "destructive"
      });
    }
  };

  // Update patient
  const handleUpdatePatient = async (id: string, patientData: any) => {
    const { error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Patient updated successfully"
      });
      fetchPatients();
    }
  };

  // Delete patient
  const handleDeletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Patient deleted successfully"
      });
      fetchPatients();
    }
  };

  // States for surgery selection
  const [showSurgerySelector, setShowSurgerySelector] = useState(false);
  const [surgerySearchTerm, setSurgerySearchTerm] = useState("");
  const [selectedSurgeries, setSelectedSurgeries] = useState<string[]>([]);
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null);
  const [surgeryDetails, setSurgeryDetails] = useState({
    packageAmount: "",
    category: "",
    authorized: false,
    surgeon: "",
    anaesthetist: "",
    anaesthesiaType: "",
    otNotes: ""
  });

  // States for diagnosis selection
  const [showDiagnosisSelector, setShowDiagnosisSelector] = useState(false);
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState("");
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);

  const [visitForm, setVisitForm] = useState({
    patientId: "",
    patientName: "",
    visitDate: new Date().toISOString().split('T')[0],
    visitType: "",
    visitReason: "",
    referringDoctor: "",
    appointmentWith: "",
    claim_id: "",
    relation_with_employee: "",
    status: ""
  });

  // Filter surgeries based on search term
  const filteredSurgeries = surgeryList.filter(surgery =>
    surgery.name && surgery.name.toLowerCase().includes(surgerySearchTerm.toLowerCase())
  );

  // Filter diagnoses based on search term
  const filteredDiagnoses = diagnosesList.filter(diagnosis =>
    diagnosis.name.toLowerCase().includes(diagnosisSearchTerm.toLowerCase()) ||
    (diagnosis.diagnosis_id || '').toLowerCase().includes(diagnosisSearchTerm.toLowerCase())
  );

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    emergencyContactName: "",
    emergencyContactMobile: "",
    secondEmergencyContactName: "",
    secondEmergencyContactMobile: "",
    dob: "",
    photo: null as any,
    passport: "",
    ward: "",
    panchayat: "",
    relationshipManager: "",
    quarter: "",
    pin: "",
    state: "",
    city: "",
    nationality: "Indian",
    mobile: "",
    homePhone: "",
    tempReg: false,
    consultantOwn: false,
    bloodGroup: "",
    spouse: "",
    allergies: "",
    relativePhone: "",
    instructions: "",
    identityType: "",
    email: "",
    fax: "",
    privilegeCard: "",
    billing_link: "",
    referralLetter: null as any,
    diagnosis: "",
    surgery: "",
    approvalStatus: "Pending",
    registrationDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    insuranceStatus: "Active",
    referee: "",
    type: "",
    claim_id: ""
  });

  // Function to add a surgery to the selection
  const addSurgery = (surgery: any) => {
    if (!selectedSurgeries.includes(surgery.dr_id)) {
      setSelectedSurgeries([...selectedSurgeries, surgery.dr_id]);
    }
  };

  // Function to remove a surgery from the selection
  const removeSurgery = (dr_id: string) => {
    setSelectedSurgeries(selectedSurgeries.filter(id => id !== dr_id));
  };

  // Function to add a diagnosis to the selection
  const addDiagnosis = (diagnosis: any) => {
    // Ensure we only add the diagnosis ID (string), not the entire object
    const diagnosisId = typeof diagnosis === 'string' ? diagnosis : diagnosis.diagnosis_id || diagnosis.id;
    if (diagnosisId && !selectedDiagnoses.includes(diagnosisId)) {
      setSelectedDiagnoses([...selectedDiagnoses, diagnosisId]);
    }
  };

  // Function to remove a diagnosis from the selection
  const removeDiagnosis = (diagnosis_id: string) => {
    setSelectedDiagnoses(selectedDiagnoses.filter(d => d !== diagnosis_id));
  };

  // Function to handle opening the visit form for a specific patient
  const handleOpenVisitForm = (patient: any) => {
    setSelectedPatient(patient);
    setVisitForm({
      ...visitForm,
      patientId: patient.id,
      patientName: patient.name,
      visitDate: new Date().toISOString().split('T')[0],
      visitType: "",
      visitReason: "",
      referringDoctor: "",
      appointmentWith: "",
      claim_id: patient.corporate === "ESIC" ? `ESIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : "",
      relation_with_employee: "",
      status: "Active"
    });
    setSelectedSurgeries([]);
    setSelectedDiagnoses([]);
    setShowVisitForm(true);
  };

  // Function to handle visit form submission
  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Find the selected doctor's name
      const selectedDoctor = doctors.find(d => d.dr_id === visitForm.appointmentWith);
      const doctorName = selectedDoctor ? selectedDoctor.name : visitForm.appointmentWith;

      // Generate a unique visit ID
      const visitId = `VISIT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const visitData: Omit<Visit, 'id'> = {
        visit_id: visitId,
        patient_unique_id: selectedPatient.unique_id,
        visit_date: visitForm.visitDate,
        visit_type: visitForm.visitType,
        department: visitForm.visitType, // Also save as department for compatibility
        appointment_with: visitForm.appointmentWith,
        doctor_name: doctorName, // Add doctor_name field
        visit_reason: visitForm.visitReason,
        reason: visitForm.visitReason, // Also save as reason for compatibility
        referring_doctor: visitForm.referringDoctor,
        diagnosis: selectedDiagnoses.map(d => typeof d === 'string' ? d : (d as any)?.diagnosis_id || (d as any)?.id || String(d)),
        surgery: selectedSurgeries,
        claim_id: visitForm.claim_id,
        relation_with_employee: visitForm.relation_with_employee,
        status: visitForm.status,
        created_at: new Date().toISOString()
      };

      const newVisit = await createVisit(visitData);
      console.log("Visit registered successfully:", newVisit);

      // Update the patient's last visit date
      await supabase
        .from('patients')
        .update({ last_visit_date: visitForm.visitDate })
        .eq('id', selectedPatient.id);

      toast({
        title: "Success",
        description: "Visit registered successfully"
      });
      setShowVisitForm(false);
    } catch (err) {
      console.error("Error registering visit:", err);
      toast({
        title: "Error",
        description: err instanceof APIError ? err.message : "An unexpected error occurred while registering the visit",
        variant: "destructive"
      });
    }
  };

  // Function to fetch latest visit for a patient
  const fetchLatestVisit = async (patientUniqueId: string) => {
    try {
      const visits = await getPatientVisits(patientUniqueId);
      if (visits.length > 0) {
        setLatestVisit(visits[0]);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching latest visit:", err.message);
      } else {
        console.error("Error fetching latest visit:", err);
      }
    }
  };

  useEffect(() => {
    if (selectedPatient?.unique_id) {
      fetchLatestVisit(selectedPatient.unique_id);
    }
  }, [selectedPatient]);

  // Function to handle opening the surgery edit form
  const handleSurgerySelect = (surgery: any) => {
    setSelectedSurgery(surgery);
    setSurgeryDetails({
      packageAmount: "",
      category: surgery.category,
      authorized: false,
      surgeon: "",
      anaesthetist: "",
      anaesthesiaType: "",
      otNotes: ""
    });
  };

  // Function to save the surgery with details to the selected surgeries
  const saveSurgeryWithDetails = () => {
    if (!selectedSurgery) return;

    const completeSurgery = {
      ...selectedSurgery,
      packageAmount: surgeryDetails.packageAmount,
      category: surgeryDetails.category,
      authorized: surgeryDetails.authorized,
      surgeon: surgeryDetails.surgeon,
      anaesthetist: surgeryDetails.anaesthetist,
      anaesthesiaType: surgeryDetails.anaesthesiaType,
      otNotes: surgeryDetails.otNotes
    };

    addSurgery(completeSurgery);
    setSelectedSurgery(null);
    setShowSurgerySelector(false);
  };

  const surgeryData = selectedSurgeries.map((dr_id, index) => ({
    dr_id,
    surgeon_id: selectedSurgeonId
  }));

  return (
    <div className="overflow-x-auto max-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        {/* <h2 className="text-lg font-semibold">Patient Dashboard</h2> */}
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={() => setShowAddPatient(true)}>
          + New Patient Registration
        </button>
      </div>
      {/* <div className="invoice-header">
        CLAIM ID - {latestVisit?.claim_id || 'No Claim ID'}
      </div> */}
      <table className="min-w-full text-xs border">
        <thead className="bg-blue-50">
          <tr>
            <th className="p-2 border">Unique ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Age/Gender</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">DOB</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Registration</th>
            <th className="p-2 border">Insurance</th>
            {/* <th className="p-2 border">Referee</th> */}
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="p-2 border">{patient.unique_id}</td>
              <td className="p-2 border">
                {patient.name}
              </td>
              <td className="p-2 border">{patient.age} / {patient.gender}</td>
              <td className="p-2 border">{patient.phone}</td>
              <td className="p-2 border">{patient.dob}</td>
              <td className="p-2 border">{patient.approval_status}</td>
              <td className="p-2 border">{new Date(patient.registration_date).toLocaleDateString()}</td>
              <td className="p-2 border">{patient.insurance_status}</td>
              {/* <td className="p-2 border">{patient.referee}</td> */}
              <td className="p-2 border text-center">
                <button
                  className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                  onClick={() => window.location.href = `/patient-details/${patient.id}`}
                  title="View Patient Details"
                >
                  <Eye size={18} />
                </button>

                <button
                  className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 ml-2"
                  onClick={() => handleOpenVisitForm(patient)}
                  title="Register New Visit"
                >
                  <CalendarPlus size={18} />
                </button>

                <button
                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 ml-2"
                  onClick={() => handleDeletePatient(patient.id)}
                  title="Delete Patient"
                >
                  <X size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Patient Registration Form */}
      {showAddPatient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 overflow-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-full min-w-[1200px] w-auto border border-blue-100" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <PatientRegistration
              onClose={() => setShowAddPatient(false)}
              onSubmit={handleAddPatient}
            />
          </div>
        </div>
      )}

      {/* Visit Registration Form Popup */}
      {showVisitForm && selectedPatient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 overflow-auto">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-full w-[800px] border border-blue-100" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="text-2xl font-bold mb-1 text-blue-900">Register New Visit</h3>
            <p className="mb-4 text-gray-500">Patient: {selectedPatient.name} ({selectedPatient.id}) {selectedPatient.type}</p>

            <form onSubmit={handleVisitSubmit}>
              <div className="border rounded-xl p-6 mb-4 bg-blue-50/40">
                <h3 className="font-semibold mb-4 text-blue-800 text-lg bg-blue-100/60 rounded px-2 py-2 shadow-sm">Visit Details</h3>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className="block mb-1">Visit Date *</label>
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      required
                      value={visitForm.visitDate}
                      onChange={e => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Visit Type *</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      required
                      value={visitForm.visitType}
                      onChange={e => setVisitForm({ ...visitForm, visitType: e.target.value })}
                    >
                      <option value="">Select Visit Type</option>
                      <option value="IPD">IPD (In-Patient Department)</option>
                      <option value="OPD">OPD (Out-Patient Department)</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Regular Checkup">Regular Checkup</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Specialist Consultation">Specialist Consultation</option>
                      <option value="Procedure">Procedure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Appointment With *</label>
                    <select
                      value={visitForm.appointmentWith}
                      onChange={e => setVisitForm({ ...visitForm, appointmentWith: e.target.value })}
                      className="border rounded-lg px-3 py-2 w-full"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor, index) => (
                        <option key={`doctor-${doctor.dr_id}-${index}`} value={doctor.dr_id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Reason for Visit *</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      required
                      placeholder="Reason for visit"
                      value={visitForm.visitReason}
                      onChange={e => setVisitForm({ ...visitForm, visitReason: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Relation with Employee</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      value={visitForm.relation_with_employee}
                      onChange={e => setVisitForm({ ...visitForm, relation_with_employee: e.target.value })}
                      required
                    >
                      <option value="">Select Relation</option>
                      <option value="Self">Self</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Status</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      value={visitForm.status}
                      onChange={e => setVisitForm({ ...visitForm, status: e.target.value })}
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="General">General</option>
                      <option value="Shared">Shared</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-6 mb-4 bg-blue-50/40">
                <h3 className="font-semibold mb-4 text-blue-800 text-lg bg-blue-100/60 rounded px-2 py-2 shadow-sm">Medical Information</h3>

                <div className="grid md:grid-cols-1 gap-x-6 gap-y-6">
                  {/* Diagnosis Selection */}
                  <div>
                    <label className="block mb-1 font-medium">Diagnosis *</label>
                    {/* Display selected diagnoses */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedDiagnoses.map((id, index) => {
                        // Ensure id is a string, not an object
                        const diagnosisId = typeof id === 'string' ? id : (id as any)?.diagnosis_id || (id as any)?.id || String(id);
                        const diag = diagnosesList.find(d => d.id === diagnosisId);
                        return (
                          <div
                            key={`diagnosis-${diagnosisId}-${index}`}
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md"
                          >
                            <span>{diag?.name || diagnosisId}</span>
                            <button
                              type="button"
                              onClick={() => removeDiagnosis(diagnosisId)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition flex items-center justify-between"
                        onClick={() => setShowDiagnosisSelector(true)}
                      >
                        <span className="text-gray-500">Search for a diagnosis...</span>
                        <Search size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Surgery Selection */}
                  <div>
                    <label className="block mb-1 font-medium">Surgery (if applicable)</label>
                    {/* Display selected surgeries */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedSurgeries.map((dr_id, index) => {
                        const surgery = surgeryList.find(s => s.dr_id === dr_id);
                        return (
                          <div
                            key={`surgery-${dr_id}-${index}`}
                            className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md"
                          >
                            <span className="text-sm">{surgery?.name || dr_id}</span>
                            <button
                              type="button"
                              onClick={() => removeSurgery(dr_id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition flex items-center justify-between"
                        onClick={() => setShowSurgerySelector(true)}
                      >
                        <span className="text-gray-500">Search for a surgery...</span>
                        <Search size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Referring Doctor</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      value={visitForm.referringDoctor}
                      onChange={e => setVisitForm({ ...visitForm, referringDoctor: e.target.value })}
                    >
                      <option value="">Select Referring Doctor</option>
                      {referringDoctors.map((doctor, index) => (
                        <option key={`ref-doctor-${doctor.dr_id}-${index}`} value={doctor.dr_id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Claim ID</label>
                    <input
                      type="text"
                      className="border rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-300 transition"
                      placeholder="Enter Claim ID"
                      value={visitForm.claim_id}
                      onChange={e => setVisitForm({ ...visitForm, claim_id: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold transition"
                  onClick={() => setShowVisitForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-bold shadow transition"
                >
                  Register Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Surgery Selection Modal */}
      {showSurgerySelector && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[100]">
          <div className="bg-white p-6 rounded-lg w-[800px] max-h-[90vh] relative">
            {/* Close button */}
            <button
              onClick={() => setShowSurgerySelector(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2">Add Surgery</h2>
            <p className="text-gray-600 mb-6">Search for a surgery to add to this patient's record.</p>

            {/* Search input */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                className="w-full py-3 px-10 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by surgery name, CGHS code, or category..."
                value={surgerySearchTerm}
                onChange={(e) => setSurgerySearchTerm(e.target.value)}
              />
            </div>

            {/* Results list */}
            <div className="border rounded-lg overflow-hidden">
              {filteredSurgeries.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredSurgeries.map((surgery, index) => (
                    <div
                      key={`filtered-surgery-${surgery.dr_id}-${index}`}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-lg font-semibold">{surgery.name}</div>
                        <div className="flex items-center mt-1 gap-2">
                          <span className="text-blue-600">Code: {surgery.code}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-green-600">₹{surgery.amount}</span>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-1 px-4 py-1 text-gray-700 hover:bg-gray-100 rounded-lg"
                        onClick={() => {
                          addSurgery(surgery);
                          setShowSurgerySelector(false);
                        }}
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No surgeries found matching your search.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => setShowSurgerySelector(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Selection Modal */}
      {showDiagnosisSelector && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Diagnosis</h2>
              <button onClick={() => setShowDiagnosisSelector(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Search for a diagnosis to add to this patient's record.</p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search by diagnosis name or code..."
                value={diagnosisSearchTerm}
                onChange={(e) => setDiagnosisSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto flex-1 border rounded-lg">
              {filteredDiagnoses.length > 0 ? (
                <div>
                  {filteredDiagnoses.map((diagnosis, index) => (
                    <div
                      key={`filtered-diagnosis-${diagnosis.id}-${index}`}
                      className="p-3 border-b hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                      onClick={() => {
                        addDiagnosis(diagnosis);
                        setShowDiagnosisSelector(false);
                      }}
                    >
                      <div>
                        <div className="font-medium">{diagnosis.name}</div>
                        <div className="text-sm text-blue-600 mt-1">{String(diagnosis.diagnosis_id || diagnosis.id || '')}</div>
                      </div>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={e => {
                          e.stopPropagation();
                          addDiagnosis(diagnosis);
                          setShowDiagnosisSelector(false);
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No diagnoses found matching your search.</div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDiagnosisSelector(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 