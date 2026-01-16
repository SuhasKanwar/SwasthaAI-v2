"use client";

import React, { useRef, useState, useEffect } from "react";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Send, UploadCloud, User, Bot, X } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { microserviceApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LinkPreview } from "@/components/ui/link-preview";
import { useAuth } from "@/providers/AuthProvider";

const SUGGESTIONS = [
	{
		title: "Drug Repurposing Scan",
		desc: "Explore new therapeutic indications for an existing molecule.",
		question: "Suggest plausible repurposing indications for [drug] and explain the rationale with key evidence types to verify.",
	},
	{
		title: "Patent Landscape",
		desc: "Identify relevant patents, assignees, and claim themes.",
		question: "Summarize the patent landscape for repurposing [drug] in [indication], including key assignees and claim focus areas.",
	},
	{
		title: "Clinical Trial Evidence",
		desc: "Find and synthesize trials, endpoints, and outcomes.",
		question: "What clinical trials exist for [drug] in [indication]? Summarize phases, endpoints, results, and current status.",
	},
	{
		title: "Literature Synthesis",
		desc: "Aggregate preclinical + clinical findings from papers.",
		question: "Create a structured literature summary for [drug] in [indication]: mechanisms, study types, strength of evidence, and gaps.",
	},
	{
		title: "Mechanism & Target Hypothesis",
		desc: "Connect MoA, pathways, biomarkers, and disease biology.",
		question: "Propose a mechanism-based hypothesis for why [drug] could work in [indication], including pathways and biomarkers to monitor.",
	},
	{
		title: "Safety / PK / DDIs",
		desc: "Assess known safety signals and repurposing constraints.",
		question: "Outline key safety, PK, and drug-drug interaction considerations for using [drug] in [indication], and suggest risk mitigations.",
	},
	{
		title: "Market & Access Snapshot",
		desc: "Understand competition, positioning, and adoption barriers.",
		question: "Give a market and access snapshot for [indication]: standard of care, competitors, unmet needs, and positioning for a repurposed [drug].",
	},
	{
		title: "Innovation Brief (Decision-Ready)",
		desc: "Generate a concise, structured brief with next steps.",
		question: "Create an innovation brief for repurposing [drug] in [indication] with: evidence summary, risks, IP considerations, and recommended next experiments.",
	},
];

