"use client";

import { Copy, Download, Sparkles, Check } from "lucide-react";
import { useState } from "react";

interface SummaryCardProps {
    summary: string;
    providerUsed?: string;
    durationSeconds?: number;
}

export default function SummaryCard({ summary, providerUsed, durationSeconds }: SummaryCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([summary], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `summary-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="glass-card p-6 flex flex-col gap-4 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="font-semibold text-[var(--text-primary)]">AI Summary</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        id="copy-summary-btn"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                        id="download-summary-btn"
                        onClick={handleDownload}
                        title="Download as .txt"
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Content */}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {summary}
            </p>

            {/* Meta */}
            {(providerUsed || durationSeconds !== undefined) && (
                <div className="flex items-center gap-3 flex-wrap">
                    {providerUsed && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Sparkles className="w-3 h-3" />
                            {providerUsed === "gemini" ? "Gemini 2.5 Flash Lite" : "Whisper + BART"}
                        </span>
                    )}
                    {durationSeconds !== undefined && (
                        <span className="text-xs text-[var(--text-secondary)] opacity-60">
                            Processed in {durationSeconds}s
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
