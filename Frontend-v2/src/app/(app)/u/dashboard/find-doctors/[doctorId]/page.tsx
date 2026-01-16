"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Loader2,
    MapPin,
    Star,
    Clock,
    Calendar,
    User,
    ArrowLeft,
    GraduationCap,
    Stethoscope,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

type DoctorProfile = {
    userId: string;
    displayName: string;
    profilePicture?: string;
    specialty: string;
    expertiseAreas: string[];
    bio?: string;
    yearsOfExperience: number;
    degree: string;
    college: string;
    avgRating: number;
    reviewsCount: number;
    consultationFees: number;
    providesOnlineConsultation: boolean;
    languagesSpoken: string[];
    clinics: {
        id: string;
        name: string;
        address: string;
        googleMapsLink?: string;
    }[];
};

export default function DoctorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const doctorId = params.doctorId as string;
    const { isLoggedIn } = useAuth();

    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // Booking form state
    const [selectedClinic, setSelectedClinic] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [patientName, setPatientName] = useState("");
    const [patientContact, setPatientContact] = useState("");
    const [symptoms, setSymptoms] = useState("");
    const [booking, setBooking] = useState(false);

    // Fetch doctor profile
    useEffect(() => {
        if (!isLoggedIn || !doctorId) return;
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const res = await userApi.get(`/api/doctors/search/${doctorId}`);
                setDoctor(res.data.data);
                if (res.data.data?.clinics?.[0]) {
                    setSelectedClinic(res.data.data.clinics[0].id);
                }
            } catch (e: any) {
                toast.error("Failed to load doctor profile");
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [isLoggedIn, doctorId]);

    // Fetch availability when date changes
    useEffect(() => {
        if (!selectedDate || !doctorId) return;
        const fetchSlots = async () => {
            try {
                setSlotsLoading(true);
                const res = await userApi.get(`/api/doctors/search/${doctorId}/availability`, {
                    params: { date: selectedDate },
                });
                setAvailableSlots(res.data.data?.availableSlots || []);
            } catch (e: any) {
                toast.error("Failed to load available slots");
            } finally {
                setSlotsLoading(false);
            }
        };
        fetchSlots();
    }, [selectedDate, doctorId]);

    // Book appointment
    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedSlot || !patientName || !patientContact) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setBooking(true);
            const formData = new FormData();
            formData.append("doctorId", doctorId);
            formData.append("clinicId", selectedClinic);
            formData.append("appointmentDate", selectedDate);
            formData.append("appointmentSlot", selectedSlot);
            formData.append("patientName", patientName);
            formData.append("patientContact", patientContact);
            formData.append("addressType", "saved");
            formData.append("payOnConsultation", "true");
            if (symptoms) formData.append("symptomsEntered", symptoms);

            await userApi.post("/api/appointments", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Appointment booked successfully!");
            router.push("/u/dashboard/book-appointments");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to book appointment");
        } finally {
            setBooking(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    };

    if (!isLoggedIn) return <BackToLogin />;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-gray-500">Doctor not found</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <motion.section
            className="min-h-screen w-full pl-20 pr-5 pt-20 pb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor Profile Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                {doctor.profilePicture ? (
                                    <img
                                        src={doctor.profilePicture}
                                        alt={doctor.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-blue-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Dr. {doctor.displayName}
                                </h1>
                                <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4" />
                                        <span>{doctor.degree}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Stethoscope className="w-4 h-4" />
                                        <span>{doctor.yearsOfExperience} years exp</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="font-medium">{doctor.avgRating?.toFixed(1)}</span>
                                    <span className="text-gray-400">({doctor.reviewsCount} reviews)</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">₹{doctor.consultationFees}</p>
                                <p className="text-xs text-gray-500">Consultation Fee</p>
                                {doctor.providesOnlineConsultation && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                        Online Available
                                    </span>
                                )}
                            </div>
                        </div>

                        {doctor.bio && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <h3 className="font-semibold mb-2">About</h3>
                                    <p className="text-gray-600 text-sm">{doctor.bio}</p>
                                </div>
                            </>
                        )}

                        {doctor.expertiseAreas?.length > 0 && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <h3 className="font-semibold mb-2">Expertise</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.expertiseAreas.map((area, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                                            >
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Clinics */}
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Clinic Locations</h3>
                        <div className="space-y-3">
                            {doctor.clinics?.map((clinic) => (
                                <div
                                    key={clinic.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedClinic === clinic.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-blue-300"
                                        }`}
                                    onClick={() => setSelectedClinic(clinic.id)}
                                >
                                    <p className="font-medium">{clinic.name}</p>
                                    <div className="flex items-start gap-1 text-sm text-gray-500 mt-1">
                                        <MapPin className="w-3 h-3 mt-0.5" />
                                        <span>{clinic.address}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Booking Form */}
                <Card className="p-6 h-fit sticky top-24">
                    <h3 className="font-semibold mb-4">Book Appointment</h3>

                    <div className="space-y-4">
                        <div>
                            <Label>Select Date *</Label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedSlot("");
                                }}
                                min={getMinDate()}
                            />
                        </div>

                        {selectedDate && (
                            <div>
                                <Label>Available Slots *</Label>
                                {slotsLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-2">
                                        No slots available for this date
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                className={`px-2 py-2 text-sm rounded border transition-colors ${selectedSlot === slot
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "border-gray-300 hover:border-blue-400"
                                                    }`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        <div>
                            <Label>Patient Name *</Label>
                            <Input
                                placeholder="Enter patient name"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Contact Number *</Label>
                            <Input
                                placeholder="Enter contact number"
                                value={patientContact}
                                onChange={(e) => setPatientContact(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Symptoms (optional)</Label>
                            <Textarea
                                placeholder="Describe your symptoms..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleBookAppointment}
                            disabled={booking || !selectedDate || !selectedSlot || !patientName || !patientContact}
                        >
                            {booking ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Booking...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Confirm Booking - ₹{doctor.consultationFees}
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </motion.section>
    );
}
