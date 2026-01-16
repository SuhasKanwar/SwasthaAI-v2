"use client";

import { useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Doctor {
  id: string;
  email: string;
  isVerified: boolean;
  profile?: {
    displayName: string;
    profilePicture?: string;
    specialty: string;
    bio: string;
    yearsOfExperience: number;
    degree: string;
    college: string;
    consultationFees: number;
    languagesSpoken: string[];
    avgRating?: number;
    ratingCount?: number;
    reviewsCount?: number;
    expertiseAreas?: string[];
    certifications?: string[];
    medicalRegistrationNumber?: string;
    patientsServed?: number;
    payOnConsultation?: boolean;
    providesOnlineConsultation?: boolean;
    genderPreference?: string;
  };
  clinics?: Clinic[];
  reviews?: Review[];
  faqs?: FAQ[];
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  googleMapsLink?: string;
  availabilityDates: string[];
  availabilitySlots: Record<string, string[]>;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  patientName: string;
  date: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface SearchFilters {
  specialty: string;
  name: string;
  languages: string;
  lat?: number;
  lng?: number;
  page: number;
  limit: number;
}

interface AppointmentData {
  doctorId: string;
  clinicId?: string;
  appointmentDate: string;
  appointmentSlot: string;
  symptomsEntered?: string;
  patientName: string;
  patientContact: string;
  addressType: 'saved' | 'new';
  payOnConsultation: boolean;
}

interface UserAppointment {
  id: string;
  doctorId: string;
  // Fields from the provided API response
  doctorName?: string;
  doctorPhotoUrl?: string;
  specialization?: string;
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
  googleMapsLink?: string;
  appointmentDate: string;
  appointmentSlot: string;
  symptomsEntered?: string;
  patientName: string;
  patientContact: string;
  appointmentStatus: string; // Changed from 'status'
  payOnConsultation: boolean;
  createdAt: string;
  updatedAt: string;
  // Add any other relevant fields from the response you want to use
  paymentStatus?: string;
  confirmationMessage?: string;
  rescheduleAvailable?: boolean;
  cancelAvailable?: boolean;
}

export default function BookAppointmentsPage() {
  const { isLoggedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState<'search' | 'profile' | 'booking'>('search');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    specialty: '',
    name: '',
    languages: '',
    page: 1,
    limit: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    doctorId: '',
    appointmentDate: '',
    appointmentSlot: '',
    patientName: '',
    patientContact: '',
    addressType: 'saved',
    payOnConsultation: false
  });
  
  // Modal state
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [userAppointments, setUserAppointments] = useState<UserAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);  // Get user appointments
  const getUserAppointments = async () => {
    console.log('[Modal] getUserAppointments: Entry point. isLoggedIn:', isLoggedIn); // Log 1
    if (!isLoggedIn) {
      console.log('[Modal] getUserAppointments: Exiting because isLoggedIn is false.'); // Log 2
      return;
    }
    
    console.log('[Modal] getUserAppointments: Setting isLoadingAppointments to true.'); // Log 3
    setIsLoadingAppointments(true);
    try {
      console.log('[Modal] getUserAppointments: Inside try block. About to call API. Base URL:', userApi.defaults.baseURL); // Log 4
      
      const response = await userApi.get('/api/appointments'); // THE CALL
      
      console.log('[Modal] getUserAppointments: API call successful. Status:', response.status); // Log 5
      console.log('[Modal] getUserAppointments: API Response Data:', response.data);
      
      let appointments = [];
      // Check for the new structure first: response.data.data.appointments
      if (response.data && response.data.data && Array.isArray(response.data.data.appointments)) {
        appointments = response.data.data.appointments;
        console.log(`[Modal] getUserAppointments: Found ${appointments.length} appointments (in .data.appointments property)`);
      } else if (Array.isArray(response.data)) {
        appointments = response.data;
        console.log(`[Modal] getUserAppointments: Found ${appointments.length} appointments (direct array)`);
      } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
        appointments = response.data.appointments;
        console.log(`[Modal] getUserAppointments: Found ${appointments.length} appointments (in .appointments property)`);
      } else if (response.data.data && Array.isArray(response.data.data)) { // This was the previous problematic one for this structure
        appointments = response.data.data; // This would be incorrect if .data is an object with an appointments key
        console.log(`[Modal] getUserAppointments: Found ${appointments.length} appointments (in .data property, but this might be an object)`);
      } else {
        console.log('[Modal] getUserAppointments: Unknown data structure:', typeof response.data, response.data);
        appointments = [];
      }
      
      console.log('[Modal] getUserAppointments: Parsed appointments:', appointments);
      setUserAppointments(appointments);
      
    } catch (error: any) {
      console.error('[Modal] getUserAppointments: ERROR during API call or processing.', error); // Log 6
      if (error.response) {
        console.error('[Modal] getUserAppointments: Error response data:', error.response.data);
        console.error('[Modal] getUserAppointments: Error response status:', error.response.status);
      } else {
        console.error('[Modal] getUserAppointments: Error does not have a response object (e.g., network error, client-side error before request). Message:', error.message);
      }
      
      // Existing alert logic
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        alert('Appointments endpoint not found. Please check the API.');
      } else {
        alert(`Failed to fetch appointments: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      console.log('[Modal] getUserAppointments: Inside finally block. Setting isLoadingAppointments to false.'); // Log 7
      setIsLoadingAppointments(false);
    }
  };

  // Open appointments modal
  const openAppointmentsModal = () => {
    setShowAppointmentsModal(true);
    getUserAppointments();
  };

  // Close appointments modal
  const closeAppointmentsModal = () => {
    setShowAppointmentsModal(false);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await userApi.patch(`/api/appointments/${appointmentId}`, {
        status: 'cancelled'
      });
      alert('Appointment cancelled successfully');
      getUserAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase(); // Normalize status for comparison
    switch (lowerStatus) {
      case 'pending confirm': return 'bg-yellow-100 text-yellow-800'; // For "Pending Confirm"
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const searchDoctors = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.specialty) params.append('specialty', searchFilters.specialty);
      if (searchFilters.name) params.append('name', searchFilters.name);
      if (searchFilters.languages) params.append('languages', searchFilters.languages);
      if (searchFilters.lat) params.append('lat', searchFilters.lat.toString());
      if (searchFilters.lng) params.append('lng', searchFilters.lng.toString());
      params.append('page', searchFilters.page.toString());
      params.append('limit', searchFilters.limit.toString());

      const response = await userApi.get(`/api/doctors/search?${params.toString()}`);
      setDoctors(response.data.doctors || response.data);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get nearby doctors
  const getNearbyDoctors = async () => {
    if (!isLoggedIn || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      setIsLoading(true);
      try {
        const { latitude, longitude } = position.coords;
        const response = await userApi.get(`/api/doctors/nearby?lat=${latitude}&lng=${longitude}&limit=10`);
        setDoctors(response.data.doctors || response.data);
      } catch (error) {
        console.error('Error getting nearby doctors:', error);
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Get doctor details
  const getDoctorDetails = async (doctorId: string) => {
    setIsLoading(true);
    try {
      const response = await userApi.get(`/api/doctors/${doctorId}`);
      setSelectedDoctor(response.data);
      setCurrentStep('profile');
    } catch (error) {
      console.error('Error getting doctor details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get doctor availability
  const getDoctorAvailability = async (doctorId: string, date: string) => {
    try {
      const response = await userApi.get(`/api/doctors/${doctorId}/availability?date=${date}`);
      setAvailability(prev => ({ ...prev, [date]: response.data.slots || [] }));
    } catch (error) {
      console.error('Error getting availability:', error);
    }
  };
  // Book appointment
  const bookAppointment = async () => {
    if (!selectedDoctor) return;

    // Validate required fields
    if (!appointmentData.doctorId || !appointmentData.appointmentDate || 
        !appointmentData.appointmentSlot || !appointmentData.patientName || 
        !appointmentData.patientContact) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Required fields
      formData.append('doctorId', appointmentData.doctorId);
      formData.append('appointmentDate', appointmentData.appointmentDate);
      formData.append('appointmentSlot', appointmentData.appointmentSlot);
      formData.append('patientName', appointmentData.patientName);
      formData.append('patientContact', appointmentData.patientContact);
      formData.append('addressType', appointmentData.addressType);
      formData.append('payOnConsultation', appointmentData.payOnConsultation.toString());
      
      // Optional fields
      if (appointmentData.clinicId) {
        formData.append('clinicId', appointmentData.clinicId);
      }
      if (appointmentData.symptomsEntered && appointmentData.symptomsEntered.trim()) {
        formData.append('symptomsEntered', appointmentData.symptomsEntered);
      }

      console.log('Booking appointment with data:', {
        doctorId: appointmentData.doctorId,
        clinicId: appointmentData.clinicId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentSlot: appointmentData.appointmentSlot,
        patientName: appointmentData.patientName,
        patientContact: appointmentData.patientContact,
        addressType: appointmentData.addressType,
        payOnConsultation: appointmentData.payOnConsultation,
        symptomsEntered: appointmentData.symptomsEntered
      });

      const response = await userApi.post('/api/appointments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Appointment booked successfully:', response.data);
      alert(`Appointment booked successfully! Appointment ID: ${response.data.id || 'N/A'}`);
      
      // Reset state
      setCurrentStep('search');
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot('');
      setSelectedClinic('');
      setAvailability({});
      setAppointmentData({
        doctorId: '',
        appointmentDate: '',
        appointmentSlot: '',
        patientName: '',
        patientContact: '',
        addressType: 'saved',
        payOnConsultation: false
      });
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to book appointment. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Booking failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date selection and fetch availability
  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor) {
      getDoctorAvailability(selectedDoctor.id, date);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentData(prev => ({ ...prev, doctorId: doctor.id }));
    getDoctorDetails(doctor.id);
  };
  const proceedToBooking = () => {
    // Auto-select default clinic if no clinic data available
    if (!selectedDoctor?.clinics || selectedDoctor.clinics.length === 0) {
      setSelectedClinic('default');
    }
    setCurrentStep('booking');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Please log in to book appointments.</p>
      </div>
    );
  }

  return (    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Book Appointment</h1>
          <div className="space-x-2">            {/* <button
              onClick={async () => {
                console.log('=== Testing appointments API directly ===');
                console.log('Is logged in:', isLoggedIn);
                console.log('User API base URL:', userApi.defaults.baseURL);
                
                try {
                  // Test the API endpoint directly
                  const response = await userApi.get('/api/appointments');
                  console.log('✅ API Response Status:', response.status);
                  console.log('✅ API Response Headers:', response.headers);
                  console.log('✅ API Response Data:', response.data);
                  
                  // Check data structure
                  if (Array.isArray(response.data)) {
                    console.log(`📝 Found ${response.data.length} appointments (direct array)`);
                  } else if (response.data.appointments) {
                    console.log(`📝 Found ${response.data.appointments.length} appointments (in .appointments property)`);
                  } else {
                    console.log('📝 Unknown data structure:', typeof response.data);
                  }
                  
                  alert(`API Test: Status ${response.status}\\nData: ${JSON.stringify(response.data, null, 2)}`);
                } catch (error: any) {
                  console.error('❌ API Test Error:', error);
                  console.error('❌ Error Response:', error.response);
                  alert(`API Test Error: ${error.response?.status || 'Unknown'}\\nMessage: ${error.response?.data?.message || error.message}`);
                }
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Test API Detailed
            </button> */}
            <button
              onClick={openAppointmentsModal}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              View My Appointments
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm ${currentStep === 'search' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            1. Search Doctors
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${currentStep === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            2. Doctor Profile
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${currentStep === 'booking' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            3. Book Appointment
          </span>
        </div>
      </div>

      {/* Search Step */}
      {currentStep === 'search' && (
        <div className="space-y-6">
          {/* Search Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Search Doctors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Doctor name"
                value={searchFilters.name}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, name: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Specialty (e.g., cardiology)"
                value={searchFilters.specialty}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, specialty: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Languages (comma separated)"
                value={searchFilters.languages}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, languages: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={searchDoctors}
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Searching...' : 'Search Doctors'}
              </button>
              <button
                onClick={getNearbyDoctors}
                disabled={isLoading}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Find Nearby Doctors
              </button>
            </div>
          </div>          {/* Search Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Searching for doctors...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctors && doctors.length > 0 ? (                doctors.map((doctor) => (
                  <div key={doctor.id} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center space-x-4">
                      {doctor.profile?.profilePicture && (
                        <img
                          src={doctor.profile.profilePicture}
                          alt={doctor.profile.displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{doctor.profile?.displayName || 'No Name'}</h3>
                        <p className="text-gray-600">{doctor.profile?.specialty || 'No Specialty'}</p>
                        <p className="text-sm text-gray-500">{doctor.profile?.yearsOfExperience || 0} years experience</p>
                        <p className="text-sm text-gray-500">₹{doctor.profile?.consultationFees || 0} consultation fee</p>
                        {doctor.isVerified && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                            Verified
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDoctorSelect(doctor)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No doctors found. Try adjusting your search criteria.</p>
                </div>          )}
        </div>
      )}
      
      {/* Appointments Modal */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">My Appointments</h2>              <div className="flex items-center space-x-2">
                {/* <button
                  onClick={getUserAppointments}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  disabled={isLoadingAppointments}
                >
                  {isLoadingAppointments ? 'Loading...' : 'Refresh'}
                </button> */}
                {/* <button
                  onClick={() => {
                    console.log('=== Modal Debug ===');
                    console.log('userAppointments state:', userAppointments);
                    console.log('userAppointments length:', userAppointments.length);
                    console.log('isLoadingAppointments:', isLoadingAppointments);
                    alert(`Debug Info:\\nAppointments count: ${userAppointments.length}\\nLoading: ${isLoadingAppointments}\\nData: ${JSON.stringify(userAppointments, null, 2)}`);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Debug
                </button> */}
                <button
                  onClick={closeAppointmentsModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingAppointments ? (
                <div className="flex items-center justify-center py-8">
                  <p>Loading appointments...</p>
                </div>
              ) : userAppointments.length > 0 ? (
                <div className="space-y-4">
                  {userAppointments.map((appointment) => {
                    // Log each appointment to check its structure, especially the status
                    console.log('[Modal Rendering] Appointment object:', appointment);
                    
                    // Safe handling for status
                    const statusDisplay = typeof appointment.appointmentStatus === 'string' && appointment.appointmentStatus.length > 0 
                                          ? appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)
                                          : 'Status Unknown';
                    const statusColorClass = typeof appointment.appointmentStatus === 'string' 
                                             ? getStatusColor(appointment.appointmentStatus) 
                                             : getStatusColor('unknown');

                    return (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {appointment.doctorName || 'Doctor Name Not Available'}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
                                {statusDisplay}
                              </span>
                            </div>
                          <p className="text-gray-600 mb-1">
                            <strong>Specialty:</strong> {appointment.specialization || 'Not specified'}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Patient:</strong> {appointment.patientName}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Contact:</strong> {appointment.patientContact}
                          </p>
                          {appointment.clinicName && (
                            <p className="text-gray-600 mb-1">
                              <strong>Clinic:</strong> {appointment.clinicName} {appointment.clinicAddress ? `- ${appointment.clinicAddress}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-blue-600">
                              {formatDate(appointment.appointmentDate)}
                            </p>
                            <p className="text-gray-600">
                              {appointment.appointmentSlot}
                            </p>
                          </div>
                        </div>
                        
                        {appointment.symptomsEntered && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {appointment.symptomsEntered}
                            </p>
                          </div>
                        )}
                      
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div>
                            <p>Booked on: {new Date(appointment.createdAt).toLocaleDateString()}</p>
                            <p>Payment: {appointment.payOnConsultation ? 'Pay on consultation' : 'Paid online'}</p>
                          </div>
                        
                          {appointment.status === 'scheduled' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => cancelAppointment(appointment.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                Cancel
                              </button>
                              <button
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                onClick={() => {
                                  // Future: Add reschedule functionality
                                  alert('Reschedule functionality coming soon!');
                                }}
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No appointments found</p>
                  <p className="text-gray-400 text-sm mt-2">Book your first appointment to see it here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
      )}      {/* Doctor Profile Step */}
      {currentStep === 'profile' && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('search')}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← Back to Search
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading doctor profile...</p>
            </div>
          ) : selectedDoctor ? (          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-6 mb-6">
              {selectedDoctor.profile?.profilePicture && (
                <img
                  src={selectedDoctor.profile.profilePicture}
                  alt={selectedDoctor.profile.displayName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{selectedDoctor.profile?.displayName || 'No Name'}</h2>
                <p className="text-gray-600">{selectedDoctor.profile?.specialty || 'No Specialty'}</p>
                <p className="text-sm text-gray-500">{selectedDoctor.profile?.degree || 'No Degree'} from {selectedDoctor.profile?.college || 'No College'}</p>
                <p className="text-sm text-gray-500">{selectedDoctor.profile?.yearsOfExperience || 0} years experience</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-lg font-semibold text-green-600">₹{selectedDoctor.profile?.consultationFees || 0}</span>
                  {selectedDoctor.isVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-gray-700">{selectedDoctor.profile?.bio || 'No bio available'}</p>
            </div>            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDoctor.profile?.languagesSpoken && selectedDoctor.profile.languagesSpoken.map((language: string, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {selectedDoctor.profile?.expertiseAreas && selectedDoctor.profile.expertiseAreas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.profile.expertiseAreas.map((area: string, index: number) => (
                    <span key={index} className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedDoctor.profile?.certifications && selectedDoctor.profile.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Certifications</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDoctor.profile.certifications.map((cert: string, index: number) => (
                    <li key={index} className="text-gray-700">{cert}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Medical Registration:</span>
                  <p className="text-gray-600">{selectedDoctor.profile?.medicalRegistrationNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium">Patients Served:</span>
                  <p className="text-gray-600">{selectedDoctor.profile?.patientsServed || 0}</p>
                </div>
                <div>
                  <span className="font-medium">Online Consultation:</span>
                  <p className="text-gray-600">{selectedDoctor.profile?.providesOnlineConsultation ? 'Available' : 'Not Available'}</p>
                </div>
                <div>
                  <span className="font-medium">Gender Preference:</span>
                  <p className="text-gray-600 capitalize">{selectedDoctor.profile?.genderPreference || 'Both'}</p>
                </div>
              </div>
            </div>{selectedDoctor.clinics && selectedDoctor.clinics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Clinics</h3>
                {selectedDoctor.clinics.map((clinic) => (
                  <div key={clinic.id} className="border border-gray-200 rounded p-4 mb-2">
                    <h4 className="font-medium">{clinic.name}</h4>
                    <p className="text-gray-600 text-sm">{clinic.address}</p>
                    {clinic.googleMapsLink && (
                      <a
                        href={clinic.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline"
                      >
                        View on Maps
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedDoctor.reviews && selectedDoctor.reviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Recent Reviews</h3>
                {selectedDoctor.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded p-4 mb-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{review.patientName}</span>
                      <span className="text-yellow-500">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}            <button
              onClick={proceedToBooking}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold"
            >
              Book Appointment
            </button>
          </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p>Doctor profile not found.</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Step */}
      {currentStep === 'booking' && selectedDoctor && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('profile')}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← Back to Profile
          </button>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Book Appointment with {selectedDoctor.profile?.displayName || 'Doctor'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">              <div>
                <h3 className="text-lg font-semibold mb-4">Select Clinic</h3>
                {selectedDoctor.clinics && selectedDoctor.clinics.length > 0 ? (
                  selectedDoctor.clinics.map((clinic) => (
                    <label key={clinic.id} className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name="clinic"
                        value={clinic.id}
                        checked={selectedClinic === clinic.id}
                        onChange={(e) => {
                          setSelectedClinic(e.target.value);
                          setAppointmentData(prev => ({ ...prev, clinicId: e.target.value }));
                        }}
                        className="text-blue-500"
                      />
                      <span>{clinic.name} - {clinic.address}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">
                    <p>No clinic information available. The doctor will use their default clinic.</p>
                    <label className="flex items-center space-x-2 mt-2">
                      <input
                        type="radio"
                        name="clinic"
                        value="default"
                        checked={selectedClinic === 'default'}
                        onChange={(e) => {
                          setSelectedClinic(e.target.value);
                          setAppointmentData(prev => ({ ...prev, clinicId: '' })); // Let API use default
                        }}
                        className="text-blue-500"
                      />
                      <span>Default Clinic</span>
                    </label>
                  </div>
                )}
              </div>              <div>
                <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDoctor.clinics && selectedDoctor.clinics.length > 0 ? (
                    selectedDoctor.clinics
                    .find(c => c.id === selectedClinic)
                    ?.availabilityDates?.map((date) => (
                      <button
                        key={date}
                        onClick={() => {
                          handleDateSelection(date);
                          setAppointmentData(prev => ({ ...prev, appointmentDate: date }));
                        }}
                        className={`p-2 rounded text-sm ${
                          selectedDate === date
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {new Date(date).toLocaleDateString()}
                      </button>
                    ))
                  ) : (
                    /* Generate next 7 days as available dates when no clinic data */
                    Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i + 1);
                      const dateStr = date.toISOString().split('T')[0];
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setAppointmentData(prev => ({ ...prev, appointmentDate: dateStr }));
                            // Generate mock time slots
                            setAvailability(prev => ({ 
                              ...prev, 
                              [dateStr]: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
                            }));
                          }}
                          className={`p-2 rounded text-sm ${
                            selectedDate === dateStr
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {date.toLocaleDateString()}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {selectedDate && availability[selectedDate] && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Available Time Slots</h3>
                <div className="grid grid-cols-4 gap-2">
                  {availability[selectedDate].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setAppointmentData(prev => ({ ...prev, appointmentSlot: slot }));
                      }}
                      className={`p-2 rounded text-sm ${
                        selectedSlot === slot
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={appointmentData.patientName}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Number *</label>
                <input
                  type="tel"
                  value={appointmentData.patientContact}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, patientContact: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Symptoms (Optional)</label>
                <textarea
                  value={appointmentData.symptomsEntered || ''}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, symptomsEntered: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                  placeholder="Describe your symptoms..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Type *</label>
                <select
                  value={appointmentData.addressType}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, addressType: e.target.value as 'saved' | 'new' }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="saved">Use Saved Address</option>
                  <option value="new">Use New Address</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payOnConsultation"
                  checked={appointmentData.payOnConsultation}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, payOnConsultation: e.target.checked }))}
                />
                <label htmlFor="payOnConsultation" className="text-sm">
                  Pay on consultation (₹{selectedDoctor.profile?.consultationFees || 0})
                </label>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Appointment Summary</h4>              <p><strong>Doctor:</strong> {selectedDoctor.profile?.displayName || 'Doctor'}</p>
              <p><strong>Date:</strong> {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}</p>
              <p><strong>Time:</strong> {selectedSlot || 'Not selected'}</p>
              <p><strong>Fee:</strong> ₹{selectedDoctor.profile?.consultationFees || 0}</p>
            </div>            <button
              onClick={bookAppointment}
              disabled={
                !selectedDate || 
                !selectedSlot || 
                !appointmentData.patientName.trim() || 
                !appointmentData.patientContact.trim() || 
                (!selectedClinic) ||
                isLoading
              }
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}