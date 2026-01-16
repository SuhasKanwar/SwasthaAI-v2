"use client";

import React, { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, FileText, UploadCloud, Eye } from "lucide-react";

interface VaultReport {
  id: string;
  title: string;
  notes: string | null;
  recordType: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  publicUrl: string;
  createdAt: string;
  userId?: string;
}

export default function HealthVaultPage() {
  const { isLoggedIn } = useAuth();

  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [reports, setReports] = useState<VaultReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadRecordType, setUploadRecordType] = useState("");
  const [uploading, setUploading] = useState(false);

  const [activeReport, setActiveReport] = useState<VaultReport | null>(null);

  const fileBaseUrl =
    (userApi.defaults.baseURL?.replace(/\/$/, "") as string | undefined) || "";

  const handleVerifyPin = async () => {
    if (!pin.trim()) {
      toast.error("Please enter your security PIN.");
      return;
    }
    setVerifyingPin(true);
    try {
      await userApi.post("/api/vault/check-pin", { pin });
      setPinVerified(true);
      toast.success("PIN verified. Health Vault unlocked.");
      fetchReports();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Incorrect PIN. Please try again.");
      } else if (status === 404) {
        toast.error("User not found.");
      } else {
        toast.error("Failed to verify PIN.");
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await userApi.get("/api/vault/reports");
      setReports(res.data.reports || []);
    } catch {
      toast.error("Failed to load your reports.");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pinVerified) {
      toast.error("Verify PIN before uploading reports.");
      e.target.value = "";
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      if (!uploadTitle) {
        setUploadTitle(e.target.files[0].name);
      }
      toast.success(`Selected "${e.target.files[0].name}"`);
    }
  };

  const handleUpload = async () => {
    if (!pinVerified) {
      toast.error("Verify PIN before uploading reports.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a report file to upload.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("report", selectedFile);
      if (uploadTitle) formData.append("title", uploadTitle);
      if (uploadNotes) formData.append("notes", uploadNotes);
      if (uploadRecordType) formData.append("recordType", uploadRecordType);

      const res = await userApi.post("/api/vault/store-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newReport: VaultReport = res.data.report;
      setReports((prev) => [newReport, ...prev]);
      setSelectedFile(null);
      setUploadTitle("");
      setUploadNotes("");
      setUploadRecordType("");
      toast.success("Report uploaded to Health Vault.");
    } catch {
      toast.error("Failed to upload report.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewReport = (report: VaultReport) => {
    if (!pinVerified) {
      toast.error("Verify PIN before viewing reports.");
      return;
    }
    if (!report.mimeType.toLowerCase().includes("pdf") && !report.originalName.toLowerCase().endsWith(".pdf")) {
      toast.info("Only PDF reports can be viewed inline. You can still download them from the link.");
    }
    setActiveReport(report);
  };

  useEffect(() => {
    // Intentionally do not auto-fetch until PIN is verified
  }, []);

  if (!isLoggedIn) return <BackToLogin />;

  return (
    <main className="min-h-screen w-full px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
          <span className="text-slate-800">Health</span>
          <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Vault
          </span>
          <Lock className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-slate-600 mb-6">
          Securely store and access your medical reports. For your privacy, reports are only
          visible after verifying your security PIN.
        </p>

        {/* PIN verification */}
        {!pinVerified && (
          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <p className="text-sm text-slate-600 mb-2">
                  Enter your 4–6 digit security PIN to unlock your Health Vault.
                </p>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  className="w-full md:w-64 border border-slate-300 rounded-lg px-3 py-2 text-lg tracking-[0.3em] text-center"
                  placeholder="••••"
                />
              </div>
              <Button
                onClick={handleVerifyPin}
                disabled={verifyingPin || !pin.trim()}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-lg"
              >
                {verifyingPin ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
          </section>
        )}

        {/* Upload + list, only after PIN verified */}
        {pinVerified && (
          <>
            {/* Upload section */}
            <section className="mb-8">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <UploadCloud className="w-5 h-5 text-teal-500" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Upload new report
                  </h2>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-slate-600">Title</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="e.g. Blood Test - Jan 2025"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-slate-600">Notes (optional)</label>
                      <textarea
                        value={uploadNotes}
                        onChange={(e) => setUploadNotes(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 min-h-[60px]"
                        placeholder="Any details you want to remember about this report."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-slate-600">Type (optional)</label>
                      <input
                        type="text"
                        value={uploadRecordType}
                        onChange={(e) => setUploadRecordType(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="e.g. Prescription, Lab Report"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-72 flex flex-col gap-3">
                    <label className="text-sm text-slate-600">Report file</label>
                    <div className="border border-dashed border-slate-300 rounded-lg px-4 py-4 flex flex-col items-center justify-center text-center">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="vault-file-input"
                      />
                      <label
                        htmlFor="vault-file-input"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <UploadCloud className="w-6 h-6 text-blue-500" />
                        <span className="text-sm text-slate-700">
                          {selectedFile ? selectedFile.name : "Choose PDF or image report"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Max size depends on server limits.
                        </span>
                      </label>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile}
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white"
                    >
                      {uploading ? "Uploading..." : "Upload to Vault"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Reports list + viewer */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Your reports
                  </h2>
                </div>
                {loadingReports && <p className="text-sm text-slate-500">Loading reports...</p>}
                {!loadingReports && reports.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No reports uploaded yet. Add your first report above.
                  </p>
                )}
                <ul className="space-y-3">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="border border-slate-200 rounded-lg px-3 py-2 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-slate-800 truncate">
                          {report.title || report.originalName}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReport(report)}
                          title="View report"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-slate-500 truncate">
                        {report.originalName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                      {!report.mimeType.toLowerCase().includes("pdf") &&
                        !report.originalName.toLowerCase().endsWith(".pdf") && (
                          <span className="text-[11px] text-amber-500">
                            Non-PDF file &mdash; will open as download in your browser.
                          </span>
                        )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 min-h-[300px] flex flex-col">
                <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-500" />
                  Report viewer
                </h2>
                {!activeReport && (
                  <p className="text-sm text-slate-500">
                    Select a report from the list to preview it here. PDF reports will be
                    shown inline; other file types will open in a new tab or be downloaded.
                  </p>
                )}
                {activeReport && (
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          {activeReport.title || activeReport.originalName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {activeReport.originalName}
                        </span>
                      </div>
                      <a
                        href={`${fileBaseUrl}${activeReport.publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                    {activeReport.mimeType.toLowerCase().includes("pdf") ||
                    activeReport.originalName.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={`${fileBaseUrl}${activeReport.publicUrl}`}
                        className="w-full flex-1 border border-slate-200 rounded-lg"
                        title={activeReport.title || activeReport.originalName}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        This file is not a PDF. Use the &quot;Open in new tab&quot; link above
                        to view or download it.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}