"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, MapPin, Star, Search, Navigation } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Link from "next/link";

type Doctor = {
    userId: string;
    displayName: string;
    profilePicture?: string;
    specialty: string;
    yearsOfExperience: number;
    avgRating: number;
    reviewsCount: number;
    consultationFees: number;
    providesOnlineConsultation: boolean;
    clinics?: { id: string; name: string; address: string }[];
};

export default function FindDoctorsPage() {
    const { isLoggedIn } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const specialties = [
        "General Physician",
        "Cardiologist",
        "Dermatologist",
        "Orthopedic",
        "Pediatrician",
        "Neurologist",
        "Psychiatrist",
        "ENT Specialist",
        "Gynecologist",
        "Ophthalmologist",
    ];

    // Get user's location
    const getUserLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setLocationLoading(false);
                    toast.success("Location detected!");
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast.error("Could not get your location. Please search manually.");
                    setLocationLoading(false);
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
            setLocationLoading(false);
        }
    };

    // Search nearby doctors
    const searchNearbyDoctors = async () => {
        if (!userLocation) {
            toast.error("Please enable location first");
            return;
        }
        try {
            setLoading(true);
            const res = await userApi.get("/api/doctors/search/nearby", {
                params: { lat: userLocation.lat, lng: userLocation.lng, limit: 20 },
            });
            setDoctors(res.data.data || []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to find nearby doctors");
        } finally {
            setLoading(false);
        }
    };

    // Search doctors by name or specialty
    const searchDoctors = async () => {
        try {
            setLoading(true);
            const params: any = { page: 1, limit: 20 };
            if (searchQuery) params.name = searchQuery;
            if (specialty) params.specialty = specialty;
            if (userLocation) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }
            const res = await userApi.get("/api/doctors/search/search", { params });
            setDoctors(res.data.data?.doctors || res.data.data || []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to search doctors");
        } finally {
            setLoading(false);
        }
    };

    // Get location on mount
    useEffect(() => {
        if (isLoggedIn) {
            getUserLocation();
        }
    }, [isLoggedIn]);

    // Search when location is available
    useEffect(() => {
        if (userLocation) {
            searchNearbyDoctors();
        }
    }, [userLocation]);

    if (!isLoggedIn) return <BackToLogin />;

    return (
        <motion.section
            className="min-h-screen w-full pl-20 pr-5 pt-20 pb-10 space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Find Doctors</h1>
                <Button
                    variant="outline"
                    onClick={getUserLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Navigation className="w-4 h-4 mr-2" />
                    )}
                    {userLocation ? "Location Detected" : "Detect Location"}
                </Button>
            </div>

            {/* Search Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by doctor name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <select
                        className="border rounded-lg px-3 py-2"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                    >
                        <option value="">All Specialties</option>
                        {specialties.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <Button onClick={searchDoctors} disabled={loading}>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                </div>
            </Card>

            <Separator />

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            )}

            {/* Doctor Cards */}
            {!loading && doctors.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No doctors found. Try enabling location or adjusting your search.</p>
                </div>
            )}

            {!loading && doctors.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                        <Card
                            key={doctor.userId}
                            className="p-5 shadow-lg border-t-4 border-blue-500 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                    {doctor.profilePicture ? (
                                        <img
                                            src={doctor.profilePicture}
                                            alt={doctor.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-blue-600">
                                            {doctor.displayName?.charAt(0) || "D"}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 text-lg">
                                        Dr. {doctor.displayName}
                                    </h3>
                                    <p className="text-sm text-blue-600">{doctor.specialty}</p>
                                    <p className="text-xs text-gray-500">
                                        {doctor.yearsOfExperience} years experience
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm mb-4">
                                <div className="flex items-center gap-1 text-yellow-600">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span>{doctor.avgRating?.toFixed(1) || "5.0"}</span>
                                    <span className="text-gray-400">
                                        ({doctor.reviewsCount || 0} reviews)
                                    </span>
                                </div>
                                <span className="font-semibold text-green-600">
                                    ₹{doctor.consultationFees}
                                </span>
                            </div>

                            {doctor.clinics?.[0] && (
                                <div className="flex items-start gap-2 text-xs text-gray-500 mb-4">
                                    <MapPin className="w-3 h-3 mt-0.5" />
                                    <span className="line-clamp-2">{doctor.clinics[0].address}</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {doctor.providesOnlineConsultation && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                        Online Available
                                    </span>
                                )}
                            </div>

                            <Link href={`/u/dashboard/find-doctors/${doctor.userId}`}>
                                <Button className="w-full mt-4">Book Appointment</Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </motion.section>
    );
}
