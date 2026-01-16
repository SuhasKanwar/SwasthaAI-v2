"use client";

import React, { useEffect, useState } from "react";
import { userApi, microserviceApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, FileText, UploadCloud, Eye, Bot, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface PrescriptionMedicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration: number;
  chemicalComposition: string;
  form: string;
}

interface PrescriptionRecord {
  id: string;
  date: string;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  pdfUrl?: string | null;
  prescription?: {
    diagnosis: string;
    symptoms: string[];
    doctorAdvice?: string | null;
    followUpDate?: string | null;
    medicines: PrescriptionMedicine[];
  } | null;
}

export default function HealthVaultPage() {
  const { token, isLoggedIn } = useAuth();

  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [reports, setReports] = useState<VaultReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadRecordType, setUploadRecordType] = useState("");
  const [uploading, setUploading] = useState(false);

  const [activeReport, setActiveReport] = useState<VaultReport | null>(null);

  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaMessages, setQaMessages] = useState<
    { id: number; sender: "user" | "bot"; text: string }[]
  >([]);

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
      fetchPrescriptions();
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

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await userApi.get("/api/physical-health/health-vault", {
        params: { page: 1, limit: 50 },
      });
      setPrescriptions(res.data?.records || []);
    } catch {
      toast.error("Failed to load prescriptions.");
    } finally {
      setLoadingPrescriptions(false);
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

  const getAuthToken = () => {
    if (token) return token;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("access_token");
    }
    return null;
  };

  const generateSummary = async () => {
    if (!pinVerified) {
      toast.error("Verify PIN before generating AI summary.");
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error("Missing auth token. Please log in again.");
      return;
    }

    const pdfReports = reports.filter(
      (r) =>
        r.mimeType.toLowerCase().includes("pdf") ||
        r.originalName.toLowerCase().endsWith(".pdf")
    );

    const prescriptionPdfs = prescriptions
      .filter((p) => p.pdfUrl)
      .map((p) => ({
        id: p.id,
        title: `Prescription - ${p.doctorName}`,
        originalName: `prescription-${p.id}.pdf`,
        publicUrl: p.pdfUrl!,
        mimeType: "application/pdf",
      }));

    const allPdfSources = [...pdfReports, ...prescriptionPdfs];
    if (allPdfSources.length === 0) {
      toast.info("No PDF reports or prescriptions available to summarize.");
      return;
    }

    setSummaryLoading(true);
    try {
      let combined = "";

      for (const report of allPdfSources) {
        try {
          const url = `${fileBaseUrl}${report.publicUrl}`;
          const res = await fetch(url);
          if (!res.ok) continue;

          const blob = await res.blob();
          const file = new File([blob], report.originalName, {
            type: blob.type || report.mimeType || "application/pdf",
          });

          const formData = new FormData();
          formData.append(
            "query",
            "Provide a concise, patient-friendly structured summary of this medical report. Focus on: key findings, diagnoses, medications, tests, and recommended follow-ups."
          );
          formData.append("file", file);

          const resp = await microserviceApi.post(
            "/chatbot/query-with-file",
            formData,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          const answer =
            resp.data?.answer || resp.data?.text || "(No summary generated)";
          combined += `### ${report.title || report.originalName}\n${answer}\n\n`;
        } catch (err) {
          console.error("Failed to summarize report", report.id, err);
        }
      }

      if (!combined.trim()) {
        toast.error("Could not generate summary from your reports.");
        return;
      }

      setAiSummary(combined.trim());
      setQaMessages([]);
      toast.success("AI summary generated from your reports.");
    } catch {
      toast.error("Failed to generate AI summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAnalyzeReport = async (report: VaultReport) => {
    if (!pinVerified) {
      toast.error("Verify PIN before analyzing reports.");
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error("Missing auth token. Please log in again.");
      return;
    }

    const isPdf =
      report.mimeType.toLowerCase().includes("pdf") ||
      report.originalName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.info("AI analysis is currently available only for PDF reports.");
      return;
    }

    setSummaryLoading(true);
    try {
      const url = `${fileBaseUrl}${report.publicUrl}`;
      const res = await fetch(url);
      if (!res.ok) {
        toast.error("Failed to download report for analysis.");
        return;
      }

      const blob = await res.blob();
      const file = new File([blob], report.originalName, {
        type: blob.type || report.mimeType || "application/pdf",
      });

      const formData = new FormData();
      formData.append(
        "query",
        "Provide a concise, patient-friendly structured summary of this medical report. Focus on: key findings, diagnoses, medications, tests, and recommended follow-ups."
      );
      formData.append("file", file);

      const resp = await microserviceApi.post(
        "/chatbot/query-with-file",
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const answer =
        resp.data?.answer || resp.data?.text || "(No summary generated)";

      setAiSummary(
        `### ${report.title || report.originalName}\n${answer}`.trim()
      );
      setQaMessages([]);
      toast.success("AI analysis generated for the selected report.");
    } catch {
      toast.error("Failed to analyze this report.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!pinVerified) {
      toast.error("Verify PIN before asking questions.");
      return;
    }
    if (!aiSummary) {
      toast.error("Generate a summary first.");
      return;
    }
    if (!qaQuestion.trim()) return;

    const authToken = getAuthToken();
    if (!authToken) {
      toast.error("Missing auth token. Please log in again.");
      return;
    }

    const text = qaQuestion.trim();
    const userMsg = {
      id: Date.now(),
      sender: "user" as const,
      text,
    };
    setQaMessages((prev) => [...prev, userMsg]);
    setQaQuestion("");
    setQaLoading(true);

    try {
      const query = `You are helping a patient understand their health records.

Here is a consolidated AI-generated summary of their medical reports:
${aiSummary}

Now answer this question in a clear, concise way for the patient:
${text}`;

      const resp = await microserviceApi.post(
        "/chatbot/query",
        { query },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const answer =
        resp.data?.answer ||
        resp.data?.text ||
        "Sorry, I couldn't process your request.";

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot" as const,
        text: answer,
      };
      setQaMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error("Failed to get AI answer.");
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
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
            {/* Prescriptions section */}
            <section className="mb-8">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Prescriptions from your doctors
                  </h2>
                </div>
                {loadingPrescriptions && (
                  <p className="text-sm text-slate-500">Loading prescriptions...</p>
                )}
                {!loadingPrescriptions && prescriptions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No prescriptions available yet.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.map((record) => (
                    <div
                      key={record.id}
                      className="border border-slate-200 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{record.doctorName}</span>
                        <span>{new Date(record.date).toLocaleDateString("en-IN")}</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">Diagnosis</p>
                        <p className="text-slate-600">
                          {record.prescription?.diagnosis || "—"}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">Medicines</p>
                        <ul className="list-disc ml-5 text-slate-600">
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
                    </div>
                  ))}
                </div>
              </div>
            </section>

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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewReport(report)}
                            title="View report"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAnalyzeReport(report)}
                            title="Analyze with AI"
                            disabled={summaryLoading}
                          >
                            <Bot className="w-4 h-4" />
                          </Button>
                        </div>
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
                            Non-PDF file &mdash; will open as download in your
                            browser.
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

            {/* AI summary + Q&A section */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    AI summary & questions
                  </h2>
                </div>
                <Button
                  onClick={generateSummary}
                  disabled={summaryLoading || reports.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {summaryLoading
                    ? "Generating..."
                    : "Generate summary from all reports"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Summary panel with markdown */}
                <div className="border border-slate-200 rounded-lg p-3 text-sm min-h-[180px] max-h-[260px] overflow-y-auto">
                  {aiSummary ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <table
                            className="min-w-full border border-slate-300 my-2 text-xs"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="border px-2 py-1 bg-slate-200"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border px-2 py-1" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-1 last:mb-0" {...props} />
                        ),
                      }}
                    >
                      {aiSummary}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-slate-400">
                      No summary generated yet. Click &quot;Generate summary
                      from all reports&quot; or use the Analyze button on a
                      specific report.
                    </span>
                  )}
                </div>

                {/* Q&A panel with markdown for bot answers */}
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto mb-3 space-y-2 text-sm max-h-[260px]">
                    {qaMessages.length === 0 && (
                      <p className="text-xs text-slate-400">
                        After generating a summary, ask follow-up questions
                        here. SwasthaAI will answer using your report summary.
                      </p>
                    )}
                    {qaMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            m.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {m.sender === "bot" ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ node, ...props }) => (
                                  <table
                                    className="min-w-full border border-slate-300 my-2 text-xs"
                                    {...props}
                                  />
                                ),
                                th: ({ node, ...props }) => (
                                  <th
                                    className="border px-2 py-1 bg-slate-200"
                                    {...props}
                                  />
                                ),
                                td: ({ node, ...props }) => (
                                  <td
                                    className="border px-2 py-1"
                                    {...props}
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong
                                    className="font-semibold"
                                    {...props}
                                  />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className="mb-1 last:mb-0" {...props} />
                                ),
                              }}
                            >
                              {m.text}
                            </ReactMarkdown>
                          ) : (
                            m.text
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Ask a question about your reports..."
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !qaLoading) {
                          handleAskQuestion();
                        }
                      }}
                      disabled={qaLoading || !aiSummary}
                    />
                    <Button
                      onClick={handleAskQuestion}
                      disabled={
                        qaLoading || !qaQuestion.trim() || !aiSummary
                      }
                      className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-3 py-2 rounded-lg"
                      title="Send question"
                    >
                      {qaLoading ? "Asking..." : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}