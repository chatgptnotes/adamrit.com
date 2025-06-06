"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { createVisit } from "@/lib/supabase/api/visits"
import { toast } from "@/components/ui/use-toast"

export default function RegisterNewOPDVisit() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get patient details from URL parameters
  const patientId = searchParams?.get("patientId") || ""
  const patientName = searchParams?.get("name") || ""
  const patientUniqueId = searchParams?.get("uniqueId") || ""
  
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    visitType: "OPD", // Default to OPD
    appointmentWith: "",
    visitReason: "",
    diagnosis: [] as string[],
    surgery: [] as string[],
    referringDoctor: "",
    claim_id: "",
    relation_with_employee: "",
    status: "Active"
  })
  
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Generate a unique visit ID
      const visitId = `VISIT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const visitData = {
        visit_id: visitId,
        patient_unique_id: patientUniqueId,
        visit_date: formData.visitDate,
        visit_type: formData.visitType,
        department: formData.visitType, // Also save as department for compatibility
        appointment_with: formData.appointmentWith,
        doctor_name: formData.appointmentWith, // For now, use the same value
        visit_reason: formData.visitReason,
        reason: formData.visitReason, // Also save as reason for compatibility
        referring_doctor: formData.referringDoctor,
        diagnosis: formData.diagnosis,
        surgery: formData.surgery,
        claim_id: formData.claim_id,
        relation_with_employee: formData.relation_with_employee,
        status: formData.status,
        created_at: new Date().toISOString()
      };

      const newVisit = await createVisit(visitData);
      console.log("OPD visit registered successfully:", newVisit);

      toast({
        title: "Success",
        description: "OPD visit registered successfully"
      });
    
    // Add a small delay to ensure the database has been updated before redirecting
    setTimeout(() => {
      router.push("/?tab=today-opd-dashboard")
    }, 500);
    } catch (err) {
      console.error("Error registering OPD visit:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred while registering the visit",
        variant: "destructive"
      });
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-green-800 mb-2">Register New OPD Visit</h1>
      <p className="text-gray-600 mb-6">Patient: {patientName} ({patientId})</p>
      
      <form onSubmit={handleSubmit}>
        {/* Visit Details Section */}
        <div className="mb-8">
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-xl text-green-700 font-bold">Visit Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <Input 
                type="date"
                value={formData.visitDate}
                onChange={(e) => handleChange("visitDate", e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">
                Visit Type <span className="text-red-500">*</span>
              </label>
              <Input 
                value="OPD"
                disabled
                className="w-full bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">
                Appointment With <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="Doctor's name"
                value={formData.appointmentWith}
                onChange={(e) => handleChange("appointmentWith", e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">
                Referring Doctor
              </label>
              <Input 
                placeholder="Referring doctor's name"
                value={formData.referringDoctor}
                onChange={(e) => handleChange("referringDoctor", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Reason and Diagnosis Section */}
        <div className="mb-8">
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-xl text-green-700 font-bold">Reason and Diagnosis</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <Textarea 
                placeholder="Enter the reason for visit"
                value={formData.visitReason}
                onChange={(e) => handleChange("visitReason", e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Details Section */}
        <div className="mb-8">
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-xl text-green-700 font-bold">Additional Details</h2>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium">
                Claim ID
              </label>
              <Input 
                placeholder="Enter claim ID"
                value={formData.claim_id}
                onChange={(e) => handleChange("claim_id", e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">
                Relation with Employee
              </label>
              <Input 
                placeholder="Enter relation"
                value={formData.relation_with_employee}
                onChange={(e) => handleChange("relation_with_employee", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Register Visit
          </Button>
        </div>
      </form>
    </div>
  )
} 