import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useComplications } from "@/hooks/useComplications";

// Define the updated interface for diagnosis submission
interface DiagnosisFormData {
  name: string;
  complication1: string;
  complication2: string;
  complication3: string;
  complication4: string;
}

interface AddDiagnosisFormProps {
  onCancel: () => void;
  onSubmit: (name: string, formData?: DiagnosisFormData) => void;
  initialData?: DiagnosisFormData;
}

export default function AddDiagnosisForm({ 
  onCancel, 
  onSubmit,
  initialData
}: AddDiagnosisFormProps) {
  const { complications, loading, error } = useComplications();
  const [formData, setFormData] = useState<DiagnosisFormData>({
    name: "",
    complication1: "none",
    complication2: "none",
    complication3: "none",
    complication4: "none"
  });

  function normalizeComplication(value?: string) {
    if (!value || value.toLowerCase() === "none") return "none";
    const found = complications.find(
      c => c.id === value
    );
    return found ? found.id : "none";
  }

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        complication1: normalizeComplication(initialData.complication1),
        complication2: normalizeComplication(initialData.complication2),
        complication3: normalizeComplication(initialData.complication3),
        complication4: normalizeComplication(initialData.complication4),
      });
    }
  }, [initialData, complications]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData.name.trim(), formData);
    }
  }

  // Helper function to update form state
  const updateFormData = (field: keyof DiagnosisFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  function getComplicationName(id) {
    const comp = complications.find(c => c.id === id);
    return comp ? comp.name : '';
  }

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">Loading complications...</div>
    </div>;
  }

  if (error) {
    return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-red-500">Error loading complications: {error}</div>
    </div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Diagnosis</h3>
        
        <div className="space-y-4">
          {/* Diagnosis Name Field */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="diagnosisName" className="font-medium">
              Diagnosis Name <span className="text-red-500">*</span>
            </Label>
            <input
              id="diagnosisName"
              className="border rounded px-2 py-1 w-full"
              placeholder="Enter diagnosis name"
              value={formData.name}
              onChange={e => updateFormData("name", e.target.value)}
              required
            />
          </div>

          {/* Complications Section Header */}
          <div className="pt-2 border-t">
            <h4 className="text-md font-medium mb-2">Common Complications</h4>
            <p className="text-sm text-gray-500 mb-3">
              Select up to 4 common complications associated with this diagnosis
            </p>
          </div>
          
          {/* Complication 1 */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="complication1" className="font-medium">
              Complication 1
            </Label>
            <Select 
              value={formData.complication1} 
              onValueChange={(value) => updateFormData("complication1", value)}
            >
              <SelectTrigger id="complication1">
                <SelectValue placeholder="Select a complication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {complications.map((complication) => (
                  <SelectItem key={complication.id} value={complication.id}>
                    {complication.name} ({complication.risk_level} risk)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Complication 2 */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="complication2" className="font-medium">
              Complication 2
            </Label>
            <Select 
              value={formData.complication2} 
              onValueChange={(value) => updateFormData("complication2", value)}
            >
              <SelectTrigger id="complication2">
                <SelectValue placeholder="Select a complication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {complications.map((complication) => (
                  <SelectItem key={complication.id} value={complication.id}>
                    {complication.name} ({complication.risk_level} risk)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Complication 3 */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="complication3" className="font-medium">
              Complication 3
            </Label>
            <Select 
              value={formData.complication3} 
              onValueChange={(value) => updateFormData("complication3", value)}
            >
              <SelectTrigger id="complication3">
                <SelectValue placeholder="Select a complication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {complications.map((complication) => (
                  <SelectItem key={complication.id} value={complication.id}>
                    {complication.name} ({complication.risk_level} risk)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Complication 4 */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="complication4" className="font-medium">
              Complication 4
            </Label>
            <Select 
              value={formData.complication4} 
              onValueChange={(value) => updateFormData("complication4", value)}
            >
              <SelectTrigger id="complication4">
                <SelectValue placeholder="Select a complication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {complications.map((complication) => (
                  <SelectItem key={complication.id} value={complication.id}>
                    {complication.name} ({complication.risk_level} risk)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="px-3 py-1 rounded border" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
} 