"use client";

import { Copy, Download, FileText, Check } from "lucide-react";
import { useState } from "react";

interface TranscriptCardProps {
    transcript: string;
}

export default function TranscriptCard({ transcript }: TranscriptCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(transcript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([transcript], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="glass-card p-6 flex flex-col gap-4 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-violet-400" />
                    </div>
                    <h2 className="font-semibold text-[var(--text-primary)]">Transcript</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        id="copy-transcript-btn"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                        id="download-transcript-btn"
                        onClick={handleDownload}
                        title="Download as .txt"
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Content */}
            <div className="max-h-72 overflow-y-auto pr-1">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {transcript}
                </p>
            </div>

            {/* Word count */}
            <p className="text-xs text-[var(--text-secondary)] opacity-60">
                {transcript.split(/\s+/).filter(Boolean).length} words
            </p>
        </div>
    );
}
