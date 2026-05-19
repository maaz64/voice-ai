"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, Upload, RotateCcw, Zap, ChevronDown } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import FileUploader from "@/components/FileUploader";
import TranscriptCard from "@/components/TranscriptCard";
import SummaryCard from "@/components/SummaryCard";
import ProcessingStatus from "@/components/ProcessingStatus";
import { transcribeAudio, TranscribeResult } from "@/lib/api";

type Tab = "record" | "upload";
type Provider = "gemini" | "huggingface";
type Toast = { id: number; type: "error" | "success"; message: string };

const PROVIDERS: { value: Provider; label: string; icon: string }[] = [
  { value: "gemini", label: "Gemini 1.5 Flash", icon: "⚡" },
  { value: "huggingface", label: "Hugging Face", icon: "🤗" },
];

let toastId = 0;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("record");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProvider = PROVIDERS.find((p) => p.value === provider)!;

  const addToast = useCallback((type: "error" | "success", message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const handleAudioReady = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setResult(null);
      try {
        const data = await transcribeAudio(file, provider);
        setResult(data);
        addToast("success", "Transcription complete!");
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "An unexpected error occurred.";
        addToast("error", detail);
      } finally {
        setIsProcessing(false);
      }
    },
    [provider, addToast]
  );

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleTranscribeUpload = useCallback(async () => {
    if (!selectedFile) return;
    await handleAudioReady(selectedFile);
  }, [selectedFile, handleAudioReady]);

  const handleClear = () => {
    setResult(null);
    setSelectedFile(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] leading-none">
                VoiceScribe AI
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Audio → Transcript + Summary
              </p>
            </div>
          </div>

          {/* Provider selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="provider-selector"
              type="button"
              onClick={() => !isProcessing && setDropdownOpen((prev) => !prev)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--border-hover)]"
            >
              <span className="text-base leading-none">{activeProvider.icon}</span>
              <span className="hidden sm:inline font-medium">{activeProvider.label}</span>
              <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="dropdown-menu absolute right-0 mt-2 w-52 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[60]">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setProvider(p.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                      ${provider === p.value
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                  >
                    <span className="text-lg leading-none">{p.icon}</span>
                    <span className="font-medium">{p.label}</span>
                    {provider === p.value && (
                      <svg className="w-4 h-4 ml-auto text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            Powered by Gemini-2.5-flash-lite
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
            Transcribe &amp; Summarize
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
              Any Audio Instantly
            </span>
          </h2>
          <p className="text-[var(--text-secondary)] mt-3 max-w-xl mx-auto text-base">
            Record directly from your mic or upload an audio file. Get a full
            transcript and AI-powered summary in seconds.
          </p>
        </div>

        {/* Input card */}
        <div className="glass-card p-2 mb-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)]">
            <button
              id="tab-record"
              onClick={() => { setActiveTab("record"); handleClear(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === "record"
                  ? "tab-active"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              <Mic className="w-4 h-4" />
              Record
            </button>
            <button
              id="tab-upload"
              onClick={() => { setActiveTab("upload"); handleClear(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === "upload"
                  ? "tab-active"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>

          {/* Tab content */}
          <div className="px-4">
            {activeTab === "record" ? (
              <AudioRecorder onAudioReady={handleAudioReady} disabled={isProcessing} />
            ) : (
              <FileUploader
                onFileSelected={handleFileSelected}
                onTranscribe={handleTranscribeUpload}
                disabled={isProcessing}
              />
            )}
          </div>
        </div>

        {/* Processing state */}
        {isProcessing && <ProcessingStatus />}

        {/* Results */}
        {result && !isProcessing && (
          <div className="space-y-6">
            {/* Clear button */}
            <div className="flex justify-end">
              <button
                id="clear-btn"
                onClick={handleClear}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]"
              >
                <RotateCcw className="w-4 h-4" />
                Clear / New Recording
              </button>
            </div>

            {/* Cards side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TranscriptCard transcript={result.transcript} />
              <SummaryCard
                summary={result.summary}
                providerUsed={result.provider_used}
                durationSeconds={result.duration_seconds}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-secondary)]">
        <p>
          VoiceScribe AI &mdash; Built with Next.js &amp; FastAPI &middot; Powered by{" "}
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            Google Gemini
          </a>
        </p>
      </footer>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
