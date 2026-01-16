"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export default function DoctorProfilePage() {
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [hasProfile, setHasProfile] = useState(false);

    const [form, setForm] = useState({
        displayName: "",
        specialty: "",
        expertiseAreas: "",
        bio: "",
        yearsOfExperience: "",
        degree: "",
        college: "",
        medicalRegistrationNumber: "",
        consultationFees: "",
        languagesSpoken: "",
        providesOnlineConsultation: false,
    });

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

    // Get doctor ID from session or decode from token
    useEffect(() => {
        let storedDoctorId = sessionStorage.getItem("doctor_id");

        // Fallback: decode from JWT token if not in sessionStorage
        if (!storedDoctorId) {
            const token = sessionStorage.getItem("access_token");
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload?.id) {
                        storedDoctorId = payload.id;
                        sessionStorage.setItem("doctor_id", payload.id);
                    }
                } catch (e) {
                    console.error("Failed to decode token:", e);
                }
            }
        }

        if (storedDoctorId) {
            setDoctorId(storedDoctorId);
        }
        setLoading(false);
    }, []);

    // Fetch existing profile
    useEffect(() => {
        if (!doctorId) return;
        const fetchProfile = async () => {
            try {
                const res = await userApi.get(`/api/doctors/${doctorId}`);
                if (res.data?.profile) {
                    const p = res.data.profile;
                    setHasProfile(true);
                    setForm({
                        displayName: p.displayName || "",
                        specialty: p.specialty || "",
                        expertiseAreas: Array.isArray(p.expertiseAreas) ? p.expertiseAreas.join(", ") : "",
                        bio: p.bio || "",
                        yearsOfExperience: p.yearsOfExperience?.toString() || "",
                        degree: p.degree || "",
                        college: p.college || "",
                        medicalRegistrationNumber: p.medicalRegistrationNumber || "",
                        consultationFees: p.consultationFees?.toString() || "",
                        languagesSpoken: Array.isArray(p.languagesSpoken) ? p.languagesSpoken.join(", ") : "",
                        providesOnlineConsultation: p.providesOnlineConsultation || false,
                    });
                }
            } catch (e) {
                // Profile doesn't exist yet
            }
        };
        fetchProfile();
    }, [doctorId]);

    const handleSubmit = async () => {
        if (!doctorId) {
            toast.error("Doctor ID not found. Please login again.");
            return;
        }

        if (!form.displayName || !form.specialty || !form.degree || !form.medicalRegistrationNumber || !form.consultationFees) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                displayName: form.displayName,
                specialty: form.specialty,
                expertiseAreas: form.expertiseAreas.split(",").map((s) => s.trim()).filter(Boolean),
                bio: form.bio,
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
                degree: form.degree,
                college: form.college,
                medicalRegistrationNumber: form.medicalRegistrationNumber,
                consultationFees: parseInt(form.consultationFees),
                languagesSpoken: form.languagesSpoken.split(",").map((s) => s.trim()).filter(Boolean),
                providesOnlineConsultation: form.providesOnlineConsultation,
            };

            if (hasProfile) {
                await userApi.put(`/api/doctors/${doctorId}/profile`, payload);
                toast.success("Profile updated successfully");
            } else {
                await userApi.post(`/api/doctors/${doctorId}/profile`, payload);
                toast.success("Profile created successfully");
                setHasProfile(true);
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (!isLoggedIn) return <BackToLogin />;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {hasProfile ? "Edit Profile" : "Complete Your Profile"}
                        </h1>
                        <p className="text-gray-500">
                            {hasProfile
                                ? "Update your professional information"
                                : "Set up your profile to start receiving appointments"}
                        </p>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Display Name *</Label>
                            <Input
                                placeholder="Dr. John Smith"
                                value={form.displayName}
                                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Specialty *</Label>
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={form.specialty}
                                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                            >
                                <option value="">Select specialty</option>
                                {specialties.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Degree *</Label>
                            <Input
                                placeholder="MBBS, MD"
                                value={form.degree}
                                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>College</Label>
                            <Input
                                placeholder="Medical College Name"
                                value={form.college}
                                onChange={(e) => setForm({ ...form, college: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Medical Registration Number *</Label>
                            <Input
                                placeholder="MCI/State Registration No."
                                value={form.medicalRegistrationNumber}
                                onChange={(e) => setForm({ ...form, medicalRegistrationNumber: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Years of Experience</Label>
                            <Input
                                type="number"
                                placeholder="5"
                                value={form.yearsOfExperience}
                                onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Consultation Fees (₹) *</Label>
                            <Input
                                type="number"
                                placeholder="500"
                                value={form.consultationFees}
                                onChange={(e) => setForm({ ...form, consultationFees: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Languages Spoken</Label>
                            <Input
                                placeholder="English, Hindi, Tamil"
                                value={form.languagesSpoken}
                                onChange={(e) => setForm({ ...form, languagesSpoken: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Expertise Areas</Label>
                            <Input
                                placeholder="Diabetes, Heart Disease, General Checkup"
                                value={form.expertiseAreas}
                                onChange={(e) => setForm({ ...form, expertiseAreas: e.target.value })}
                            />
                            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                        </div>

                        <div className="md:col-span-2">
                            <Label>Bio</Label>
                            <Textarea
                                placeholder="Brief description about yourself and your practice..."
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                rows={4}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.providesOnlineConsultation}
                                    onChange={(e) => setForm({ ...form, providesOnlineConsultation: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span>I provide online consultations</span>
                            </label>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <Button onClick={handleSubmit} disabled={saving} className="w-full">
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {hasProfile ? "Update Profile" : "Save Profile"}
                            </>
                        )}
                    </Button>
                </Card>
            </div>
        </motion.section>
    );
}