export default function ChatbotPage() {
	const { token, isLoggedIn } = useAuth();
	const [messages, setMessages] = useState<any[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [voiceActive, setVoiceActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [deepResearch, setDeepResearch] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}
	}, [messages, loading]);

	const toggleDeepResearch = () => {
		setDeepResearch((prev) => {
			const next = !prev;
			if (next) setSelectedFile(null);
			toast.message(next ? "Deep Research enabled." : "Deep Research disabled.");
			return next;
		});
	};

	const handleSend = async () => {
		if (!input.trim()) return;
		setLoading(true);
		setError(null);

		const userMsg = { id: Date.now(), sender: "user", text: input };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");

		try {
			let responseData: any;

			if (deepResearch) {
				const controller = new AbortController();
				const timeoutId = window.setTimeout(() => controller.abort(), 60_000);

				const res = await fetch("/api/n8n", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ query: userMsg.text }),
					signal: controller.signal,
				}).finally(() => window.clearTimeout(timeoutId));

				if (!res.ok) {
					const errText = await res.text().catch(() => "");
					throw new Error(
						`Deep research request failed: ${res.status} ${res.statusText}${errText ? ` - ${errText.slice(0, 300)}` : ""}`
					);
				}

				const raw = await res.json();
				try {
					responseData = raw.output[0].content.text;
				} catch {
					responseData = { text: raw };
				}
			} else {
				let response;
				if (selectedFile) {
					const formData = new FormData();
					formData.append("query", userMsg.text);
					formData.append("file", selectedFile);

					response = await microserviceApi.post("/chatbot/query-with-file", formData, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});
				} else {
					response = await microserviceApi.post(
						"/chatbot/query",
						{ query: userMsg.text },
						{
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${token}`,
							},
						}
					);
				}
				responseData = response.data;
			}

			const botMsg = {
				id: Date.now() + 1,
				sender: "bot",
				text:
					responseData?.answer ||
					responseData?.text ||
					"Sorry, I couldn't process your request.",
				citations: responseData?.citations || [],
			};
			setMessages((prev) => [...prev, botMsg]);
		} catch (err: any) {
			setError("Failed to get a response. Please try again.");
		} finally {
			setLoading(false);
			setSelectedFile(null);
		}
	};

	const handleVoice = () => {
		if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
			toast.error("Speech recognition is not supported in this browser.");
			return;
		}
		setVoiceActive(true);
		const SpeechRecognition =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;

		recognition.onresult = (event: any) => {
			const transcript = event.results[0][0].transcript;
			setInput(transcript);
			setVoiceActive(false);
		};
		recognition.onerror = () => {
			toast.error("Voice input failed. Please try again.");
			setVoiceActive(false);
		};
		recognition.onend = () => {
			setVoiceActive(false);
		};
		recognition.start();
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (deepResearch) {
			toast.info("File upload is disabled in Deep Research mode.");
			e.target.value = "";
			return;
		}
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0]);
			toast.success(`File "${e.target.files[0].name}" selected!`);
		}
	};

	const removeSelectedFile = () => {
		setSelectedFile(null);
		toast.info("File deselected.");
	};

	if (!isLoggedIn) return <BackToLogin />;

	return (
		<section className="min-h-screen w-full pl-2 pr-2 pt-2 pb-12 flex flex-col items-center">
			<style>
				{`
				.hide-scrollbar::-webkit-scrollbar { display: none; }
				.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
				`}
			</style>

			<div className="w-full max-w-7xl flex-1 flex flex-col justify-center items-center mx-auto">
				{messages.length === 0 && !loading && (
					<div className="flex flex-col items-center mt-4 mb-6 w-full">
						<h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
							<span className="text-slate-800">Swastha</span>
							<span className="bg-linear-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
								AI Research Accelerator
							</span>
							<span className="ml-2">
								<Bot className="inline w-10 h-10 text-blue-400 align-middle" />
							</span>
						</h1>

						<p className="text-lg text-slate-600 text-center mb-8">
							Agentic AI for faster drug repurposing—synthesizing patents, trials, literature, and market data into decision-ready innovation briefs.
						</p>

						<div className="flex flex-wrap justify-center gap-4 mb-10">
							{SUGGESTIONS.map((s, i) => (
								<div
									key={i}
									className="rounded-xl border border-slate-200 shadow-sm p-5 w-72 bg-white hover:shadow-md transition group cursor-pointer"
									style={{ minHeight: 120 }}
									onClick={() => setInput(s.question)}
									role="button"
									tabIndex={0}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-semibold text-lg text-slate-700">
											{s.title}
										</span>
										<span className="text-blue-500 group-hover:translate-x-1 transition">
											<svg
												width="20"
												height="20"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<line x1="5" y1="12" x2="19" y2="12" />
												<polyline points="12 5 19 12 12 19" />
											</svg>
										</span>
									</div>
									<div className="text-slate-500 text-sm">
										{s.desc}
									</div>
								</div>
							))}
						</div>
						<div className="text-xs text-slate-400 text-center mt-2">
							<span className="font-semibold text-blue-500">Master–Worker agent workflow</span>{" "}
							&mdash; Upload research documents and ask questions to generate structured, citable insights.
						</div>
					</div>
				)}

				<div
					ref={chatContainerRef}
					className={clsx(
						"flex-1 w-full max-w-6xl mx-auto mb-2 overflow-y-auto transition-all hide-scrollbar",
						messages.length === 0 ? "hidden" : "block"
					)}
					style={{ minHeight: 350, maxHeight: 700 }}
				>
					<AnimatePresence initial={false}>
						{messages.map((msg) => (
							<motion.div
								key={msg.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.25, ease: "easeOut" }}
								className={clsx(
									"flex items-start gap-3 my-4",
									msg.sender === "user" ? "justify-end" : "justify-start"
								)}
							>
								{msg.sender === "bot" && (
									<div className="rounded-full bg-blue-100 p-2">
										<Bot className="w-5 h-5 text-blue-500" />
									</div>
								)}
								<div
									className={clsx(
										"rounded-xl px-4 py-2 max-w-[70%] whitespace-pre-line",
										msg.sender === "user"
											? "bg-linear-to-r from-blue-500 to-teal-500 text-white ml-auto"
											: "bg-teal-100 text-slate-800"
									)}
								>
									{msg.sender === "bot" ? (
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											components={{
												table: ({node, ...props}) => (
													<table className="min-w-full border border-slate-300 my-2" {...props} />
												),
												th: ({node, ...props}) => (
													<th className="border px-2 py-1 bg-slate-200" {...props} />
												),
												td: ({node, ...props}) => (
													<td className="border px-2 py-1" {...props} />
												),
												strong: ({node, ...props}) => (
													<strong className="font-semibold" {...props} />
												),
											}}
										>
											{msg.text}
										</ReactMarkdown>
									) : (
										msg.text
									)}
									{msg.sender === "bot" && Array.isArray(msg.citations) && msg.citations.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-3">
											{msg.citations.map((citation: any, idx: number) => (
												<LinkPreview
													key={idx}
													url={citation}
													className="rounded-full bg-blue-300 text-blue-700 px-3 py-1 text-xs font-medium hover:bg-blue-400 transition border border-blue-500"
												>
													{`Source ${idx + 1}`}
												</LinkPreview>
											))}
										</div>
									)}
								</div>
								{msg.sender === "user" && (
									<div className="rounded-full bg-slate-200 p-2">
										<User className="w-5 h-5 text-slate-500" />
									</div>
								)}
							</motion.div>
						))}
					</AnimatePresence>
					{loading && (
						<div className="flex items-center gap-2 my-4">
							<Loader2 className="w-5 h-5 animate-spin text-blue-400" />
							<span className="text-slate-400 text-sm">
								SwasthaAI bot in thinking...
							</span>
						</div>
					)}
					{error && (
						<div className="text-red-500 text-sm my-2">{error}</div>
					)}
				</div>
			</div>

			<div className="w-full max-w-4xl mx-auto mb-6">
				{selectedFile && (
					<div className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-2 mb-2">
						<span className="text-sm text-slate-700 truncate max-w-[80%]">
							{selectedFile.name}
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="text-slate-500"
							onClick={removeSelectedFile}
							title="Remove file"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				)}
				<div className="rounded-2xl border border-slate-200 shadow-md flex items-center px-6 py-3 gap-2 bg-white">
					<Button
						variant={deepResearch ? "default" : "outline"}
						className={clsx(
							deepResearch
								? "bg-linear-to-r from-blue-500 to-teal-500 text-white"
								: "text-slate-600"
						)}
						onClick={toggleDeepResearch}
						disabled={loading}
						title="Toggle Deep Research mode"
					>
						Deep Research
					</Button>

					<Button
						variant="outline"
						size="icon"
						className="text-slate-500"
						onClick={() => fileInputRef.current?.click()}
						title={
							deepResearch
								? "Disabled in Deep Research mode"
								: "Upload research document"
						}
						disabled={loading || deepResearch}
					>
						<UploadCloud className="w-5 h-5" />
					</Button>
					<input
						type="file"
						accept=".pdf,.jpg,.jpeg,.png"
						ref={fileInputRef}
						className="hidden"
						onChange={handleFileUpload}
						disabled={loading || deepResearch}
					/>
					<input
						type="text"
						className="flex-1 outline-none border-none bg-transparent px-4 text-base max-w-[600px]"
						placeholder="Ask about a drug, indication, or evidence (patents, trials, market, etc.)"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !loading) handleSend();
						}}
						disabled={loading}
					/>
					<Button
						variant={voiceActive ? "destructive" : "outline"}
						size="icon"
						className={clsx(
							"text-blue-500",
							voiceActive && "animate-pulse"
						)}
						onClick={handleVoice}
						title="Voice input"
						disabled={loading || voiceActive}
					>
						<Mic className="w-5 h-5" />
					</Button>
					<Button
						variant="default"
						size="icon"
						className="bg-linear-to-r from-blue-500 to-teal-500 text-white"
						onClick={handleSend}
						disabled={loading || !input.trim()}
						title="Send"
					>
						<Send className="w-5 h-5" />
					</Button>
				</div>
				<div className="text-xs text-slate-400 text-center mt-2">
					This is an{" "}
					<span className="font-semibold text-blue-500">agentic, multi-source research assistant</span>
					. Upload documents and generate structured, decision-ready innovation briefs.
				</div>
			</div>
		</section>
	);
}