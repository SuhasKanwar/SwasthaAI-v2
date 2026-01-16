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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, User, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Appointment = {
    id: number;
    patientName: string;
    patientContact: string;
    appointmentDate: string;
    appointmentSlot: string;
    appointmentStatus: string;
    symptomsEntered?: string;
    clinicName: string;
    confirmationMessage?: string;
};

type MedicineForm = {
    medicineName: string;
    dosage: string;
    frequency: string;
    instructions: "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL";
    duration: string;
    chemicalComposition: string;
    form: string;
};

const statusColors: Record<string, string> = {
    "Pending Confirm": "bg-yellow-100 text-yellow-800 border-yellow-300",
    Confirmed: "bg-green-100 text-green-800 border-green-300",
    Cancelled: "bg-red-100 text-red-800 border-red-300",
    Completed: "bg-blue-100 text-blue-800 border-blue-300",
    Rejected: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function DoctorAppointmentsPage() {
    const { isLoggedIn } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("");

    const [actionModal, setActionModal] = useState<{
        open: boolean;
        appointment: Appointment | null;
        action: string;
    }>({ open: false, appointment: null, action: "" });
    const [updating, setUpdating] = useState(false);
    const [prescriptionForm, setPrescriptionForm] = useState({
        diagnosis: "",
        symptoms: "",
        doctorAdvice: "",
        followUpDate: "",
        medicines: [
            {
                medicineName: "",
                dosage: "",
                frequency: "",
                instructions: "BEFORE_MEAL" as const,
                duration: "",
                chemicalComposition: "",
                form: "tablet",
            },
        ] as MedicineForm[],
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
    }, []);

    // Fetch appointments
    const fetchAppointments = async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const params: any = { page: 1, limit: 50 };
            if (statusFilter) params.status = statusFilter;
            const res = await userApi.get(`/api/doctors/${doctorId}/appointments`, { params });
            setAppointments(res.data.data?.appointments || []);
        } catch (e: any) {
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [doctorId, statusFilter]);

    const handleUpdateStatus = async (status: string) => {
        if (!actionModal.appointment || !doctorId) return;
        try {
            setUpdating(true);
            const payload: any = { appointmentStatus: status };

            if (status === "Completed") {
                const medicines = prescriptionForm.medicines
                    .filter((m) => m.medicineName && m.dosage && m.frequency && m.duration && m.chemicalComposition)
                    .map((m) => ({
                        medicineName: m.medicineName.trim(),
                        dosage: m.dosage.trim(),
                        frequency: m.frequency.trim(),
                        instructions: m.instructions,
                        duration: Number(m.duration),
                        chemicalComposition: m.chemicalComposition.trim(),
                        form: m.form?.trim() || "tablet",
                    }));

                if (!prescriptionForm.diagnosis.trim() || !prescriptionForm.symptoms.trim() || medicines.length === 0) {
                    toast.error("Please complete prescription details.");
                    setUpdating(false);
                    return;
                }

                payload.prescription = {
                    diagnosis: prescriptionForm.diagnosis.trim(),
                    symptoms: prescriptionForm.symptoms
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    doctorAdvice: prescriptionForm.doctorAdvice?.trim() || undefined,
                    followUpDate: prescriptionForm.followUpDate || undefined,
                    medicines,
                };
            }

            await userApi.patch(
                `/api/doctors/${doctorId}/appointments/${actionModal.appointment.id}`,
                payload
            );
            toast.success(`Appointment ${status.toLowerCase()}`);
            setActionModal({ open: false, appointment: null, action: "" });
            fetchAppointments();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to update");
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (!isLoggedIn) return <BackToLogin />;

    return (
        <motion.section
            className="min-h-screen w-full pl-20 pr-5 pt-20 pb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                    <div className="flex items-center gap-3">
                        <select
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending Confirm">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={fetchAppointments}>
                            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                    </div>
                </div>

                <Separator className="mb-6" />

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No appointments found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {appointments.map((apt) => (
                                <motion.div
                                    key={apt.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Card className="p-4 border-l-4"
                                        style={{ borderLeftColor: apt.appointmentStatus === "Confirmed" ? "#22c55e" : apt.appointmentStatus === "Pending Confirm" ? "#eab308" : "#6b7280" }}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{apt.patientName}</p>
                                                    <p className="text-xs text-gray-500">{apt.patientContact}</p>
                                                </div>
                                            </div>
                                            <span className={clsx("px-2 py-1 text-xs rounded-full border", statusColors[apt.appointmentStatus])}>
                                                {apt.appointmentStatus}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(apt.appointmentDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{apt.appointmentSlot}</span>
                                            </div>
                                        </div>

                                        {apt.symptomsEntered && (
                                            <div className="text-xs bg-gray-50 p-2 rounded mb-3">
                                                <span className="font-medium">Symptoms:</span> {apt.symptomsEntered}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {apt.appointmentStatus === "Pending Confirm" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => setActionModal({ open: true, appointment: apt, action: "Confirmed" })}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 text-red-600 border-red-200"
                                                    onClick={() => setActionModal({ open: true, appointment: apt, action: "Rejected" })}
                                                >
                                                    <XCircle className="w-3 h-3 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}

                                        {apt.appointmentStatus === "Confirmed" && (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                        onClick={() => setActionModal({ open: true, appointment: apt, action: "Completed" })}
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" /> Mark Complete
                                            </Button>
                                        )}
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Dialog open={actionModal.open} onOpenChange={(open) => setActionModal({ ...actionModal, open })}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {actionModal.action === "Confirmed" && "Confirm Appointment"}
                            {actionModal.action === "Rejected" && "Reject Appointment"}
                            {actionModal.action === "Completed" && "Complete Appointment"}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to {actionModal.action.toLowerCase()} the appointment with{" "}
                        <span className="font-semibold">{actionModal.appointment?.patientName}</span>?
                    </p>

                    {actionModal.action === "Completed" && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <Label>Diagnosis *</Label>
                                <Input
                                    value={prescriptionForm.diagnosis}
                                    onChange={(e) =>
                                        setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })
                                    }
                                    placeholder="e.g., Acute gastritis"
                                />
                            </div>
                            <div>
                                <Label>Symptoms (comma separated) *</Label>
                                <Input
                                    value={prescriptionForm.symptoms}
                                    onChange={(e) =>
                                        setPrescriptionForm({ ...prescriptionForm, symptoms: e.target.value })
                                    }
                                    placeholder="e.g., abdominal pain, nausea"
                                />
                            </div>
                            <div>
                                <Label>Doctor Advice</Label>
                                <Textarea
                                    value={prescriptionForm.doctorAdvice}
                                    onChange={(e) =>
                                        setPrescriptionForm({ ...prescriptionForm, doctorAdvice: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>Follow Up Date</Label>
                                <Input
                                    type="date"
                                    value={prescriptionForm.followUpDate}
                                    onChange={(e) =>
                                        setPrescriptionForm({ ...prescriptionForm, followUpDate: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Medicines *</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPrescriptionForm({
                                                ...prescriptionForm,
                                                medicines: [
                                                    ...prescriptionForm.medicines,
                                                    {
                                                        medicineName: "",
                                                        dosage: "",
                                                        frequency: "",
                                                        instructions: "BEFORE_MEAL",
                                                        duration: "",
                                                        chemicalComposition: "",
                                                        form: "tablet",
                                                    },
                                                ],
                                            })
                                        }
                                    >
                                        Add Medicine
                                    </Button>
                                </div>

                                {prescriptionForm.medicines.map((medicine, index) => (
                                    <div key={index} className="border rounded-lg p-3 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label>Medicine Name *</Label>
                                                <Input
                                                    value={medicine.medicineName}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, medicineName: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Dosage *</Label>
                                                <Input
                                                    value={medicine.dosage}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, dosage: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Frequency *</Label>
                                                <Input
                                                    value={medicine.frequency}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, frequency: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Duration (days) *</Label>
                                                <Input
                                                    type="number"
                                                    value={medicine.duration}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, duration: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Chemical Composition *</Label>
                                                <Input
                                                    value={medicine.chemicalComposition}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, chemicalComposition: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Form</Label>
                                                <Input
                                                    value={medicine.form}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = { ...medicine, form: e.target.value };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Instructions</Label>
                                                <select
                                                    className="w-full border rounded-lg px-3 py-2"
                                                    value={medicine.instructions}
                                                    onChange={(e) => {
                                                        const medicines = [...prescriptionForm.medicines];
                                                        medicines[index] = {
                                                            ...medicine,
                                                            instructions: e.target.value as MedicineForm["instructions"],
                                                        };
                                                        setPrescriptionForm({ ...prescriptionForm, medicines });
                                                    }}
                                                >
                                                    <option value="BEFORE_MEAL">Before Meal</option>
                                                    <option value="AFTER_MEAL">After Meal</option>
                                                    <option value="WITH_MEAL">With Meal</option>
                                                </select>
                                            </div>
                                        </div>
                                        {prescriptionForm.medicines.length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200"
                                                onClick={() => {
                                                    const medicines = prescriptionForm.medicines.filter((_, i) => i !== index);
                                                    setPrescriptionForm({ ...prescriptionForm, medicines });
                                                }}
                                            >
                                                Remove Medicine
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={() => handleUpdateStatus(actionModal.action)}
                            disabled={updating}
                            className={clsx(
                                actionModal.action === "Rejected" && "bg-red-600 hover:bg-red-700",
                                actionModal.action === "Confirmed" && "bg-green-600 hover:bg-green-700"
                            )}
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
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
