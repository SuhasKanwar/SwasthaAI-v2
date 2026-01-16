"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Edit2, Trash2, Building } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

type Clinic = {
    id: string;
    name: string;
    address: string;
    googleMapsLink?: string;
};

export default function ClinicsPage() {
    const { isLoggedIn } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorId, setDoctorId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: "",
        address: "",
        googleMapsLink: "",
    });

    // Get doctor ID
    useEffect(() => {
        let id = sessionStorage.getItem("doctor_id");

        // Fallback: decode from JWT token
        if (!id) {
            const token = sessionStorage.getItem("access_token");
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload?.id) {
                        id = payload.id;
                        sessionStorage.setItem("doctor_id", payload.id);
                    }
                } catch (e) {
                    console.error("Failed to decode token:", e);
                }
            }
        }

        if (id) setDoctorId(id);
        setLoading(false);
    }, []);

    // Fetch clinics
    useEffect(() => {
        if (!doctorId) return;
        const fetchClinics = async () => {
            try {
                const res = await userApi.get(`/api/doctors/${doctorId}`);
                setClinics(res.data?.profile?.clinics || []);
            } catch (e) {
                toast.error("Failed to load clinics");
            }
        };
        fetchClinics();
    }, [doctorId]);

    const handleSubmit = async () => {
        if (!doctorId || !form.name || !form.address) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: form.name,
                address: form.address,
                googleMapsLink: form.googleMapsLink || undefined,
                availabilityDates: [],
                availabilitySlots: [],
            };

            if (editingClinic) {
                await userApi.put(`/api/doctors/${doctorId}/clinics/${editingClinic.id}`, payload);
                setClinics((prev) =>
                    prev.map((c) => (c.id === editingClinic.id ? { ...c, ...payload } : c))
                );
                toast.success("Clinic updated");
            } else {
                const res = await userApi.post(`/api/doctors/${doctorId}/clinics`, payload);
                setClinics((prev) => [...prev, res.data]);
                toast.success("Clinic added");
            }

            setShowModal(false);
            setEditingClinic(null);
            setForm({ name: "", address: "", googleMapsLink: "" });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save clinic");
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingClinic(null);
        setForm({ name: "", address: "", googleMapsLink: "" });
        setShowModal(true);
    };

    const openEditModal = (clinic: Clinic) => {
        setEditingClinic(clinic);
        setForm({
            name: clinic.name,
            address: clinic.address,
            googleMapsLink: clinic.googleMapsLink || "",
        });
        setShowModal(true);
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
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Clinics</h1>
                        <p className="text-gray-500">Manage your clinic locations</p>
                    </div>
                    <Button onClick={openAddModal}>
                        <Plus className="w-4 h-4 mr-2" /> Add Clinic
                    </Button>
                </div>

                {clinics.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">No clinics added yet</p>
                        <Button onClick={openAddModal}>
                            <Plus className="w-4 h-4 mr-2" /> Add Your First Clinic
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clinics.map((clinic) => (
                            <Card key={clinic.id} className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{clinic.name}</h3>
                                        <div className="flex items-start gap-2 text-gray-600 mt-2">
                                            <MapPin className="w-4 h-4 mt-0.5" />
                                            <span className="text-sm">{clinic.address}</span>
                                        </div>
                                        {clinic.googleMapsLink && (
                                            <a
                                                href={clinic.googleMapsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-sm mt-2 inline-block hover:underline"
                                            >
                                                View on Maps
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => openEditModal(clinic)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClinic ? "Edit Clinic" : "Add Clinic"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Clinic Name *</Label>
                            <Input
                                placeholder="City Hospital - Main Branch"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Address *</Label>
                            <Input
                                placeholder="123 Main Street, City, State"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Google Maps Link (optional)</Label>
                            <Input
                                placeholder="https://maps.google.com/..."
                                value={form.googleMapsLink}
                                onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.section>
    );
}
