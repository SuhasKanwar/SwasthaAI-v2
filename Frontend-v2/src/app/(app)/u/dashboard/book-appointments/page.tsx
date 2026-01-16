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
import { Loader2, Calendar, Clock, MapPin, User, X, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

type Appointment = {
    id: number;
    doctorId: string;
    doctorName: string;
    doctorPhotoUrl: string;
    specialization: string;
    clinicId: string;
    clinicName: string;
    clinicAddress: string;
    googleMapsLink?: string;
    appointmentDate: string;
    appointmentSlot: string;
    symptomsEntered?: string;
    patientName: string;
    patientContact: string;
    appointmentStatus: string;
    confirmationMessage?: string;
    paymentStatus: string;
    cancelReason?: string;
    rescheduleAvailable: boolean;
    cancelAvailable: boolean;
    createdAt: string;
};

const statusColors: Record<string, string> = {
    "Pending Confirm": "bg-yellow-100 text-yellow-800 border-yellow-300",
    Confirmed: "bg-green-100 text-green-800 border-green-300",
    Cancelled: "bg-red-100 text-red-800 border-red-300",
    Completed: "bg-blue-100 text-blue-800 border-blue-300",
    Rejected: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function BookAppointmentsPage() {
    const { isLoggedIn } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    // Reschedule modal state
    const [rescheduleModal, setRescheduleModal] = useState<{
        open: boolean;
        appointment: Appointment | null;
    }>({ open: false, appointment: null });
    const [rescheduleForm, setRescheduleForm] = useState({
        appointmentDate: "",
        appointmentSlot: "",
    });

    // Cancel modal state
    const [cancelModal, setCancelModal] = useState<{
        open: boolean;
        appointment: Appointment | null;
    }>({ open: false, appointment: null });
    const [cancelReason, setCancelReason] = useState("");

    const cardVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const params: any = { page: 1, limit: 50 };
            if (statusFilter) params.status = statusFilter;
            const res = await userApi.get("/api/appointments", { params });
            setAppointments(res.data.data?.appointments || []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;
        fetchAppointments();
    }, [isLoggedIn, statusFilter]);

    const handleReschedule = async () => {
        if (!rescheduleModal.appointment) return;
        try {
            await userApi.patch(
                `/api/appointments/${rescheduleModal.appointment.id}/reschedule`,
                rescheduleForm
            );
            toast.success("Appointment rescheduled successfully");
            setRescheduleModal({ open: false, appointment: null });
            setRescheduleForm({ appointmentDate: "", appointmentSlot: "" });
            fetchAppointments();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to reschedule");
        }
    };

    const handleCancel = async () => {
        if (!cancelModal.appointment) return;
        try {
            await userApi.patch(
                `/api/appointments/${cancelModal.appointment.id}/cancel`,
                { cancelReason }
            );
            toast.success("Appointment cancelled successfully");
            setCancelModal({ open: false, appointment: null });
            setCancelReason("");
            fetchAppointments();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to cancel");
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
    if (loading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );

    return (
        <motion.section
            className="min-h-screen w-full pl-20 pr-5 pt-20 pb-10 space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, ease: "anticipate" }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAppointments()}
                    >
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Appointments Grid */}
            {appointments.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No appointments found</p>
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={false}
                    animate={{ opacity: 1 }}
                >
                    <AnimatePresence>
                        {appointments.map((apt) => (
                            <motion.div
                                key={apt.id}
                                layout
                                variants={cardVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ layout: { duration: 0.3 } }}
                            >
                                <Card className="p-5 shadow-lg border-t-4 hover:shadow-xl transition-shadow"
                                    style={{ borderTopColor: apt.appointmentStatus === "Confirmed" ? "#22c55e" : apt.appointmentStatus === "Cancelled" ? "#ef4444" : "#3b82f6" }}
                                >
                                    {/* Doctor Info */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            {apt.doctorPhotoUrl ? (
                                                <img
                                                    src={apt.doctorPhotoUrl}
                                                    alt={apt.doctorName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">
                                                Dr. {apt.doctorName}
                                            </h3>
                                            <p className="text-sm text-gray-500">{apt.specialization}</p>
                                        </div>
                                        <span
                                            className={clsx(
                                                "px-2 py-1 text-xs font-medium rounded-full border",
                                                statusColors[apt.appointmentStatus] || "bg-gray-100"
                                            )}
                                        >
                                            {apt.appointmentStatus}
                                        </span>
                                    </div>

                                    <Separator className="my-3" />

                                    {/* Appointment Details */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(apt.appointmentDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{apt.appointmentSlot}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4 mt-0.5" />
                                            <div>
                                                <p className="font-medium">{apt.clinicName}</p>
                                                <p className="text-xs text-gray-400">{apt.clinicAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {apt.symptomsEntered && (
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                            <span className="font-medium">Symptoms:</span> {apt.symptomsEntered}
                                        </div>
                                    )}

                                    {apt.confirmationMessage && (
                                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                            {apt.confirmationMessage}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-4 flex gap-2">
                                        {apt.rescheduleAvailable && !["Cancelled", "Completed", "Rejected"].includes(apt.appointmentStatus) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setRescheduleModal({ open: true, appointment: apt });
                                                    setRescheduleForm({
                                                        appointmentDate: apt.appointmentDate.slice(0, 10),
                                                        appointmentSlot: apt.appointmentSlot,
                                                    });
                                                }}
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" /> Reschedule
                                            </Button>
                                        )}
                                        {apt.cancelAvailable && !["Cancelled", "Completed", "Rejected"].includes(apt.appointmentStatus) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => setCancelModal({ open: true, appointment: apt })}
                                            >
                                                <X className="w-3 h-3 mr-1" /> Cancel
                                            </Button>
                                        )}
                                    </div>

                                    {apt.cancelReason && (
                                        <div className="mt-2 text-xs text-red-500">
                                            <span className="font-medium">Cancel reason:</span> {apt.cancelReason}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Reschedule Modal */}
            <Dialog
                open={rescheduleModal.open}
                onOpenChange={(open) => setRescheduleModal({ open, appointment: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>New Date</Label>
                            <Input
                                type="date"
                                value={rescheduleForm.appointmentDate}
                                onChange={(e) =>
                                    setRescheduleForm((f) => ({
                                        ...f,
                                        appointmentDate: e.target.value,
                                    }))
                                }
                                min={new Date().toISOString().slice(0, 10)}
                            />
                        </div>
                        <div>
                            <Label>New Time Slot</Label>
                            <Input
                                type="time"
                                value={rescheduleForm.appointmentSlot}
                                onChange={(e) =>
                                    setRescheduleForm((f) => ({
                                        ...f,
                                        appointmentSlot: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleReschedule}>Confirm Reschedule</Button>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Modal */}
            <Dialog
                open={cancelModal.open}
                onOpenChange={(open) => setCancelModal({ open, appointment: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Appointment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to cancel your appointment with{" "}
                            <span className="font-semibold">
                                Dr. {cancelModal.appointment?.doctorName}
                            </span>
                            ?
                        </p>
                        <div>
                            <Label>Reason for cancellation</Label>
                            <Textarea
                                placeholder="Please provide a reason..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={!cancelReason.trim()}
                        >
                            Confirm Cancel
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline">Go Back</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.section>
    );
}