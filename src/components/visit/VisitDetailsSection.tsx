import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { supabase } from '@/integrations/supabase/client';

interface VisitDetailsSectionProps {
  visitDate: Date;
  setVisitDate: (date: Date) => void;
  formData: {
    visitType: string;
    appointmentWith: string;
    reasonForVisit: string;
    relationWithEmployee: string;
    status: string;
    patientType?: string;
    wardAllotted?: string;
    roomAllotted?: string;
  };
  handleInputChange: (field: string, value: string) => void;
  existingVisit?: any; // Optional existing visit data for edit mode
}

export const VisitDetailsSection: React.FC<VisitDetailsSectionProps> = ({
  visitDate,
  setVisitDate,
  formData,
  handleInputChange,
  existingVisit
}) => {
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ward and Room Management
  const [wards, setWards] = useState<Array<{ ward_id: string; ward_type: string; maximum_rooms: number }>>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<number[]>([]);
  const [selectedWard, setSelectedWard] = useState<{ ward_id: string; maximum_rooms: number } | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching doctors from hope_surgeons table...');
        
        const { data, error } = await supabase
          .from('hope_surgeons')
          .select('id, name, specialty')
          .order('name');
        
        if (error) {
          console.error('Error fetching doctors:', error);
          setError('Failed to load doctors');
          setDoctors([]);
        } else {
          console.log('Doctors fetched successfully:', data);
          setDoctors(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching doctors:', error);
        setError('Failed to load doctors');
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch wards from room_management table
  useEffect(() => {
    const fetchWards = async () => {
      try {
        setIsLoadingWards(true);
        console.log('Fetching wards from room_management table...');

        const { data, error } = await supabase
          .from('room_management')
          .select('ward_id, ward_type, maximum_rooms')
          .order('ward_type');

        if (error) {
          console.error('Error fetching wards:', error);
          setWards([]);
        } else {
          console.log('Wards fetched successfully:', data);
          setWards(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching wards:', error);
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, []);

  // Update available rooms when ward is selected - fetch occupied rooms and filter them out
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.wardAllotted) {
        const ward = wards.find(w => w.ward_id === formData.wardAllotted);
        if (ward) {
          setSelectedWard({ ward_id: ward.ward_id, maximum_rooms: ward.maximum_rooms });

          try {
            // Fetch all occupied rooms for this ward (where discharge_date is NULL)
            const { data: occupiedVisits, error } = await supabase
              .from('visits')
              .select('room_allotted, id')
              .eq('ward_allotted', formData.wardAllotted)
              .is('discharge_date', null);

            if (error) {
              console.error('Error fetching occupied rooms:', error);
              // If error, show all rooms as fallback
              const rooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
              setAvailableRooms(rooms);
              return;
            }

            // Get list of occupied room numbers
            const occupiedRooms = occupiedVisits
              ?.map(v => parseInt(v.room_allotted))
              .filter(room => !isNaN(room)) || [];

            // If in edit mode, exclude current visit's room from occupied list
            const currentRoomNumber = existingVisit?.room_allotted ? parseInt(existingVisit.room_allotted) : null;
            const filteredOccupiedRooms = currentRoomNumber
              ? occupiedRooms.filter(room => room !== currentRoomNumber)
              : occupiedRooms;

            console.log('Occupied rooms:', filteredOccupiedRooms);
            console.log('Current room (edit mode):', currentRoomNumber);

            // Generate all room numbers and filter out occupied ones
            const allRooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
            const availableRoomsList = allRooms.filter(room => !filteredOccupiedRooms.includes(room));

            console.log('Available rooms:', availableRoomsList);
            setAvailableRooms(availableRoomsList);
          } catch (error) {
            console.error('Exception while fetching occupied rooms:', error);
            // If exception, show all rooms as fallback
            const rooms = Array.from({ length: ward.maximum_rooms }, (_, i) => i + 1);
            setAvailableRooms(rooms);
          }
        }
      } else {
        setSelectedWard(null);
        setAvailableRooms([]);
      }
    };

    fetchAvailableRooms();
  }, [formData.wardAllotted, wards, existingVisit]);

  // Check room availability
  const checkAvailability = async () => {
    if (!formData.wardAllotted) {
      alert('Please select a ward first');
      return;
    }

    try {
      // Fetch all occupied rooms for this ward
      const { data, error } = await supabase
        .from('visits')
        .select('room_allotted')
        .eq('ward_allotted', formData.wardAllotted)
        .not('room_allotted', 'is', null);

      if (error) {
        console.error('Error checking availability:', error);
        alert('Failed to check availability');
        return;
      }

      const occupiedRooms = data.map(v => parseInt(v.room_allotted));
      const totalRooms = selectedWard?.maximum_rooms || 0;
      const allRooms = Array.from({ length: totalRooms }, (_, i) => i + 1);
      const available = allRooms.filter(room => !occupiedRooms.includes(room));

      alert(`Available rooms: ${available.length}\nOccupied rooms: ${occupiedRooms.length}\nTotal rooms: ${totalRooms}\n\nAvailable: ${available.join(', ')}`);
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Failed to check availability');
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setVisitDate(date);
    }
  };

  // Show ward/room fields only for IPD or Emergency patients
  const showWardRoomFields = formData.patientType === 'IPD' ||
                             formData.patientType === 'IPD (Inpatient)' ||
                             formData.patientType === 'Emergency';

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Visit Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-2">
          <EnhancedDatePicker
            label="Visit Date"
            value={visitDate}
            onChange={handleDateChange}
            placeholder="Select visit date"
            isDOB={false}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientType" className="text-sm font-medium">
            Patient Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.patientType || ''} onValueChange={(value) => handleInputChange('patientType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Patient Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPD">OPD (Outpatient)</SelectItem>
              <SelectItem value="IPD">IPD (Inpatient)</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2 */}
        <div className="space-y-2">
          <Label htmlFor="visitType" className="text-sm font-medium">
            Visit Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.visitType} onValueChange={(value) => handleInputChange('visitType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Visit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
              <SelectItem value="patient-admission">Patient Admission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentWith" className="text-sm font-medium">
            Appointment With <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.appointmentWith} 
            onValueChange={(value) => handleInputChange('appointmentWith', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  isLoading 
                    ? "Loading doctors..." 
                    : error 
                    ? "Error loading doctors"
                    : doctors.length === 0 
                    ? "No doctors available" 
                    : "Select Doctor"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {/* If current value doesn't match any doctor, keep it as an option */}
              {formData.appointmentWith &&
               formData.appointmentWith !== 'none' &&
               !doctors.some(d => d.name === formData.appointmentWith) && (
                <SelectItem value={formData.appointmentWith}>
                  {formData.appointmentWith} (Current)
                </SelectItem>
              )}
              {!isLoading && !error && doctors.length > 0 && doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.name}>
                  {doctor.name}{doctor.specialty ? ` (${doctor.specialty})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!isLoading && !error && doctors.length === 0 && (
            <p className="text-sm text-gray-500">No doctors found in the database</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reasonForVisit" className="text-sm font-medium">
            Reason for Visit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reasonForVisit"
            placeholder="Reason for visit"
            value={formData.reasonForVisit}
            onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
          />
        </div>

        {/* Row 3 */}
        <div className="space-y-2">
          <Label htmlFor="relationWithEmployee" className="text-sm font-medium">
            Relation with Employee
          </Label>
          <Select value={formData.relationWithEmployee} onValueChange={(value) => handleInputChange('relationWithEmployee', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Relation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Self</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="dependent">Dependent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 4 - Ward and Room Allocation (Only for IPD/Emergency) */}
        {showWardRoomFields && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wardAllotted" className="text-sm font-medium">
                  Ward Allotted <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={checkAvailability}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Check Availability
                </button>
              </div>
              <Select
                value={formData.wardAllotted || ''}
                onValueChange={(value) => {
                  handleInputChange('wardAllotted', value);
                  // Reset room when ward changes
                  handleInputChange('roomAllotted', '');
                }}
                disabled={isLoadingWards}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingWards
                        ? "Loading wards..."
                        : wards.length === 0
                        ? "No wards available"
                        : "Select Ward"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward.ward_id} value={ward.ward_id}>
                      {ward.ward_type} (Max: {ward.maximum_rooms} rooms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomAllotted" className="text-sm font-medium">
                Room Allotted <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roomAllotted || ''}
                onValueChange={(value) => handleInputChange('roomAllotted', value)}
                disabled={!formData.wardAllotted || availableRooms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((roomNum) => (
                    <SelectItem key={roomNum} value={roomNum.toString()}>
                      Room {roomNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.wardAllotted && availableRooms.length === 0 && (
                <p className="text-xs text-gray-500">No rooms available in selected ward</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
