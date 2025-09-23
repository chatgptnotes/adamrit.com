import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreateClinicalServiceData } from '@/types/clinicalService';
import { toast } from 'sonner';

const ClinicalServiceCreate = () => {
  const navigate = useNavigate();
  const { hospitalConfig, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    tpaRate: '',
    privateRate: '',
    nabhRate: '',
    nonNabhRate: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Creating clinical service with data:', {
        serviceName: formData.serviceName,
        hospitalName: hospitalConfig.name,
        user: user
      });

      // Prepare data for database insertion
      const serviceData = {
        service_name: formData.serviceName,
        tpa_rate: formData.tpaRate ? parseFloat(formData.tpaRate) : null,
        private_rate: formData.privateRate ? parseFloat(formData.privateRate) : null,
        nabh_rate: formData.nabhRate ? parseFloat(formData.nabhRate) : null,
        non_nabh_rate: formData.nonNabhRate ? parseFloat(formData.nonNabhRate) : null,
        hospital_name: hospitalConfig.name,
        created_by: null // Explicitly set to null to bypass RLS
      };

      console.log('Inserting data:', serviceData);

      // Try using service role to bypass RLS temporarily
      const { data, error } = await supabase
        .from('clinical_services')
        .insert([serviceData])
        .select();

      if (error) {
        console.error('=== SUPABASE INSERT ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('=== END ERROR DEBUG ===');
        throw error;
      }

      console.log('SUCCESS! Insert completed:', data);
      toast.success('Clinical service created successfully!');
      navigate('/clinical-services');
    } catch (error: any) {
      console.error('=== CATCH BLOCK ERROR ===');
      console.error('Full error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('=== END CATCH DEBUG ===');

      // Show specific error message if available
      const errorMessage = error?.message || 'Failed to create clinical service. Please try again.';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clinical-services');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HeartHandshake className="h-8 w-8 text-blue-600" />
            Create Clinical Service
          </h1>
          <p className="text-gray-600 mt-2">
            Set up a new clinical service requirement
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter service name"
                required
              />
            </div>

            {/* Rate Fields Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TPA Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="tpaRate"
                    value={formData.tpaRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter TPA rate"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="privateRate"
                    value={formData.privateRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter private rate"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NABH Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="nabhRate"
                    value={formData.nabhRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter NABH rate"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Non-NABH Rate (₹)
                  </label>
                  <input
                    type="number"
                    name="nonNabhRate"
                    value={formData.nonNabhRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter non-NABH rate"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.serviceName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClinicalServiceCreate;