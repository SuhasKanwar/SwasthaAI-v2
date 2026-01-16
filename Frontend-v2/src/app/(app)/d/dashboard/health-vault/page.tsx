"use client";

import React, { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Medicine = {
    medicineName: string;
    dosage: string;
    frequency: string;
    instructions: string;
    duration: number;
    chemicalComposition: string;
    form: string;
};

type Prescription = {
    diagnosis: string;
    symptoms: string[];
    doctorAdvice?: string | null;
    followUpDate?: string | null;
    medicines: Medicine[];
};

type HealthRecord = {
    id: string;
    date: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    doctorName: string;
    clinicName: string;
    pdfUrl?: string | null;
    prescription?: Prescription | null;
};

export default function DoctorHealthVaultPage() {
    const { isLoggedIn } = useAuth();
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let id = sessionStorage.getItem("doctor_id");
        if (!id) {
            const token = sessionStorage.getItem("access_token");
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
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

    const fetchRecords = async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const res = await userApi.get(`/api/doctors/${doctorId}/health-vault`, {
                params: { page: 1, limit: 50 },
            });
            setRecords(res.data?.data?.records || []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load health vault.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [doctorId]);

    if (!isLoggedIn) return <BackToLogin />;

    return (
        <section className="min-h-screen w-full pl-20 pr-5 pt-20 pb-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Health Vault</h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchRecords}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading prescriptions...</p>
                ) : records.length === 0 ? (
                    <p className="text-gray-500">No prescriptions recorded yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {records.map((record) => (
                            <Card key={record.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{record.patientName}</p>
                                        <p className="text-xs text-gray-500">
                                            {record.patientGender} • {record.patientAge} yrs
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(record.date).toLocaleDateString("en-IN")}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700">
                                    <p className="font-medium">Diagnosis:</p>
                                    <p>{record.prescription?.diagnosis || "—"}</p>
                                </div>
                                <div className="text-sm text-gray-700">
                                    <p className="font-medium">Medicines:</p>
                                    <ul className="list-disc ml-5">
                                        {(record.prescription?.medicines || []).map((med, idx) => (
                                            <li key={`${record.id}-med-${idx}`}>
                                                {med.medicineName} • {med.dosage} • {med.frequency}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {record.pdfUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(record.pdfUrl!, "_blank")}
                                    >
                                        View PDF
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
